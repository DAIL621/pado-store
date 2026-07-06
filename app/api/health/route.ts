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
      productImageStorage: process.env.PADO_PRODUCT_IMAGE_STORAGE || "local",
      supabaseProductImageBucket: process.env.PADO_PRODUCT_IMAGE_STORAGE === "supabase" ? Boolean(process.env.SUPABASE_PRODUCT_IMAGE_BUCKET) : "not-required",
      notificationProvider: process.env.PADO_NOTIFICATION_PROVIDER || "mock",
      kakaoAlimtalkWebhook: process.env.PADO_NOTIFICATION_PROVIDER === "kakao_alimtalk" ? Boolean(process.env.KAKAO_ALIMTALK_WEBHOOK_URL) : "not-required",
      smsProviderWebhook: process.env.PADO_NOTIFICATION_PROVIDER === "sms" ? Boolean(process.env.SMS_PROVIDER_WEBHOOK_URL) : "not-required",
      emailProviderWebhook: process.env.PADO_NOTIFICATION_PROVIDER === "email" ? Boolean(process.env.EMAIL_PROVIDER_WEBHOOK_URL) : "not-required",
      devAdminLoginDisabled: process.env.DEV_ADMIN_LOGIN_ENABLED !== "true"
    }
  });
}
