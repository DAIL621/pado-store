import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { writeOperationLogBestEffort } from "@/lib/operations/automation";
import type { OperationEvent } from "@/lib/operations/events";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase 관리자 환경변수가 필요합니다." }, { status: 503 });
  }

  const body = parsedBody.body;
  const eventType = String(body.eventType ?? body.type ?? "unknown");
  const normalizedEvent = eventType.toUpperCase();
  const allowedEvents = new Set(["PAYMENT_STATUS_CHANGED", "PAYMENT_DONE", "PAYMENT_FAILED", "PAYMENT_CANCELED"]);
  if (!allowedEvents.has(normalizedEvent)) {
    return NextResponse.json({ ok: false, message: "지원하지 않는 웹훅 이벤트입니다." }, { status: 400 });
  }
  const orderNo = String(body.orderId ?? body.orderNo ?? body.data?.orderId ?? "").trim();
  const paymentKey = String(body.paymentKey ?? body.data?.paymentKey ?? "").trim();
  const supabase = createAdminClient();

  const { data: payment } = paymentKey
    ? await supabase.from("payments").select("order_id, orders(id, order_no)").eq("payment_key", paymentKey).maybeSingle()
    : orderNo
      ? await supabase.from("payments").select("order_id, orders(id, order_no)").eq("toss_order_id", orderNo).maybeSingle()
      : { data: null };

  const order = Array.isArray(payment?.orders) ? payment?.orders[0] : payment?.orders;
  if (!payment || !order) return NextResponse.json({ ok: false, message: "일치하는 결제를 찾을 수 없습니다." }, { status: 404 });
  const orderId = payment?.order_id ?? order?.id ?? null;
  const resolvedOrderNo = order?.order_no ?? orderNo;
  const amount = Number(body.amount ?? body.data?.amount ?? 0) || null;
  const events: OperationEvent[] = normalizedEvent.includes("FAIL") || normalizedEvent.includes("CANCEL")
    ? [
        {
          type: "payment_failed",
          orderId,
          orderNo: resolvedOrderNo,
          actor: { role: "system" },
          amount,
          provider: "toss-webhook",
          reason: eventType
        }
      ]
    : [
        {
          type: "payment_approved",
          orderId,
          orderNo: resolvedOrderNo,
          actor: { role: "system" },
          amount,
          provider: "toss-webhook"
        }
      ];

  await writeOperationLogBestEffort(supabase, orderId, events);
  return NextResponse.json({ ok: true, eventType, orderId, orderNo: resolvedOrderNo });
}
