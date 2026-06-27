import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

type OrderItemForStock = {
  option_id: string | null;
  quantity: number;
  product_name: string;
  option_name: string;
};

async function getOrderStockRequirements(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: items, error: itemError } = await supabase
    .from("order_items")
    .select("option_id, quantity, product_name, option_name")
    .eq("order_id", orderId);

  if (itemError) return { ok: false as const, message: itemError.message };

  const quantities = new Map<string, { quantity: number; label: string }>();
  for (const item of (items ?? []) as OrderItemForStock[]) {
    if (!item.option_id) {
      return { ok: false as const, message: `${item.product_name} ${item.option_name} 옵션 정보가 없어 재고를 차감할 수 없습니다.` };
    }
    const current = quantities.get(item.option_id);
    quantities.set(item.option_id, {
      quantity: (current?.quantity ?? 0) + Number(item.quantity),
      label: `${item.product_name} ${item.option_name}`
    });
  }

  return { ok: true as const, quantities };
}

async function checkOrderStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const requirements = await getOrderStockRequirements(supabase, orderId);
  if (!requirements.ok) return requirements;

  for (const [optionId, item] of requirements.quantities) {
    const { data: option, error: optionError } = await supabase
      .from("product_options")
      .select("id, stock")
      .eq("id", optionId)
      .single();

    if (optionError || !option) {
      return { ok: false as const, message: optionError?.message ?? `${item.label} 옵션을 찾을 수 없습니다.` };
    }

    const currentStock = Number(option.stock);
    if (currentStock < item.quantity) {
      return { ok: false as const, message: `${item.label} 재고가 부족합니다. 현재 ${currentStock}개 남아 있습니다.` };
    }
  }

  return { ok: true as const };
}

async function decrementOrderStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const requirements = await getOrderStockRequirements(supabase, orderId);
  if (!requirements.ok) return requirements;

  const decremented: { optionId: string; previousStock: number; nextStock: number }[] = [];
  for (const [optionId, item] of requirements.quantities) {
    const { data: option, error: optionError } = await supabase
      .from("product_options")
      .select("id, stock")
      .eq("id", optionId)
      .single();

    if (optionError || !option) {
      return { ok: false as const, message: optionError?.message ?? `${item.label} 옵션을 찾을 수 없습니다.` };
    }

    const previousStock = Number(option.stock);
    if (previousStock < item.quantity) {
      return { ok: false as const, message: `${item.label} 재고가 부족합니다. 현재 ${previousStock}개 남아 있습니다.` };
    }

    const nextStock = previousStock - item.quantity;
    const { data: updated, error: updateError } = await supabase
      .from("product_options")
      .update({ stock: nextStock })
      .eq("id", optionId)
      .eq("stock", previousStock)
      .select("id");

    if (updateError || !updated?.length) {
      for (const rollback of decremented.reverse()) {
        await supabase
          .from("product_options")
          .update({ stock: rollback.previousStock })
          .eq("id", rollback.optionId)
          .eq("stock", rollback.nextStock);
      }
      return { ok: false as const, message: `${item.label} 재고가 동시에 변경되었습니다. 다시 확인해주세요.` };
    }

    decremented.push({ optionId, previousStock, nextStock });
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const { paymentKey, orderId, amount } = body;
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  const supabase = hasSupabaseAdminEnv() ? createAdminClient() : null;
  const { data: order } = supabase
    ? await supabase
        .from("orders")
        .select("id, status, total_amount, payments(status)")
        .eq("order_no", orderId)
        .single()
    : { data: null };
  const paymentRows = Array.isArray(order?.payments) ? order.payments : order?.payments ? [order.payments] : [];
  const alreadyPaid = order?.status === "paid" || paymentRows.some((row) => row.status === "paid");

  if (!secretKey) {
    return NextResponse.json({ ok: false, message: "Toss Payments 시크릿 키가 없습니다." }, { status: 503 });
  }

  if (supabase && order && Number(order.total_amount) !== Number(amount)) {
    return NextResponse.json({ ok: false, message: "주문 금액과 결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  if (supabase && order && !alreadyPaid) {
    const stockCheck = await checkOrderStock(supabase, order.id);
    if (!stockCheck.ok) {
      return NextResponse.json({ ok: false, message: stockCheck.message }, { status: 409 });
    }
  }

  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ paymentKey, orderId, amount })
  });

  const payment = await response.json();
  if (!response.ok) {
    return NextResponse.json({ ok: false, message: payment.message ?? "결제 승인에 실패했습니다.", payment }, { status: 400 });
  }

  if (supabase) {
    if (order) {
      if (!alreadyPaid) {
        const stockResult = await decrementOrderStock(supabase, order.id);
        if (!stockResult.ok) {
          return NextResponse.json({ ok: false, message: stockResult.message }, { status: 409 });
        }
      }

      await supabase
        .from("payments")
        .update({
          payment_key: paymentKey,
          method: payment.method,
          amount: Number(amount),
          status: "paid",
          approved_at: payment.approvedAt
        })
        .eq("order_id", order.id);

      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
    }
  }

  return NextResponse.json({ ok: true, payment });
}
