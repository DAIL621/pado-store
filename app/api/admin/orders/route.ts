import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), shipments(*), payments(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, orders: data });
}
