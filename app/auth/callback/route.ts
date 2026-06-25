import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/mypage";

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    if (user && hasSupabaseAdminEnv()) {
      const adminSupabase = createAdminClient();
      const displayName =
        String(user.user_metadata?.name ?? user.user_metadata?.nickname ?? user.email ?? "").trim() ||
        null;

      const { data: existingProfile } = await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        await adminSupabase.from("profiles").insert({
          id: user.id,
          name: displayName,
          role: "customer"
        });
      } else {
        await adminSupabase
          .from("profiles")
          .update({ name: displayName })
          .eq("id", user.id);
      }
    }
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
