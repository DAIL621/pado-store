import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { calculateCustomerGrade, calculateCustomerStats } from "@/lib/customers/operations";
import { createAdminClient } from "@/lib/supabase/admin";

const pageSizes = new Set([20, 50, 100]);
const clean = (value: string | null) => String(value ?? "").trim().toLowerCase().slice(0, 100);

export async function GET(request: Request) {
  const admin = await requireAdminApi(); if (!admin.ok) return admin.response;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1); const requested = Number(params.get("pageSize")) || 20; const pageSize = pageSizes.has(requested) ? requested : 20;
  const q = clean(params.get("q")); const grade = params.get("grade") ?? "all"; const orderFilter = params.get("orders") ?? "all"; const tag = clean(params.get("tag")); const sort = params.get("sort") ?? "created_desc";
  const supabase = createAdminClient();
  const [profilesResult, ordersResult, authResult, logsResult] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at, updated_at"),
    supabase.from("orders").select("id, user_id, order_no, recipient_name, recipient_phone, address, total_amount, status, created_at, shipments(tracking_number)"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("operation_logs").select("event_type, payload, created_at").in("event_type", ["customer.tags_changed", "customer.cs_record"]).order("created_at", { ascending: false })
  ]);
  if (profilesResult.error || ordersResult.error) return NextResponse.json({ ok: false, message: profilesResult.error?.message ?? ordersResult.error?.message }, { status: 500 });
  const authMap = new Map(authResult.data.users.map((user) => [user.id, user]));
  const ordersByUser = new Map<string, typeof ordersResult.data>();
  for (const order of ordersResult.data ?? []) if (order.user_id) ordersByUser.set(order.user_id, [...(ordersByUser.get(order.user_id) ?? []), order]);
  const latestTags = new Map<string, string[]>();
  const csEvents = (logsResult.data ?? []).filter((row) => row.event_type === "customer.cs_record");
  for (const row of logsResult.data ?? []) { const payload = row.payload as { userId?: string; tags?: string[] }; if (row.event_type === "customer.tags_changed" && payload.userId && !latestTags.has(payload.userId)) latestTags.set(payload.userId, Array.isArray(payload.tags) ? payload.tags : []); }
  let customers = (profilesResult.data ?? []).map((profile) => {
    const orders = ordersByUser.get(profile.id) ?? []; const stats = calculateCustomerStats(orders); const auth = authMap.get(profile.id); const recent = [...orders].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]; const tags = latestTags.get(profile.id) ?? [];
    return { id: profile.id, name: profile.name || recent?.recipient_name || auth?.email || profile.id, phone: recent?.recipient_phone ?? "", email: auth?.email ?? "", role: profile.role, createdAt: profile.created_at, lastLoginAt: auth?.last_sign_in_at ?? null, status: auth?.banned_until && new Date(auth.banned_until) > new Date() ? "blocked" : "active", tags, grade: calculateCustomerGrade(stats), stats };
  });
  if (q) customers = customers.filter((customer) => { const orders = ordersByUser.get(customer.id) ?? []; return [customer.id, customer.name, customer.phone, customer.email, ...customer.tags, ...orders.flatMap((order) => [order.order_no, order.recipient_phone, order.address, ...(Array.isArray(order.shipments) ? order.shipments : [order.shipments]).map((shipment) => shipment?.tracking_number)])].some((value) => String(value ?? "").toLowerCase().includes(q)); });
  if (grade !== "all") customers = customers.filter((customer) => customer.grade === grade);
  if (orderFilter === "yes") customers = customers.filter((customer) => customer.stats.orderCount > 0); if (orderFilter === "no") customers = customers.filter((customer) => customer.stats.orderCount === 0);
  if (tag) customers = customers.filter((customer) => customer.tags.some((item) => item.toLowerCase().includes(tag)));
  customers.sort((a, b) => sort === "spent_desc" ? b.stats.totalSpent - a.stats.totalSpent : sort === "orders_desc" ? b.stats.orderCount - a.stats.orderCount : sort === "last_order" ? String(b.stats.lastOrderAt).localeCompare(String(a.stats.lastOrderAt)) : sort === "last_login" ? String(b.lastLoginAt).localeCompare(String(a.lastLoginAt)) : sort === "name" ? String(a.name).localeCompare(String(b.name), "ko") : String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = customers.length; const from = (page - 1) * pageSize;
  const now = Date.now(); const weekAgo = now - 7 * 86400000; const today = new Date(); today.setHours(0, 0, 0, 0);
  const allForSummary = (profilesResult.data ?? []).map((profile) => { const stats = calculateCustomerStats(ordersByUser.get(profile.id) ?? []); return { profile, stats, grade: calculateCustomerGrade(stats), tags: latestTags.get(profile.id) ?? [], lastLogin: authMap.get(profile.id)?.last_sign_in_at }; });
  return NextResponse.json({ ok: true, customers: customers.slice(from, from + pageSize), pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }, summary: { todayJoined: allForSummary.filter((item) => new Date(item.profile.created_at).getTime() >= today.getTime()).length, weekJoined: allForSummary.filter((item) => new Date(item.profile.created_at).getTime() >= weekAgo).length, vip: allForSummary.filter((item) => item.grade === "vip").length, caution: allForSummary.filter((item) => item.tags.includes("주의고객")).length, dormant: allForSummary.filter((item) => item.lastLogin && new Date(item.lastLogin).getTime() < now - 180 * 86400000).length, recentCs: csEvents.filter((event) => new Date(event.created_at).getTime() >= weekAgo).length, todayCs: csEvents.filter((event) => new Date(event.created_at).getTime() >= today.getTime()).length } });
}
