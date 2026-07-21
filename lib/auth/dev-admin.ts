import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const DEV_ADMIN_COOKIE_NAME = "pado_dev_admin";

const DEV_ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60
};

export function isDevAdminLoginEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_ADMIN_LOGIN_ENABLED === "true";
}

export async function hasDevAdminSession() {
  if (!isDevAdminLoginEnabled()) return false;
  const cookieStore = await cookies();
  return cookieStore.get(DEV_ADMIN_COOKIE_NAME)?.value === "yes";
}

export async function setDevAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEV_ADMIN_COOKIE_NAME, "yes", DEV_ADMIN_COOKIE_OPTIONS);
}

export function setDevAdminSessionCookie(response: NextResponse) {
  response.cookies.set(DEV_ADMIN_COOKIE_NAME, "yes", DEV_ADMIN_COOKIE_OPTIONS);
  return response;
}

export async function clearDevAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_ADMIN_COOKIE_NAME);
}
