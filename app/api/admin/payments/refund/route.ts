import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { readJsonBody } from "@/lib/api/request";
import {
  buildInventoryAutomation,
  writeInventoryLogsBestEffort,
  writeNotificationEventsBestEffort,
  writeOperationLogBestEffort,
  writeOrderStatusHistoryBestEffort
} from "@/lib/operations/automation";
import type { OperationEvent } from "@/lib/operations/events";
import { createAdminClient } from "@/lib/supabase/admin";

type RefundOrderItem = {
  option_id: string | null;
  quantity: number;
  product_name: string;
  option_name: string;
};

async function restoreRefundedStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("option_id, quantity, product_name, option_name")
    .eq("order_id", orderId);

  if (error) return { ok: false as const, message: error.message, automations: [] };

  const automations = [];
  for (const item of (items ?? []) as RefundOrderItem[]) {
    if (!item.option_id) continue;
    const { data: option } = await supabase.from("product_options").select("id, stock").eq("id", item.option_id).single();
    if (!option) continue;

    const previousStock = Number(option.stock) || 0;
    const nextStock = previousStock + Number(item.quantity);
    const { error: updateError } = await supabase.from("product_options").update({ stock: nextStock }).eq("id", item.option_id);
    if (updateError) return { ok: false as const, message: updateError.message, automations };

    automations.push(
      await buildInventoryAutomation({
        optionId: item.option_id,
        productName: `${item.product_name} ${item.option_name}`,
        previousStock,
        nextStock,
        reason: "returned",
        actor: { role: "system" }
      })
    );
  }

  return { ok: true as const, automations };
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const orderId = String(parsedBody.body.orderId ?? "").trim();
  const cancelReason = String(parsedBody.body.reason ?? "관리자 환불 처리").trim();
  const refundAmount = Number(parsedBody.body.amount ?? 0);
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;

  if (!orderId) return NextResponse.json({ ok: false, message: "환불할 주문 ID가 필요합니다." }, { status: 400 });
  if (!secretKey) return NextResponse.json({ ok: false, message: "Toss Payments 시크릿 키가 없습니다." }, { status: 503 });

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_no, status, total_amount, recipient_phone, payments(payment_key, amount, status)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ ok: false, message: orderError?.message ?? "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const paymentRows = Array.isArray(order.payments) ? order.payments : order.payments ? [order.payments] : [];
  const payment = paymentRows[0];
  if (!payment?.payment_key) {
    return NextResponse.json({ ok: false, message: "Toss payment_key가 없어 자동 환불할 수 없습니다." }, { status: 400 });
  }

  const amount = refundAmount > 0 ? refundAmount : Number(payment.amount || order.total_amount);
  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(payment.payment_key)}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ cancelReason, cancelAmount: amount })
  });
  const tossResult = await response.json();

  if (!response.ok) {
    const failureEvents: OperationEvent[] = [
      {
        type: "payment_failed",
        orderId: order.id,
        orderNo: order.order_no,
        actor: { id: admin.session.user.id, email: admin.session.user.email, role: "admin" },
        amount,
        provider: "toss",
        reason: tossResult.message ?? "refund_failed"
      }
    ];
    await writeOperationLogBestEffort(supabase, order.id, failureEvents);
    return NextResponse.json({ ok: false, message: tossResult.message ?? "환불 요청에 실패했습니다.", tossResult }, { status: 400 });
  }

  await supabase.from("payments").update({ status: amount < Number(payment.amount) ? "partial_refunded" : "refunded" }).eq("order_id", order.id);
  await supabase.from("orders").update({ status: "refunded" }).eq("id", order.id);
  const stockResult = await restoreRefundedStock(supabase, order.id);

  const refundEvents: OperationEvent[] = [
    {
      type: "refund_completed",
      orderId: order.id,
      orderNo: order.order_no,
      actor: { id: admin.session.user.id, email: admin.session.user.email, role: "admin" },
      amount,
      provider: "toss",
      reason: cancelReason
    },
    {
      type: "order_status_changed",
      orderId: order.id,
      orderNo: order.order_no,
      from: order.status,
      to: "refunded",
      actor: { id: admin.session.user.id, email: admin.session.user.email, role: "admin" },
      note: cancelReason
    },
    {
      type: "notification_queued",
      payload: {
        event: "order.refunded",
        orderId: order.id,
        orderNo: order.order_no,
        to: order.recipient_phone,
        status: "refunded",
        title: "환불 완료 안내",
        message: `주문 ${order.order_no}의 환불 처리가 완료되었습니다.`,
        variables: { orderNo: order.order_no, amount }
      }
    }
  ];

  await writeOperationLogBestEffort(supabase, order.id, refundEvents);
  await writeNotificationEventsBestEffort(supabase, refundEvents);
  const statusEvent = refundEvents.find((event) => event.type === "order_status_changed");
  if (statusEvent) await writeOrderStatusHistoryBestEffort(supabase, statusEvent);
  if (stockResult.ok) {
    await Promise.all(
      stockResult.automations.map(async (automation) => {
        await writeOperationLogBestEffort(supabase, order.id, automation.events);
        await writeInventoryLogsBestEffort(supabase, order.id, automation.events);
      })
    );
  }

  return NextResponse.json({ ok: true, tossResult, stockRestored: stockResult.ok, stockMessage: stockResult.ok ? null : stockResult.message });
}
