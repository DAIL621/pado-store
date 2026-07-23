import { NextResponse } from "next/server";
import { isDevAdminLoginEnabled, setDevAdminSessionCookie } from "@/lib/auth/dev-admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "adminLogin");
  if (!limited.ok) return limited.response;
  if (!isDevAdminLoginEnabled()) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const expectedPassword = process.env.DEV_ADMIN_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.redirect(new URL("/dev-admin-login?error=1", request.url), { status: 303 });
  }

  const nextPath = String(formData.get("next") ?? "/admin/products");
  const safeNextPath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/admin/products";
  const referer = request.headers.get("referer");
  const redirectOrigin = referer ? new URL(referer).origin : new URL(request.url).origin;
  const response = NextResponse.redirect(new URL(safeNextPath, redirectOrigin), { status: 303 });
  return setDevAdminSessionCookie(response);
}
