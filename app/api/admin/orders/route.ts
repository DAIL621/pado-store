import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function GET() {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase 관리자 키가 필요합니다." }, { status: 503 });
  }

  const session = await getAdminSession();
  if (!session.ok) {
    return NextResponse.json(
      { ok: false, message: session.reason === "not-logged-in" ? "로그인이 필요합니다." : "관리자 권한이 필요합니다." },
      { status: session.reason === "not-logged-in" ? 401 : 403 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), shipments(*), payments(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, orders: data });
}
