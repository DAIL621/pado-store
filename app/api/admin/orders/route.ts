import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), shipments(*), payments(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  const includeTest = new URL(request.url).searchParams.get("includeTest") === "true";
  const { data: testMarks, error: markError } = await supabase.from("operation_logs").select("order_id").eq("event_type", "prelaunch.test_order");
  if (markError) return NextResponse.json({ ok: false, message: markError.message }, { status: 500 });
  const testOrderIds = new Set((testMarks ?? []).map((row) => row.order_id).filter(Boolean));
  const orders = (data ?? []).map((order) => ({ ...order, is_test: testOrderIds.has(order.id) })).filter((order) => includeTest || !order.is_test);
  return NextResponse.json({ ok: true, orders, hiddenTestCount: testOrderIds.size });
}
