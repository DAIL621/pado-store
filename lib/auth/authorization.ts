export type AdminAuthFailure = "missing-env" | "not-logged-in" | "not-admin";

export function adminFailureStatus(reason: AdminAuthFailure) {
  return reason === "not-logged-in" ? 401 : reason === "not-admin" ? 403 : 503;
}
