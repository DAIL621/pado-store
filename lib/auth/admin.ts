import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hasDevAdminSession } from "@/lib/auth/dev-admin";

export type AdminSession =
  | {
      ok: true;
      user: {
        id: string;
        email?: string;
      };
      profile: {
        name: string | null;
        phone: string | null;
        role: "admin";
      };
    }
  | {
      ok: false;
      reason: "missing-env" | "not-logged-in" | "not-admin";
    };

export async function getAdminSession(): Promise<AdminSession> {
  if (await hasDevAdminSession()) {
    return {
      ok: true,
      user: {
        id: "dev-admin",
        email: "dev-admin@pado-story.local"
      },
      profile: {
        name: "개발용 관리자",
        phone: null,
        role: "admin"
      }
    };
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, reason: "missing-env" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, reason: "not-logged-in" };
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("name, phone, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { ok: false, reason: "not-admin" };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? undefined
    },
    profile: {
      name: profile.name,
      phone: profile.phone,
      role: "admin"
    }
  };
}
