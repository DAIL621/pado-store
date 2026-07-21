import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { readJsonBody } from "@/lib/api/request";
import { calculateCustomerGrade, calculateCustomerStats, customerEventLabel } from "@/lib/customers/operations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi(); if (!admin.ok) return admin.response; const { id } = await params; const supabase = createAdminClient();
  const [profile, auth, orders, addresses, customerLogs] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at").eq("id", id).single(), supabase.auth.admin.getUserById(id),
    supabase.from("orders").select("*, order_items(product_name, option_name, quantity), shipments(carrier, tracking_number), payments(method, status, approved_at)").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("user_addresses").select("id, label, recipient_name, phone, zipcode, address, address_detail, delivery_memo, is_default, last_used_at, created_at").eq("user_id", id).order("last_used_at", { ascending: false, nullsFirst: false }),
    supabase.from("operation_logs").select("id, event_type, summary, payload, actor, created_at").filter("payload->>userId", "eq", id).order("created_at", { ascending: false })
  ]);
  if (profile.error) {
    if (process.env.NODE_ENV !== "production") console.error("ADMIN_MEMBER_DETAIL_FETCH_FAILED", profile.error);
    return NextResponse.json({ error: { code: "ADMIN_MEMBER_DETAIL_FETCH_FAILED", message: "고객 정보를 불러오지 못했습니다." } }, { status: profile.error.code === "PGRST116" ? 404 : 500 });
  }
  const orderIds = (orders.data ?? []).map((order) => order.id); const orderLogs = orderIds.length ? await supabase.from("operation_logs").select("id, order_id, event_type, summary, payload, actor, created_at").in("order_id", orderIds).order("created_at", { ascending: false }) : { data: [] };
  const stats = calculateCustomerStats(orders.data ?? []); const tagsEvent = (customerLogs.data ?? []).find((event) => event.event_type === "customer.tags_changed"); const tags = Array.isArray((tagsEvent?.payload as { tags?: string[] })?.tags) ? (tagsEvent?.payload as { tags: string[] }).tags : [];
  const joined = { id: `joined-${id}`, type: "customer.joined", label: "회원가입", summary: "파도스토리 회원 가입", created_at: profile.data.created_at };
  const timeline = [joined, ...(customerLogs.data ?? []).map((event) => ({ ...event, type: event.event_type, label: customerEventLabel(event.event_type) })), ...(orderLogs.data ?? []).map((event) => ({ ...event, type: event.event_type, label: customerEventLabel(event.event_type) })), ...(orders.data ?? []).map((order) => ({ id: `order-${order.id}`, type: "order_created", label: "주문", summary: `${order.order_no} · ${order.total_amount.toLocaleString("ko-KR")}원`, created_at: order.created_at }))].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return NextResponse.json({ ok: true, customer: { ...profile.data, email: auth.data.user?.email ?? "", lastLoginAt: auth.data.user?.last_sign_in_at ?? null, grade: calculateCustomerGrade(stats), tags, stats }, orders: orders.data ?? [], addresses: addresses.data ?? [], logs: customerLogs.data ?? [], timeline });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi(); if (!admin.ok) return admin.response; const { id } = await params; const parsed = await readJsonBody(request); if (!parsed.ok) return parsed.response;
  const action = parsed.body.action; const supabase = createAdminClient(); const actor = { id: admin.session.user.id, email: admin.session.user.email, role: "admin" };
  const payload: Record<string, unknown> = { userId: id }; let eventType = ""; let summary = "";
  if (action === "tags") { const tags = Array.isArray(parsed.body.tags) ? [...new Set(parsed.body.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20) : []; payload.tags = tags; eventType = "customer.tags_changed"; summary = `고객 태그 변경: ${tags.join(", ") || "없음"}`; }
  else if (action === "note") { const note = String(parsed.body.note ?? "").trim().slice(0, 2000); payload.note = note; eventType = "customer.note"; summary = note ? "관리자 고객 메모" : "관리자 고객 메모 삭제"; }
  else if (action === "cs") { const channel = String(parsed.body.channel ?? "기타").trim().slice(0, 40); const content = String(parsed.body.content ?? "").trim().slice(0, 2000); if (!content) return NextResponse.json({ ok: false, message: "CS 응대 내용을 입력해주세요." }, { status: 400 }); Object.assign(payload, { channel, content }); eventType = "customer.cs_record"; summary = `${channel}: ${content.slice(0, 80)}`; }
  else return NextResponse.json({ ok: false, message: "지원하지 않는 고객 작업입니다." }, { status: 400 });
  const result = await supabase.from("operation_logs").insert({ order_id: null, event_type: eventType, summary, payload, actor }); if (result.error) return NextResponse.json({ ok: false, message: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
