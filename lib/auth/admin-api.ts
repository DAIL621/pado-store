import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function requireAdminApi() {
  if (!hasSupabaseAdminEnv()) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Supabase 관리자 키가 필요합니다." }, { status: 503 })
    };
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

  return { ok: true as const, session };
}
