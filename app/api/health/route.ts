import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "pado-story-store",
    status: "ok",
    checks: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      tossClientKey: Boolean(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY),
      tossSecretKey: Boolean(process.env.TOSS_PAYMENTS_SECRET_KEY),
      kakaoClientId: Boolean(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID),
      siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      devAdminLoginDisabled: process.env.DEV_ADMIN_LOGIN_ENABLED !== "true"
    }
  });
}
