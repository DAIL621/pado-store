import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { POST as processAdminRefund } from "@/app/api/admin/payments/refund/route";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, 16 * 1024);
  if (!parsed.ok) return parsed.response;

  const orderId = String(parsed.body.orderId ?? "").trim();
  const amount = Number(parsed.body.amount);
  const idempotencyKey = String(parsed.body.idempotencyKey ?? "").trim();
  if (!orderId || !Number.isSafeInteger(amount) || amount <= 0 || !idempotencyKey) {
    return NextResponse.json(
      { ok: false, message: "전체환불 요청 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  const sanitizedRequest = new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId,
      amount,
      idempotencyKey,
      reason: "관리자 환불"
    })
  });
  return processAdminRefund(sanitizedRequest);
}
