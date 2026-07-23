import { NextResponse } from "next/server";

function allowedOrigins() {
  const configured = [
    process.env.PADO_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return new Set(configured);
}

export function requireTrustedOrigin(request: Request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return { ok: true as const };
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json") && !contentType.startsWith("multipart/form-data")) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "지원하지 않는 요청 형식입니다." }, { status: 415 })
    };
  }

  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) {
    if (process.env.NODE_ENV !== "production" || fetchSite === "same-origin") return { ok: true as const };
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "요청 출처를 확인할 수 없습니다." }, { status: 403 })
    };
  }
  if (!allowedOrigins().has(origin)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "허용되지 않은 요청 출처입니다." }, { status: 403 })
    };
  }
  return { ok: true as const };
}
