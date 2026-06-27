import { NextResponse } from "next/server";

export async function readJsonBody(request: Request) {
  try {
    return { ok: true as const, body: await request.json() };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 })
    };
  }
}
