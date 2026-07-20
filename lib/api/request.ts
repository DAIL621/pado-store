import { NextResponse } from "next/server";

export async function readJsonBody(request: Request, maxBytes = 1024 * 1024) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "요청 데이터가 너무 큽니다." }, { status: 413 }) };
  }
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, response: NextResponse.json({ ok: false, message: "JSON 객체 형식이 필요합니다." }, { status: 400 }) };
    }
    // Route handlers retain their existing field-level validators after this structural gate.
    return { ok: true as const, body: body as Record<string, any> };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 })
    };
  }
}
