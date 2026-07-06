import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { readJsonBody } from "@/lib/api/request";
import {
  buildOrderStatusAutomation,
  writeNotificationEventsBestEffort,
  writeOperationLogBestEffort,
  writeOrderStatusHistoryBestEffort,
  writeReviewRequestsBestEffort
} from "@/lib/operations/automation";
import { canChangeOrderStatus, isOperationOrderStatus, needsTrackingNumber, type OperationOrderStatus } from "@/lib/operations/status";
import { isValidTrackingNumber, TRACKING_NUMBER_MESSAGE } from "@/lib/shipping/tracking";
import { createAdminClient } from "@/lib/supabase/admin";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  const supabase = createAdminClient();

  const { data: currentOrder, error: orderError } = await supabase
    .from("orders")
    .select("id, order_no, status, recipient_phone, user_id, shipments(carrier, tracking_number)")
    .eq("id", id)
    .single();

  if (orderError || !currentOrder) {
    return NextResponse.json({ ok: false, message: orderError?.message ?? "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!isOperationOrderStatus(currentOrder.status)) {
    return NextResponse.json({ ok: false, message: `지원하지 않는 주문 상태입니다: ${currentOrder.status}` }, { status: 400 });
  }

  const currentStatus = currentOrder.status;
  const currentShipment = Array.isArray(currentOrder.shipments) ? currentOrder.shipments[0] : currentOrder.shipments;
  const nextStatus = body.status === undefined ? currentStatus : body.status;
  const nextCarrier = body.carrier === undefined ? cleanText(currentShipment?.carrier) : cleanText(body.carrier);
  const nextTrackingNumber =
    body.trackingNumber === undefined ? cleanText(currentShipment?.tracking_number) : cleanText(body.trackingNumber);

  if (body.status !== undefined) {
    if (!isOperationOrderStatus(nextStatus)) {
      return NextResponse.json({ ok: false, message: "올바르지 않은 주문 상태입니다." }, { status: 400 });
    }
    if (!canChangeOrderStatus(currentStatus, nextStatus)) {
      return NextResponse.json(
        { ok: false, message: `${currentStatus} 상태에서 ${nextStatus} 상태로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }
  }

  if (needsTrackingNumber(nextStatus) && !nextTrackingNumber) {
    return NextResponse.json({ ok: false, message: "배송중 또는 배송완료 상태에는 송장번호가 필요합니다." }, { status: 400 });
  }

  if (body.trackingNumber !== undefined || body.carrier !== undefined) {
    if (nextTrackingNumber && !isValidTrackingNumber(nextTrackingNumber)) {
      return NextResponse.json({ ok: false, message: TRACKING_NUMBER_MESSAGE }, { status: 400 });
    }
    if (nextTrackingNumber && !nextCarrier) {
      return NextResponse.json({ ok: false, message: "송장번호를 입력하려면 택배사가 필요합니다." }, { status: 400 });
    }
    const { error } = await supabase.from("shipments").upsert(
      {
        order_id: id,
        carrier: nextCarrier || "CJ대한통운",
        tracking_number: nextTrackingNumber || null,
        shipped_at: nextTrackingNumber ? new Date().toISOString() : null
      },
      { onConflict: "order_id" }
    );
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  if (body.status !== undefined) {
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const automation = await buildOrderStatusAutomation({
    orderId: id,
    orderNo: currentOrder.order_no,
    recipientPhone: currentOrder.recipient_phone,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    carrier: nextCarrier,
    trackingNumber: nextTrackingNumber,
    actor: {
      id: admin.session.user.id,
      email: admin.session.user.email,
      role: "admin"
    },
    note: cleanText(body.note)
  });
  const log = await writeOperationLogBestEffort(supabase, id, automation.events);
  const statusEvent = automation.events.find((event) => event.type === "order_status_changed");
  const statusHistory = statusEvent ? await writeOrderStatusHistoryBestEffort(supabase, statusEvent) : { ok: false, skipped: true };
  const notifications = await writeNotificationEventsBestEffort(supabase, automation.events);
  const reviewRequests = await writeReviewRequestsBestEffort(supabase, automation.events, currentOrder.user_id);

  return NextResponse.json({ ok: true, automation, operationLog: log, statusHistory, notifications, reviewRequests });
}
