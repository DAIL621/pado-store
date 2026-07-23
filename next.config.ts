import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com https://developers.kakao.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.tosspayments.com https://apigw-sandbox.tosspayments.com https://kauth.kakao.com https://kapi.kakao.com; frame-src https://*.tosspayments.com https://js.tosspayments.com https://kauth.kakao.com; upgrade-insecure-requests" }
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    serverActions: { bodySizeLimit: "82mb" },
    proxyClientMaxBodySize: "82mb"
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
