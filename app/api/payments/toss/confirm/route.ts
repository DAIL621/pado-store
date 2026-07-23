import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { writeNotificationEventsBestEffort, writeOperationLogBestEffort } from "@/lib/operations/automation";
import type { OperationEvent } from "@/lib/operations/events";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ORDER_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const PAYMENT_KEY_RE = /^[A-Za-z0-9_-]{10,200}$/;
const SUCCESS_METHODS = new Set([
  "카드", "간편결제", "계좌이체", "가상계좌", "휴대폰",
  "문화상품권", "도서문화상품권", "게임문화상품권", "해외간편결제",
  "CARD", "EASY_PAY", "TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE_PHONE", "GIFT_CERTIFICATE", "FOREIGN_EASY_PAY"
]);

type TossPayment = {
  paymentKey?: string;
  orderId?: string;
  status?: string;
  method?: string;
  totalAmount?: number;
  approvedAt?: string;
  cancels?: unknown[] | null;
  code?: string;
  message?: string;
};

function tossHeaders(secretKey: string, idempotencyKey?: string) {
  return {
    Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
  };
}

async function queryTossPayment(secretKey: string, paymentKey: string) {
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
    headers: tossHeaders(secretKey), cache: "no-store"
  });
  const body = await response.json().catch(() => ({})) as TossPayment;
  return { ok: response.ok, body };
}

async function cancelApprovedPayment(secretKey: string, paymentKey: string, orderId: string) {
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
    method: "POST",
    headers: tossHeaders(secretKey, `stock-failure-${orderId}`),
    body: JSON.stringify({ cancelReason: "결제 승인 직후 재고 확정 실패 자동 취소" })
  });
  return response.ok;
}

