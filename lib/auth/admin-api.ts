import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { adminFailureStatus } from "@/lib/auth/authorization";

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
        { status: adminFailureStatus(session.reason) }
      )
    };
  }

  return { ok: true as const, session };
}
