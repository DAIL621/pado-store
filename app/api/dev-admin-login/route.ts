import { NextResponse } from "next/server";
import { isDevAdminLoginEnabled, setDevAdminSession } from "@/lib/auth/dev-admin";

export async function POST(request: Request) {
  if (!isDevAdminLoginEnabled()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const expectedPassword = process.env.DEV_ADMIN_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.redirect(new URL("/dev-admin-login?error=1", request.url));
  }

  await setDevAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url));
}
