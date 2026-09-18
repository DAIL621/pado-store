import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ORDER_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const ALLOWED_CODES = new Set([
  "PAY_PROCESS_CANCELED",
  "PAY_PROCESS_ABORTED",
  "REJECT_CARD_COMPANY",
  "TOSS_PAYMENT_FAILED"
]);

function normalizeFailureCode(value: unknown) {
  const code = String(value ?? "").trim().toUpperCase();
  return ALLOWED_CODES.has(code) ? code : "TOSS_PAYMENT_FAILED";
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "결제 처리 설정을 확인 중입니다." }, { status: 503 });
  }

  const parsed = await readJsonBody(request, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const orderId = String(parsed.body.orderId ?? "").trim();
  if (!ORDER_ID_RE.test(orderId)) {
    return NextResponse.json({ ok: false, message: "주문번호가 올바르지 않습니다." }, { status: 400 });
  }
  const limited = await enforceRateLimit(request, "paymentConfirm", {
    userId: user.id,
    resourceId: orderId
  });
  if (!limited.ok) return limited.response;

  const code = normalizeFailureCode(parsed.body.code);
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select("id,user_id,status,security_version,payments(id,status)")
    .eq("order_no", orderId)
    .maybeSingle();
  if (error || !order) {
    return NextResponse.json({ ok: false, message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.user_id !== user.id) {
    return NextResponse.json({ ok: false, message: "이 주문을 변경할 권한이 없습니다." }, { status: 403 });
  }
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  if (Number(order.security_version) !== 2 || !payment) {
    return NextResponse.json({ ok: false, message: "지원하지 않는 주문입니다." }, { status: 409 });
  }
  if (order.status !== "pending" || payment.status !== "ready") {
    return NextResponse.json({
      ok: true, recorded: false, protected: true, status: String(order.status)
    });
  }

  const { data: updated, error: updateError } = await db
    .from("payments")
    .update({ failure_code: code })
    .eq("id", payment.id)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (updateError) {
    return NextResponse.json({ ok: false, message: "결제 실패 상태를 기록하지 못했습니다." }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ ok: true, recorded: false, protected: true });
  }
  const eventKey = `checkout-failed:${createHash("sha256")
    .update(`${order.id}:${code}`)
    .digest("hex")}`;
  const { error: eventError } = await db.from("payment_events").upsert({
    order_id: order.id,
    payment_id: payment.id,
    event_key: eventKey,
    event_type: code === "PAY_PROCESS_CANCELED" ? "customer_cancelled" : "checkout_failed",
    payload: { code }
  }, { onConflict: "event_key", ignoreDuplicates: true });
  if (eventError) {
    return NextResponse.json({ ok: false, message: "결제 실패 이벤트를 기록하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, recorded: true, protected: false });
}