function validApprovedPayment(payment: TossPayment, expected: { paymentKey: string; orderId: string; amount: number }) {
  return payment.paymentKey === expected.paymentKey
    && payment.orderId === expected.orderId
    && Number.isSafeInteger(Number(payment.totalAmount))
    && Number(payment.totalAmount) === expected.amount
    && payment.status === "DONE"
    && typeof payment.method === "string"
    && SUCCESS_METHODS.has(payment.method)
    && typeof payment.approvedAt === "string"
    && (!Array.isArray(payment.cancels) || payment.cancels.length === 0);
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

  const parsed = await readJsonBody(request, 32 * 1024);
  if (!parsed.ok) return parsed.response;
  const paymentKey = String(parsed.body.paymentKey ?? "").trim();
  const orderId = String(parsed.body.orderId ?? "").trim();
  const amount = Number(parsed.body.amount);
  if (!PAYMENT_KEY_RE.test(paymentKey) || !ORDER_ID_RE.test(orderId) || !Number.isSafeInteger(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, message: "결제 승인 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const limited = await enforceRateLimit(request, "paymentConfirm", { userId: user.id, resourceId: orderId });
  if (!limited.ok) return limited.response;
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey || !hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "결제 처리 설정을 확인 중입니다." }, { status: 503 });
  }

  const db = createAdminClient();
  const { data: order, error: orderError } = await db
    .from("orders")
    .select("id,order_no,user_id,status,total_amount,security_version,expires_at,expired_at,payments(id,status,amount,toss_order_id,payment_key)")
    .eq("order_no", orderId).maybeSingle();
  if (orderError || !order) return NextResponse.json({ ok: false, message: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ ok: false, message: "이 주문을 결제할 권한이 없습니다." }, { status: 403 });
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;

  if (order.status === "paid" && payment?.status === "paid" && payment.payment_key === paymentKey) {
    return NextResponse.json({ ok: true, payment: { orderId, status: "paid", alreadyConfirmed: true } });
  }
  if (Number(order.security_version) !== 2) {
    return NextResponse.json({ ok: false, message: "기존 주문은 새 결제 경로에서 승인할 수 없습니다." }, { status: 409 });
  }
  if (order.status !== "pending" || order.expired_at || !order.expires_at || new Date(order.expires_at) <= new Date()) {
    return NextResponse.json({ ok: false, message: "결제할 수 없거나 만료된 주문입니다." }, { status: 409 });
  }
  if (!payment || payment.status !== "ready" || payment.toss_order_id !== orderId || Number(payment.amount) !== amount || Number(order.total_amount) !== amount) {
    return NextResponse.json({ ok: false, message: "주문과 결제 금액 또는 상태가 일치하지 않습니다." }, { status: 409 });
  }
  if (payment.payment_key && payment.payment_key !== paymentKey) {
    return NextResponse.json({ ok: false, message: "다른 결제키가 이미 연결된 주문입니다." }, { status: 409 });
  }

  const processingToken = randomUUID();
  const claim = await db.rpc("pado_claim_payment_v2", {
    p_order_id: order.id, p_user_id: user.id, p_payment_key: paymentKey, p_processing_token: processingToken
  });
  if (claim.error) {
    return NextResponse.json({ ok: false, message: "이미 처리 중이거나 결제할 수 없는 주문입니다." }, { status: 409 });
  }

  let tossPayment: TossPayment;
  let response: Response | null = null;
  try {
    response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: tossHeaders(secretKey, `confirm-${order.id}`),
      body: JSON.stringify({ paymentKey, orderId, amount })
    });
    tossPayment = await response.json().catch(() => ({})) as TossPayment;
  } catch {
    const queried = await queryTossPayment(secretKey, paymentKey);
    tossPayment = queried.body;
    response = queried.ok ? new Response(null, { status: 200 }) : null;
  }

  if (!response?.ok) {
    const queried = await queryTossPayment(secretKey, paymentKey);
    if (!queried.ok || queried.body.status !== "DONE") {
      await db.rpc("pado_fail_payment_v2", {
        p_order_id: order.id, p_processing_token: processingToken,
        p_failure_code: tossPayment.code || "TOSS_CONFIRM_FAILED", p_reconciliation_required: false
      });
      return NextResponse.json({ ok: false, message: tossPayment.message || "결제 승인에 실패했습니다." }, { status: 400 });
    }
    tossPayment = queried.body;
  }

  if (!validApprovedPayment(tossPayment, { paymentKey, orderId, amount })) {
    await db.rpc("pado_fail_payment_v2", {
      p_order_id: order.id, p_processing_token: processingToken,
      p_failure_code: "TOSS_RESPONSE_MISMATCH", p_reconciliation_required: true
    });
    return NextResponse.json({ ok: false, code: "PAYMENT_RECONCILIATION_REQUIRED", message: "결제 확인이 필요합니다. 고객센터에서 확인 후 안내드리겠습니다." }, { status: 202 });
  }

  const finalized = await db.rpc("pado_finalize_payment_v2", {
    p_order_id: order.id, p_processing_token: processingToken, p_payment_key: paymentKey,
    p_method: tossPayment.method, p_approved_at: tossPayment.approvedAt,
    p_provider_payload: { status: tossPayment.status, orderId: tossPayment.orderId, totalAmount: tossPayment.totalAmount }
  });
  if (finalized.error) {
    const cancelled = await cancelApprovedPayment(secretKey, paymentKey, orderId);
    await db.rpc("pado_fail_payment_v2", {
      p_order_id: order.id, p_processing_token: processingToken,
      p_failure_code: cancelled ? "AUTO_CANCELLED_AFTER_DB_FAILURE" : "DB_FINALIZE_FAILED",
      p_reconciliation_required: !cancelled
    });
    return NextResponse.json(
      { ok: false, code: cancelled ? "PAYMENT_CANCELLED" : "PAYMENT_RECONCILIATION_REQUIRED", message: cancelled ? "재고 확정에 실패해 결제가 자동 취소되었습니다." : "결제 확인이 필요합니다. 고객센터에서 확인 후 안내드리겠습니다." },
      { status: cancelled ? 409 : 202 }
    );
  }

  const finalState = await db.from("orders").select("status,payments(status,payment_key)").eq("id", order.id).single();
  const finalPayment = Array.isArray(finalState.data?.payments) ? finalState.data?.payments[0] : finalState.data?.payments;
  if (finalState.error || finalState.data?.status !== "paid" || finalPayment?.status !== "paid" || finalPayment.payment_key !== paymentKey) {
    await db.rpc("pado_mark_payment_reconciliation_v2", {
      p_order_id: order.id, p_failure_code: "FINAL_STATE_UNVERIFIED"
    });
    return NextResponse.json({ ok: false, code: "PAYMENT_RECONCILIATION_REQUIRED", message: "결제 최종 상태를 확인 중입니다." }, { status: 202 });
  }

  const events: OperationEvent[] = [{
    type: "payment_approved", orderId: order.id, orderNo: orderId,
    actor: { id: user.id, role: "customer" }, amount, provider: "toss"
  }];
  await writeOperationLogBestEffort(db, order.id, events);
  await writeNotificationEventsBestEffort(db, events);
  return NextResponse.json({ ok: true, payment: { orderId, status: "paid", method: tossPayment.method, approvedAt: tossPayment.approvedAt } });
}
