import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeNextPath } from "@/lib/auth/next-path";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = sanitizeNextPath(next);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const limited = await enforceRateLimit(request, "oauthFailure");
      if (!limited.ok) return limited.response;
      return NextResponse.redirect(new URL("/login?error=oauth", request.url));
    }
    const user = data.user;

    if (user && hasSupabaseAdminEnv()) {
      const adminSupabase = createAdminClient();
      const displayName =
        String(user.user_metadata?.name ?? user.user_metadata?.nickname ?? user.email ?? "").trim() ||
        null;

      const { data: existingProfile, error: profileReadError } = await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileReadError) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=profile", request.url));
      }

      if (!existingProfile) {
        const { error: profileInsertError } = await adminSupabase.from("profiles").insert({
          id: user.id,
          name: displayName,
          role: "user"
        });
        if (profileInsertError) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/login?error=profile", request.url));
        }
      } else {
        const { error: profileUpdateError } = await adminSupabase
          .from("profiles")
          .update({ name: displayName })
          .eq("id", user.id);
        if (profileUpdateError) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/login?error=profile", request.url));
        }
      }
    }
  } else {
    const limited = await enforceRateLimit(request, "oauthFailure");
    if (!limited.ok) return limited.response;
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
