import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJsonBody } from "@/lib/api/request";
import { calculateShipping } from "@/lib/order/pricing";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OrderItemInput = {
  optionId?: string;
  productSlug: string;
  name: string;
  optionLabel: string;
  unitPrice: number;
  quantity: number;
  image: string;
};

function makeOrderNo() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  const random = randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();
  return `PADO-${ymd}-${random}`;
}

async function cleanupCreatedOrder(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  await supabase.from("payments").delete().eq("order_id", orderId);
  await supabase.from("order_items").delete().eq("order_id", orderId);
  await supabase.from("orders").delete().eq("id", orderId);
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  const items: OrderItemInput[] = Array.isArray(body.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ ok: false, message: "장바구니가 비어 있습니다." }, { status: 400 });
  }

  const invalidItem = items.find((item) => !item.optionId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0);
  if (invalidItem) {
    return NextResponse.json({ ok: false, message: "상품 옵션과 수량을 다시 확인해주세요." }, { status: 400 });
  }

  const clientSubtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const clientShipping = calculateShipping(clientSubtotal);
  const clientTotalAmount = clientSubtotal + clientShipping;
  const orderNo = makeOrderNo();
  const recipientName = String(body.recipientName ?? "").trim();
  const recipientPhone = String(body.recipientPhone ?? "").trim();
  const phoneDigits = recipientPhone.replace(/\D/g, "");
  const postcode = String(body.postcode ?? "").trim();
  const address = String(body.address ?? "").trim();
  const addressDetail = String(body.addressDetail ?? "").trim();
  const memo = String(body.memo ?? "").trim();
  let userId: string | null = null;

  if (!recipientName) {
    return NextResponse.json({ ok: false, message: "받는 분 이름을 입력해주세요." }, { status: 400 });
  }
  if (phoneDigits.length < 10) {
    return NextResponse.json({ ok: false, message: "연락처를 10자리 이상 입력해주세요." }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ ok: false, message: "배송지 주소를 입력해주세요." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      order: {
        id: `mock-${orderNo}`,
        order_no: orderNo,
        total_amount: clientTotalAmount,
        status: "pending"
      },
      message: "Supabase 관리자 키가 없어 테스트 주문번호만 생성했습니다."
    });
  }

  const supabase = createAdminClient();
  const optionIds = [...new Set(items.map((item) => String(item.optionId)))];
  const { data: options, error: optionError } = await supabase
    .from("product_options")
    .select("id, product_id, name, price_delta, stock, products(slug, name, base_price, image_url, is_active)")
    .in("id", optionIds);

  if (optionError) return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });

  const optionMap = new Map((options ?? []).map((option) => [option.id, option]));
  const requestedQuantityByOption = items.reduce<Map<string, number>>((acc, item) => {
    const optionId = String(item.optionId);
    acc.set(optionId, (acc.get(optionId) ?? 0) + Number(item.quantity));
    return acc;
  }, new Map());

  for (const item of items) {
    const option = optionMap.get(String(item.optionId));
    const product = Array.isArray(option?.products) ? option?.products[0] : option?.products;
    if (!option || !product?.is_active || product.slug !== item.productSlug) {
      return NextResponse.json({ ok: false, message: `${item.name} 상품 옵션을 확인할 수 없습니다.` }, { status: 400 });
    }
    const requestedQuantity = requestedQuantityByOption.get(String(item.optionId)) ?? Number(item.quantity);
    if (Number(option.stock) < requestedQuantity) {
      return NextResponse.json(
        { ok: false, message: `${product.name} ${option.name} 재고가 부족합니다. 현재 ${option.stock}개 구매 가능합니다.` },
        { status: 409 }
      );
    }
  }

  const pricedItems = items.map((item) => {
    const option = optionMap.get(String(item.optionId));
    const product = Array.isArray(option?.products) ? option?.products[0] : option?.products;
    const unitPrice = Number(product?.base_price ?? 0) + Number(option?.price_delta ?? 0);

    return {
      item,
      unitPrice,
      productName: String(product?.name ?? item.name),
      optionName: String(option?.name ?? item.optionLabel),
      imageUrl: String(product?.image_url ?? item.image)
    };
  });
  const subtotal = pricedItems.reduce((sum, { item, unitPrice }) => sum + unitPrice * Number(item.quantity), 0);
  const shipping = calculateShipping(subtotal);
  const totalAmount = subtotal + shipping;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      status: "pending",
      user_id: userId,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      postcode,
      address,
      address_detail: addressDetail,
      memo,
      total_amount: totalAmount
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const orderItems = pricedItems.map(({ item, unitPrice, productName, optionName, imageUrl }) => ({
    order_id: order.id,
    product_id: optionMap.get(String(item.optionId))?.product_id ?? null,
    option_id: item.optionId,
    product_slug: item.productSlug,
    product_name: productName,
    option_name: optionName,
    unit_price: unitPrice,
    quantity: Number(item.quantity),
    image_url: imageUrl
  }));

  const { error: itemError } = await supabase.from("order_items").insert(orderItems);
  if (itemError) {
    await cleanupCreatedOrder(supabase, order.id);
    return NextResponse.json({ ok: false, message: itemError.message }, { status: 500 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    toss_order_id: orderNo,
    amount: totalAmount,
    status: "ready"
  });
  if (paymentError) {
    await cleanupCreatedOrder(supabase, order.id);
    return NextResponse.json({ ok: false, message: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "db", order });
}
