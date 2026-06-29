import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
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

async function restoreOrderStock(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const requirements = await getOrderStockRequirements(supabase, orderId);
  if (!requirements.ok) return;

  for (const [optionId, item] of requirements.quantities) {
    const { data: option } = await supabase
      .from("product_options")
      .select("id, stock")
      .eq("id", optionId)
      .single();

    if (!option) continue;

    await supabase
      .from("product_options")
      .update({ stock: Number(option.stock) + item.quantity })
      .eq("id", optionId);
  }
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const { paymentKey, orderId, amount } = parsedBody.body;
  const paymentAmount = Number(amount);
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  const supabase = hasSupabaseAdminEnv() ? createAdminClient() : null;

  if (!String(paymentKey ?? "").trim() || !String(orderId ?? "").trim() || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return NextResponse.json({ ok: false, message: "결제 승인 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const { data: order, error: orderError } = supabase
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

  if (supabase && (orderError || !order)) {
    return NextResponse.json({ ok: false, message: orderError?.message ?? "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (supabase && order && Number(order.total_amount) !== paymentAmount) {
    return NextResponse.json({ ok: false, message: "주문 금액과 결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  if (supabase && order && alreadyPaid) {
    return NextResponse.json({ ok: true, payment: { orderId, status: "paid", alreadyConfirmed: true } });
  }

  let stockReserved = false;
  if (supabase && order) {
    const stockResult = await decrementOrderStock(supabase, order.id);
    if (!stockResult.ok) {
      return NextResponse.json({ ok: false, message: stockResult.message }, { status: 409 });
    }
    stockReserved = true;
  }

  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");
  let response: Response;
  try {
    response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paymentKey, orderId, amount: paymentAmount })
    });
  } catch {
    if (stockReserved && supabase && order) await restoreOrderStock(supabase, order.id);
    return NextResponse.json({ ok: false, message: "결제 승인 요청 중 오류가 발생했습니다." }, { status: 502 });
  }

  const payment = await response.json();
  if (!response.ok) {
    if (stockReserved && supabase && order) await restoreOrderStock(supabase, order.id);
    return NextResponse.json({ ok: false, message: payment.message ?? "결제 승인에 실패했습니다.", payment }, { status: 400 });
  }

  if (supabase) {
    if (order) {
      await supabase
        .from("payments")
        .update({
          payment_key: paymentKey,
          method: payment.method,
          amount: paymentAmount,
          status: "paid",
          approved_at: payment.approvedAt
        })
        .eq("order_id", order.id);

      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
    }
  }

  return NextResponse.json({ ok: true, payment });
}
