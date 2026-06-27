import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { readJsonBody } from "@/lib/api/request";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

const allowedStatuses = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof allowedStatuses)[number];

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  pending: ["pending", "paid", "preparing", "cancelled"],
  paid: ["paid", "preparing", "cancelled"],
  preparing: ["preparing", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"]
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (allowedStatuses as readonly string[]).includes(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidTrackingNumber(value: string) {
  return /^[0-9A-Za-z-]{6,40}$/.test(value);
}

async function requireAdmin() {
  if (!hasSupabaseAdminEnv()) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "Supabase 관리자 키가 필요합니다." }, { status: 503 }) };
  }
  const session = await getAdminSession();
  if (!session.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: session.reason === "not-logged-in" ? "로그인이 필요합니다." : "관리자 권한이 필요합니다." },
        { status: session.reason === "not-logged-in" ? 401 : 403 }
      )
    };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  const supabase = createAdminClient();

  const { data: currentOrder, error: orderError } = await supabase
    .from("orders")
    .select("id, status, shipments(carrier, tracking_number)")
    .eq("id", id)
    .single();

  if (orderError || !currentOrder) {
    return NextResponse.json({ ok: false, message: orderError?.message ?? "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const currentStatus = currentOrder.status as OrderStatus;
  const currentShipment = Array.isArray(currentOrder.shipments) ? currentOrder.shipments[0] : currentOrder.shipments;
  const nextStatus = body.status === undefined ? currentStatus : body.status;
  const nextCarrier = body.carrier === undefined ? cleanText(currentShipment?.carrier) : cleanText(body.carrier);
  const nextTrackingNumber =
    body.trackingNumber === undefined ? cleanText(currentShipment?.tracking_number) : cleanText(body.trackingNumber);

  if (body.status !== undefined) {
    if (!isOrderStatus(nextStatus)) {
      return NextResponse.json({ ok: false, message: "올바르지 않은 주문 상태입니다." }, { status: 400 });
    }
    if (!statusFlow[currentStatus].includes(nextStatus)) {
      return NextResponse.json(
        { ok: false, message: `${currentStatus} 상태에서 ${nextStatus} 상태로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }
  }

  if ((nextStatus === "shipped" || nextStatus === "delivered") && !nextTrackingNumber) {
    return NextResponse.json({ ok: false, message: "배송중 또는 배송완료 상태에는 송장번호가 필요합니다." }, { status: 400 });
  }

  if (body.trackingNumber !== undefined || body.carrier !== undefined) {
    if (nextTrackingNumber && !isValidTrackingNumber(nextTrackingNumber)) {
      return NextResponse.json({ ok: false, message: "송장번호는 영문, 숫자, 하이픈 6~40자로 입력해주세요." }, { status: 400 });
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

  return NextResponse.json({ ok: true });
}
