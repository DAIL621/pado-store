import { NextResponse } from "next/server";
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
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PADO-${ymd}-${random}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const items: OrderItemInput[] = Array.isArray(body.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ ok: false, message: "장바구니가 비어 있습니다." }, { status: 400 });
  }

  const invalidItem = items.find((item) => !item.optionId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0);
  if (invalidItem) {
    return NextResponse.json({ ok: false, message: "상품 옵션과 수량을 다시 확인해주세요." }, { status: 400 });
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const shipping = subtotal >= 50000 ? 0 : 4000;
  const totalAmount = subtotal + shipping;
  const orderNo = makeOrderNo();
  let userId: string | null = null;

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
        total_amount: totalAmount,
        status: "pending"
      },
      message: "Supabase 관리자 키가 없어 테스트 주문번호만 생성했습니다."
    });
  }

  const supabase = createAdminClient();
  const optionIds = [...new Set(items.map((item) => String(item.optionId)))];
  const { data: options, error: optionError } = await supabase
    .from("product_options")
    .select("id, product_id, name, price_delta, stock, products(slug, name, base_price, is_active)")
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

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      status: "pending",
      user_id: userId,
      recipient_name: body.recipientName,
      recipient_phone: body.recipientPhone,
      postcode: body.postcode,
      address: body.address,
      address_detail: body.addressDetail,
      memo: body.memo,
      total_amount: totalAmount
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: optionMap.get(String(item.optionId))?.product_id ?? null,
    option_id: item.optionId,
    product_slug: item.productSlug,
    product_name: item.name,
    option_name: item.optionLabel,
    unit_price: Number(item.unitPrice),
    quantity: Number(item.quantity),
    image_url: item.image
  }));

  const { error: itemError } = await supabase.from("order_items").insert(orderItems);
  if (itemError) return NextResponse.json({ ok: false, message: itemError.message }, { status: 500 });

  await supabase.from("payments").insert({
    order_id: order.id,
    toss_order_id: orderNo,
    amount: totalAmount,
    status: "ready"
  });

  return NextResponse.json({ ok: true, mode: "db", order });
}
