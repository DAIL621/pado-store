import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { readJsonBody } from "@/lib/api/request";
import { writeOperationLogBestEffort } from "@/lib/operations/automation";
import type { OperationEvent } from "@/lib/operations/events";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RefundItemInput = {
  orderItemId: string;
  quantity: number;
  amount: number;
  stockRestoreQuantity: number;
};

type TossCancelResponse = {
  paymentKey?: string;
  orderId?: string;
  totalAmount?: number;
  balanceAmount?: number;
  cancels?: Array<{
    cancelAmount?: number;
    cancelStatus?: string;
    transactionKey?: string;
  }>;
  code?: string;
  message?: string;
};

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function parseItems(value: unknown): RefundItemInput[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return null;
  const items = value.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      orderItemId: String(row.orderItemId ?? ""),
      quantity: Number(row.quantity),
      amount: Number(row.amount ?? 0),
      stockRestoreQuantity: Number(row.stockRestoreQuantity ?? 0)
    };
  });
  return items.every((item) =>
    UUID_RE.test(item.orderItemId)
    && Number.isSafeInteger(item.quantity) && item.quantity > 0
    && Number.isSafeInteger(item.amount) && item.amount >= 0
    && Number.isSafeInteger(item.stockRestoreQuantity)
    && item.stockRestoreQuantity >= 0 && item.stockRestoreQuantity <= item.quantity
  ) ? items : null;
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  const parsed = await readJsonBody(request, 64 * 1024);
  if (!parsed.ok) return parsed.response;

  const orderId = String(parsed.body.orderId ?? "").trim();
  const reason = String(parsed.body.reason ?? "").trim();
  const requestedAmount = Number(parsed.body.amount);
  const idempotencyKey = String(
    parsed.body.idempotencyKey ?? request.headers.get("idempotency-key") ?? ""
  ).trim();
  if (!UUID_RE.test(orderId) || !UUID_RE.test(idempotencyKey)
      || !Number.isSafeInteger(requestedAmount) || requestedAmount <= 0
      || reason.length < 1 || reason.length > 500) {
    return NextResponse.json({ ok: false, message: "환불 요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const limited = await enforceRateLimit(request, "adminRefund", {
    userId: admin.session.user.id,
    resourceId: orderId
  });
  if (!limited.ok) return limited.response;

  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, message: "결제 설정을 확인해주세요." }, { status: 503 });
  }
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select("id,order_no,status,total_amount,security_version,payments(id,payment_key,amount,status),order_items(id,quantity,unit_price)")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) return NextResponse.json({ ok: false, message: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (Number(order.security_version) !== 2) {
    return NextResponse.json(
      { ok: false, message: "기존 주문은 이력으로 보존되며 보안 v2 자동 환불 대상이 아닙니다." },
      { status: 409 }
    );
  }
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  if (!payment?.payment_key || !["paid", "partial_refunded"].includes(String(payment.status))) {
    return NextResponse.json({ ok: false, message: "환불 가능한 결제 상태가 아닙니다." }, { status: 409 });
  }

  let items = parseItems(parsed.body.items);
  if (!items) {
    if (requestedAmount !== Number(payment.amount)) {
      return NextResponse.json(
        { ok: false, message: "부분 환불은 상품별 수량과 금액이 필요합니다." },
        { status: 400 }
      );
    }
    if (["shipped", "delivered"].includes(String(order.status))) {
      return NextResponse.json(
        { ok: false, message: "출고 이후 환불은 검수된 상품별 재고 복구 수량을 지정해야 합니다." },
        { status: 400 }
      );
    }
    const rows = Array.isArray(order.order_items) ? order.order_items : [];
    items = rows.map((item) => ({
      orderItemId: String(item.id),
      quantity: Number(item.quantity),
      amount: Number(item.unit_price) * Number(item.quantity),
      stockRestoreQuantity: Number(item.quantity)
    }));
  }
  const processingToken = randomUUID();
  const requestFingerprint = fingerprint({ orderId, requestedAmount, reason, items });
  const adminId = UUID_RE.test(admin.session.user.id) ? admin.session.user.id : null;
  const claim = await db.rpc("pado_claim_refund_v2", {
    p_order_id: orderId,
    p_idempotency_key: idempotencyKey,
    p_request_fingerprint: requestFingerprint,
    p_requested_amount: requestedAmount,
    p_reason: reason,
    p_requested_by_admin: adminId,
    p_items: items,
    p_processing_token: processingToken
  });
  if (claim.error) {
    const conflict = /IDEMPOTENCY|EXCEEDED|NOT_REFUNDABLE/.test(claim.error.message);
    return NextResponse.json(
      { ok: false, message: conflict ? "환불 요청이 기존 처리 또는 허용 범위와 충돌합니다." : "환불을 시작하지 못했습니다." },
      { status: conflict ? 409 : 500 }
    );
  }
  const claimed = claim.data as {
    refundId: string;
    paymentKey: string;
    alreadyProcessed: boolean;
    status: string;
    amount: number;
  };
  if (claimed.alreadyProcessed) {
    return NextResponse.json({ ok: true, refund: { id: claimed.refundId, status: claimed.status, alreadyProcessed: true } });
  }

  let response: Response;
  let toss: TossCancelResponse;
  try {
    response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(claimed.paymentKey)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `refund-${claimed.refundId}`
      },
      body: JSON.stringify({ cancelReason: reason, cancelAmount: requestedAmount })
    });
    toss = await response.json().catch(() => ({})) as TossCancelResponse;
  } catch {
    await db.rpc("pado_fail_refund_v2", {
      p_refund_id: claimed.refundId,
      p_processing_token: processingToken,
      p_failure_code: "TOSS_CANCEL_NETWORK_ERROR",
      p_reconciliation_required: true
    });
    return NextResponse.json(
      { ok: false, code: "REFUND_RECONCILIATION_REQUIRED", message: "환불 결과를 확인 중입니다." },
      { status: 202 }
    );
  }
  if (!response.ok) {
    await db.rpc("pado_fail_refund_v2", {
      p_refund_id: claimed.refundId,
      p_processing_token: processingToken,
      p_failure_code: toss.code ?? "TOSS_CANCEL_FAILED",
      p_reconciliation_required: false
    });
    return NextResponse.json({ ok: false, message: toss.message ?? "환불 요청에 실패했습니다." }, { status: 400 });
  }
  const cancel = [...(toss.cancels ?? [])].reverse().find((row) =>
    row.cancelStatus === "DONE" && Number(row.cancelAmount) === requestedAmount
  );
  if (toss.paymentKey !== claimed.paymentKey || toss.orderId !== order.order_no
      || !cancel?.transactionKey || Number(toss.totalAmount) !== Number(payment.amount)) {
    await db.rpc("pado_fail_refund_v2", {
      p_refund_id: claimed.refundId,
      p_processing_token: processingToken,
      p_failure_code: "TOSS_CANCEL_RESPONSE_MISMATCH",
      p_reconciliation_required: true
    });
    return NextResponse.json(
      { ok: false, code: "REFUND_RECONCILIATION_REQUIRED", message: "환불 결과를 확인 중입니다." },
      { status: 202 }
    );
  }
  const finalized = await db.rpc("pado_finalize_refund_v2", {
    p_refund_id: claimed.refundId,
    p_processing_token: processingToken,
    p_approved_amount: requestedAmount,
    p_cancel_transaction_key: cancel.transactionKey
  });
  if (finalized.error) {
    await db.rpc("pado_fail_refund_v2", {
      p_refund_id: claimed.refundId,
      p_processing_token: processingToken,
      p_failure_code: "REFUND_DB_FINALIZE_FAILED",
      p_reconciliation_required: true
    });
    return NextResponse.json(
      { ok: false, code: "REFUND_RECONCILIATION_REQUIRED", message: "환불은 승인됐으나 내부 확인이 필요합니다." },
      { status: 202 }
    );
  }
  const finalState = await db.from("refunds").select("status,approved_amount").eq("id", claimed.refundId).maybeSingle();
  if (finalState.error
      || !["partially_refunded", "refunded"].includes(String(finalState.data?.status))
      || Number(finalState.data?.approved_amount) !== requestedAmount) {
    await db.rpc("pado_mark_refund_reconciliation_v2", {
      p_refund_id: claimed.refundId,
      p_failure_code: "FINAL_REFUND_STATE_UNVERIFIED"
    });
    return NextResponse.json(
      { ok: false, code: "REFUND_RECONCILIATION_REQUIRED", message: "환불 최종 상태를 확인 중입니다." },
      { status: 202 }
    );
  }
  const events: OperationEvent[] = [{
    type: "refund_completed",
    orderId,
    orderNo: order.order_no,
    actor: { id: admin.session.user.id, email: admin.session.user.email, role: "admin" },
    amount: requestedAmount,
    provider: "toss",
    reason
  }];
  await writeOperationLogBestEffort(db, orderId, events);
  return NextResponse.json({ ok: true, refund: { id: claimed.refundId, status: finalized.data?.status } });
}
