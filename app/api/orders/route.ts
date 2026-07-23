import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { writeNotificationEventsBestEffort, writeOperationLogBestEffort } from "@/lib/operations/automation";
import type { OperationEvent } from "@/lib/operations/events";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_LINE_ITEMS = 20;
const MAX_QUANTITY_PER_OPTION = 20;
const MAX_TOTAL_QUANTITY = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type SecureItem = { optionId: string; productSlug: string; quantity: number };

function makeOrderNo() {
  const ymd = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PADO-${ymd}-${randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (cleaned.length > maxLength || CONTROL_RE.test(cleaned)) return null;
  return cleaned;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_LINE_ITEMS) {
    return { ok: false as const, message: `주문 상품은 1개 이상 ${MAX_LINE_ITEMS}개 이하로 선택해주세요.` };
  }
  const merged = new Map<string, SecureItem>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return { ok: false as const, message: "주문 상품 형식이 올바르지 않습니다." };
    const row = raw as Record<string, unknown>;
    const optionId = String(row.optionId ?? "").trim();
    const productSlug = String(row.productSlug ?? "").trim();
    const quantity = Number(row.quantity);
    if (!UUID_RE.test(optionId) || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(productSlug)) {
      return { ok: false as const, message: "상품 옵션 정보가 올바르지 않습니다." };
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_OPTION) {
      return { ok: false as const, message: `옵션별 수량은 1개 이상 ${MAX_QUANTITY_PER_OPTION}개 이하의 정수여야 합니다.` };
    }
    const existing = merged.get(optionId);
    if (existing && existing.productSlug !== productSlug) {
      return { ok: false as const, message: "동일 옵션에 서로 다른 상품 정보가 전달되었습니다." };
    }
    merged.set(optionId, { optionId, productSlug, quantity: (existing?.quantity ?? 0) + quantity });
  }
  const items = [...merged.values()];
  if (items.some((item) => item.quantity > MAX_QUANTITY_PER_OPTION)) {
    return { ok: false as const, message: `합산 옵션 수량은 ${MAX_QUANTITY_PER_OPTION}개를 초과할 수 없습니다.` };
  }
  if (items.reduce((sum, item) => sum + item.quantity, 0) > MAX_TOTAL_QUANTITY) {
    return { ok: false as const, message: `한 주문의 총수량은 ${MAX_TOTAL_QUANTITY}개를 초과할 수 없습니다.` };
  }
  return { ok: true as const, items };
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function rpcErrorStatus(message: string) {
  if (message.includes("IDEMPOTENCY_CONFLICT")) return 409;
  if (message.includes("INSUFFICIENT_STOCK")) return 409;
  if (message.includes("OPTION_NOT_AVAILABLE")) return 400;
  return 500;
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;

  const sessionClient = await createClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, message: "로그인 후 주문할 수 있습니다." }, { status: 401 });
  }

  const limited = await enforceRateLimit(request, "orderCreate", { userId: user.id });
  if (!limited.ok) return limited.response;
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "주문 처리 설정을 확인 중입니다." }, { status: 503 });
  }

  const parsed = await readJsonBody(request, 128 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const normalized = normalizeItems(body.items);
  if (!normalized.ok) return NextResponse.json({ ok: false, message: normalized.message }, { status: 400 });

  const idempotencyKey = String(body.idempotencyKey ?? request.headers.get("idempotency-key") ?? "").trim();
  if (!UUID_RE.test(idempotencyKey)) {
    return NextResponse.json({ ok: false, message: "유효한 주문 멱등키가 필요합니다." }, { status: 400 });
  }

  let recipientName = cleanText(body.recipientName, 80);
  let recipientPhone = cleanText(body.recipientPhone, 30);
  let postcode = cleanText(body.postcode, 10);
  let address = cleanText(body.address, 200);
  let addressDetail = cleanText(body.addressDetail, 200);
  let memo = cleanText(body.memo, 500);
  const selectedAddressId = String((body.deliverySelection as Record<string, unknown> | undefined)?.addressId ?? "").trim();

  if (selectedAddressId) {
    if (!UUID_RE.test(selectedAddressId)) {
      return NextResponse.json({ ok: false, message: "배송지 식별자가 올바르지 않습니다." }, { status: 400 });
    }
    const { data: savedAddress, error } = await sessionClient
      .from("user_addresses")
      .select("recipient_name,phone,zipcode,address,address_detail,delivery_memo")
      .eq("id", selectedAddressId).eq("user_id", user.id).maybeSingle();
    if (error) return NextResponse.json({ ok: false, message: "배송지를 확인하지 못했습니다." }, { status: 500 });
    if (!savedAddress) return NextResponse.json({ ok: false, message: "선택한 배송지를 찾을 수 없습니다." }, { status: 404 });
    recipientName = cleanText(savedAddress.recipient_name, 80);
    recipientPhone = cleanText(savedAddress.phone, 30);
    postcode = cleanText(savedAddress.zipcode, 10);
    address = cleanText(savedAddress.address, 200);
    addressDetail = cleanText(savedAddress.address_detail, 200);
    memo = cleanText(savedAddress.delivery_memo, 500);
  }

  const phoneDigits = recipientPhone?.replace(/\D/g, "") ?? "";
  if (!recipientName) return NextResponse.json({ ok: false, message: "받는 분 이름을 확인해주세요." }, { status: 400 });
  if (!/^0\d{9,10}$/.test(phoneDigits)) return NextResponse.json({ ok: false, message: "연락처 형식을 확인해주세요." }, { status: 400 });
  if (postcode && !/^\d{5,6}$/.test(postcode)) return NextResponse.json({ ok: false, message: "우편번호 형식을 확인해주세요." }, { status: 400 });
  if (!address) return NextResponse.json({ ok: false, message: "배송지 주소를 확인해주세요." }, { status: 400 });
  if (addressDetail === null || memo === null) return NextResponse.json({ ok: false, message: "배송지 입력 길이 또는 문자를 확인해주세요." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ ok: false, message: "회원 정보를 확인할 수 없습니다." }, { status: 403 });

  const requestFingerprint = fingerprint({
    items: normalized.items.slice().sort((a, b) => a.optionId.localeCompare(b.optionId)),
    recipientName, recipientPhone: phoneDigits, postcode: postcode ?? "", address,
    addressDetail: addressDetail ?? "", memo: memo ?? ""
  });
  const orderNo = makeOrderNo();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { data: order, error } = await admin.rpc("pado_create_order_v2", {
    p_user_id: user.id,
    p_order_no: orderNo,
    p_idempotency_key: idempotencyKey,
    p_request_fingerprint: requestFingerprint,
    p_items: normalized.items,
    p_recipient_name: recipientName,
    p_recipient_phone: phoneDigits,
    p_postcode: postcode ?? "",
    p_address: address,
    p_address_detail: addressDetail ?? "",
    p_memo: memo ?? "",
    p_expires_at: expiresAt
  });
  if (error) {
    const status = rpcErrorStatus(error.message);
    const message = status === 409 ? "동일한 주문 요청이 다른 내용으로 재사용되었거나 재고가 부족합니다."
      : status === 400 ? "현재 주문할 수 없는 상품 옵션이 포함되어 있습니다."
        : "주문 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message }, { status });
  }
  if (!order || Number(order.security_version) !== 2 || order.user_id !== user.id) {
    return NextResponse.json({ ok: false, message: "주문 최종 상태를 확인하지 못했습니다." }, { status: 500 });
  }

  if (selectedAddressId) {
    await sessionClient.from("user_addresses").update({ last_used_at: new Date().toISOString() })
      .eq("id", selectedAddressId).eq("user_id", user.id);
  }

  const events: OperationEvent[] = [{
    type: "order_created", orderId: order.id, orderNo: order.order_no,
    actor: { id: user.id, role: "customer" }, totalAmount: Number(order.total_amount)
  }];
  await writeOperationLogBestEffort(admin, order.id, events);
  await writeNotificationEventsBestEffort(admin, events);
  return NextResponse.json({ ok: true, mode: "security-v2", order });
}
