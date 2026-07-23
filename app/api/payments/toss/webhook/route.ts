import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

const PAYMENT_KEY_RE = /^[A-Za-z0-9_-]{10,200}$/;
const TRANSMISSION_ID_RE = /^[A-Za-z0-9_-]{6,200}$/;
const ALLOWED_EVENTS = new Set(["PAYMENT_STATUS_CHANGED"]);

type TossWebhookBody = {
  eventType?: string;
  data?: { paymentKey?: string; orderId?: string; status?: string; totalAmount?: number };
};

type TossPayment = {
  paymentKey?: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
};

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function POST(request: Request) {
  const transmissionId = request.headers.get("tosspayments-webhook-transmission-id")?.trim() ?? "";
  const transmissionTime = request.headers.get("tosspayments-webhook-transmission-time")?.trim() ?? "";
  if (!TRANSMISSION_ID_RE.test(transmissionId) || !transmissionTime || !Number.isFinite(Date.parse(transmissionTime))) {
    return NextResponse.json({ ok: false, message: "Invalid webhook metadata." }, { status: 401 });
  }
  const limited = await enforceRateLimit(request, "webhook", { resourceId: transmissionId });
  if (!limited.ok) return limited.response;
  if (!hasSupabaseAdminEnv() || !process.env.TOSS_PAYMENTS_SECRET_KEY) {
    return NextResponse.json({ ok: false, message: "Webhook verification is unavailable." }, { status: 503 });
  }
  const parsed = await readJsonBody(request, 64 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as TossWebhookBody;
  const eventType = String(body.eventType ?? "").toUpperCase();
  const paymentKey = String(body.data?.paymentKey ?? "").trim();
  if (!ALLOWED_EVENTS.has(eventType) || !PAYMENT_KEY_RE.test(paymentKey)) {
    return NextResponse.json({ ok: false, message: "Unsupported webhook payload." }, { status: 400 });
  }

  const secret = process.env.TOSS_PAYMENTS_SECRET_KEY;
  const verification = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
    {
      headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
      cache: "no-store"
    }
  );
  const provider = await verification.json().catch(() => ({})) as TossPayment;
  if (!verification.ok || provider.paymentKey !== paymentKey
      || provider.orderId !== body.data?.orderId
      || provider.status !== body.data?.status
      || Number(provider.totalAmount) !== Number(body.data?.totalAmount)) {
    return NextResponse.json({ ok: false, message: "Webhook provider verification failed." }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: payment } = await db
    .from("payments")
    .select("id,order_id,amount,toss_order_id,payment_key,orders(security_version)")
    .eq("payment_key", paymentKey)
    .maybeSingle();
  const order = Array.isArray(payment?.orders) ? payment.orders[0] : payment?.orders;
  if (!payment || Number(order?.security_version) !== 2
      || payment.toss_order_id !== provider.orderId
      || Number(payment.amount) !== Number(provider.totalAmount)) {
    return NextResponse.json({ ok: false, message: "Webhook does not match a v2 payment." }, { status: 404 });
  }

  const eventKey = `webhook:${transmissionId}`;
  const { error } = await db.from("payment_events").insert({
    order_id: payment.order_id,
    payment_id: payment.id,
    event_key: eventKey,
    event_type: "webhook_observed",
    provider_payment_key: paymentKey,
    payload: {
      eventType,
      providerStatus: provider.status,
      transmissionTime,
      payloadHash: digest(body)
    }
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    return NextResponse.json({ ok: false, message: "Webhook event could not be recorded." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, duplicate: Boolean(error) });
}
