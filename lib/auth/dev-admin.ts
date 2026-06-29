import { cookies } from "next/headers";

const COOKIE_NAME = "pado_dev_admin";

export function isDevAdminLoginEnabled() {
  return process.env.DEV_ADMIN_LOGIN_ENABLED === "true";
}

export async function hasDevAdminSession() {
  if (!isDevAdminLoginEnabled()) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "yes";
}

export async function setDevAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "yes", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearDevAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
