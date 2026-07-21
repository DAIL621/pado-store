import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { readJsonBody } from "@/lib/api/request";
import { canChangeOrderStatus, isOperationOrderStatus, needsTrackingNumber } from "@/lib/operations/status";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZES = new Set([20, 50, 100]);
const allowedStatuses = new Set(["pending", "paid", "preparing", "delivery_ready", "shipped", "delivered", "cancelled", "return_requested", "returned", "refunded"]);

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safeSearch(value: string) {
  return value.trim().slice(0, 100).replace(/[%_,()]/g, " ");
}

function dateBounds(range: string, from: string, to: string) {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (range === "yesterday") { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  if (range === "custom") return { from: from ? `${from}T00:00:00` : null, to: to ? `${to}T23:59:59.999` : null };
  if (["today", "yesterday", "7d", "30d"].includes(range)) return { from: start.toISOString(), to: end.toISOString() };
  return { from: null, to: null };
}

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const params = new URL(request.url).searchParams;
  const page = positiveInt(params.get("page"), 1);
  const requestedSize = positiveInt(params.get("pageSize"), 20);
  const pageSize = PAGE_SIZES.has(requestedSize) ? requestedSize : 20;
  const status = params.get("status") ?? "all";
  const shipping = params.get("shipping") ?? "all";
  const payment = params.get("payment") ?? "all";
  const sort = params.get("sort") ?? "created_desc";
  const includeTest = params.get("includeTest") === "true";
  const keyword = safeSearch(params.get("q") ?? "");
  const bounds = dateBounds(params.get("range") ?? "all", params.get("dateFrom") ?? "", params.get("dateTo") ?? "");
  const supabase = createAdminClient();

  const { data: testMarks } = await supabase.from("operation_logs").select("order_id").eq("event_type", "prelaunch.test_order");
  const testIds = (testMarks ?? []).map((row) => String(row.order_id)).filter(Boolean);
  let matchedIds: string[] | null = null;
  if (keyword) {
    const pattern = `%${keyword}%`;
    const [items, shipments, profiles] = await Promise.all([
      supabase.from("order_items").select("order_id").or(`product_name.ilike.${pattern},option_name.ilike.${pattern}`),
      supabase.from("shipments").select("order_id").or(`tracking_number.ilike.${pattern},carrier.ilike.${pattern}`),
      supabase.from("profiles").select("id").ilike("name", pattern)
    ]);
    matchedIds = [...new Set([...(items.data ?? []).map((row) => row.order_id), ...(shipments.data ?? []).map((row) => row.order_id)])];
    const profileIds = (profiles.data ?? []).map((row) => row.id);
    const direct = await supabase.from("orders").select("id").or(`order_no.ilike.${pattern},recipient_name.ilike.${pattern},recipient_phone.ilike.${pattern},address.ilike.${pattern}${profileIds.length ? `,user_id.in.(${profileIds.join(",")})` : ""}`);
    matchedIds = [...new Set([...matchedIds, ...(direct.data ?? []).map((row) => row.id)])];
  }

  if (shipping !== "all") {
    let shipmentQuery = supabase.from("shipments").select("order_id, tracking_number");
    if (shipping === "tracking") shipmentQuery = shipmentQuery.not("tracking_number", "is", null);
    if (shipping === "shipped") shipmentQuery = shipmentQuery.not("tracking_number", "is", null);
    const { data } = await shipmentQuery;
    const shippingIds = (data ?? []).filter((row) => shipping !== "tracking" && shipping !== "shipped" ? true : Boolean(row.tracking_number)).map((row) => row.order_id);
    if (shipping === "none") {
      const withTracking = new Set((data ?? []).filter((row) => row.tracking_number).map((row) => row.order_id));
      const allIds = (await supabase.from("orders").select("id")).data?.map((row) => row.id) ?? [];
      matchedIds = (matchedIds ?? allIds).filter((id) => !withTracking.has(id));
    } else matchedIds = (matchedIds ?? shippingIds).filter((id) => shippingIds.includes(id));
  }

  if (payment !== "all") {
    const { data } = await supabase.from("payments").select("order_id, method").ilike("method", `%${payment}%`);
    const ids = (data ?? []).map((row) => row.order_id);
    matchedIds = (matchedIds ?? ids).filter((id) => ids.includes(id));
  }

  let query = supabase.from("orders").select("*, order_items(*), shipments(*), payments(*), profiles(name)", { count: "exact" });
  if (status !== "all" && allowedStatuses.has(status)) query = query.eq("status", status);
  if (!includeTest && testIds.length) query = query.not("id", "in", `(${testIds.join(",")})`);
  if (matchedIds) query = matchedIds.length ? query.in("id", matchedIds) : query.eq("id", "00000000-0000-0000-0000-000000000000");
  if (bounds.from) query = query.gte("created_at", bounds.from);
  if (bounds.to) query = query.lte("created_at", bounds.to);
  query = query.order(sort === "created_asc" ? "created_at" : sort === "amount_desc" || sort === "amount_asc" ? "total_amount" : "created_at", { ascending: sort === "created_asc" || sort === "amount_asc" });
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const orderIds = (data ?? []).map((order) => order.id);
  const { data: notes } = orderIds.length
    ? await supabase.from("operation_logs").select("order_id, payload, created_at").eq("event_type", "order.internal_note").in("order_id", orderIds).order("created_at", { ascending: false })
    : { data: [] };
  const noteMap = new Map<string, string>();
  for (const note of notes ?? []) if (!noteMap.has(note.order_id)) noteMap.set(note.order_id, String((note.payload as { note?: string })?.note ?? ""));
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { data: trackingRows } = await supabase.from("shipments").select("order_id").not("tracking_number", "is", null);
  const trackingIds = (trackingRows ?? []).map((row) => row.order_id);
  const excludeTests = `(${testIds.join(",")})`;
  let todayQuery = supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString());
  let waitingQuery = supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "preparing"]);
  let missingQuery = supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "preparing"]).not("id", "in", `(${trackingIds.length ? trackingIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);
  let shippingQuery = supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "shipped");
  let cancelQuery = supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "return_requested");
  if (!includeTest && testIds.length) {
    todayQuery = todayQuery.not("id", "in", excludeTests); waitingQuery = waitingQuery.not("id", "in", excludeTests); missingQuery = missingQuery.not("id", "in", excludeTests); shippingQuery = shippingQuery.not("id", "in", excludeTests); cancelQuery = cancelQuery.not("id", "in", excludeTests);
  }
  const [todayCount, waitingCount, missingTrackingCount, shippingCount, cancelCount] = await Promise.all([
    todayQuery, waitingQuery, missingQuery, shippingQuery, cancelQuery
  ]);
  const total = count ?? 0;
  return NextResponse.json({ ok: true, orders: (data ?? []).map((order) => ({ ...order, internal_note: noteMap.get(order.id) ?? "", is_test: testIds.includes(order.id) })), hiddenTestCount: testIds.length, pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }, summary: { today: todayCount.count ?? 0, waiting: waitingCount.count ?? 0, missingTracking: missingTrackingCount.count ?? 0, shipping: shippingCount.count ?? 0, cancelRequested: cancelCount.count ?? 0 } });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const ids = Array.isArray(parsed.body.ids) ? [...new Set(parsed.body.ids.filter((id): id is string => typeof id === "string"))].slice(0, 100) : [];
  const status = parsed.body.status;
  if (!ids.length || !isOperationOrderStatus(status)) return NextResponse.json({ ok: false, message: "주문과 변경 상태를 확인해주세요." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: orders, error } = await supabase.from("orders").select("id, order_no, status, shipments(tracking_number)").in("id", ids);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  const succeeded: string[] = []; const failed: Array<{ id: string; reason: string }> = [];
  for (const order of orders ?? []) {
    const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
    if (!isOperationOrderStatus(order.status) || !canChangeOrderStatus(order.status, status)) { failed.push({ id: order.id, reason: "허용되지 않는 상태 전이" }); continue; }
    if (needsTrackingNumber(status) && !shipment?.tracking_number) { failed.push({ id: order.id, reason: "송장번호 없음" }); continue; }
    const update = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (update.error) { failed.push({ id: order.id, reason: update.error.message }); continue; }
    succeeded.push(order.id);
    await supabase.from("operation_logs").insert({ order_id: order.id, event_type: "order.bulk_status_changed", summary: `${order.status} → ${status}`, payload: { fromStatus: order.status, toStatus: status, bulk: true }, actor: { id: admin.session.user.id, email: admin.session.user.email, role: "admin" } });
  }
  return NextResponse.json({ ok: failed.length === 0, succeeded, failed }, { status: failed.length && !succeeded.length ? 400 : 200 });
}
