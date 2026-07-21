export type AdminAuthSource = "supabase" | "dev-admin";

export function canUseDevAdmin(input: {
  hasSupabaseUser: boolean;
  hasDevAdminCookie: boolean;
  nodeEnv: string | undefined;
  devAdminEnabled: boolean;
}) {
  return (
    !input.hasSupabaseUser &&
    input.nodeEnv !== "production" &&
    input.devAdminEnabled &&
    input.hasDevAdminCookie
  );
}
