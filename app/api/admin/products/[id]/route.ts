import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readJsonBody } from "@/lib/api/request";
import { hasInvalidProductOption, parseProductOptions } from "@/lib/admin/product-options";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { normalizeProductDetailInput } from "@/lib/products/detail";
import { createAdminClient } from "@/lib/supabase/admin";

const isMissingOptionPriceColumn = (error: { code?: string; message: string } | null) =>
  Boolean(error && (error.code === "PGRST204" || (error.message.includes("schema cache") && error.message.includes("price"))));

const revalidateCustomerProducts = () => revalidatePath("/", "layout");

function withOperationState(detail: unknown, state: "hidden" | "ended" | "deleted" | null, actorId: string) {
  const base = normalizeProductDetailInput(detail);
  const operation: Record<string, unknown> = {
    ...(typeof (base as Record<string, unknown>).operation === "object" && (base as Record<string, unknown>).operation !== null
      ? ((base as Record<string, unknown>).operation as Record<string, unknown>)
      : {}),
    state,
    changedAt: new Date().toISOString(),
    changedBy: actorId
  };
  if (state === "deleted") {
    operation.deletedAt = operation.changedAt;
    operation.deletedBy = actorId;
  }
  return { ...base, operationState: state, operation };
}

async function writeProductOperationLogBestEffort(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    eventType: string;
    summary: string;
    productId: string;
    actorId: string;
    actorEmail?: string;
    payload?: Record<string, unknown>;
  }
) {
  await supabase
    .from("operation_logs")
    .insert({
      event_type: input.eventType,
      summary: input.summary,
      payload: {
        productId: input.productId,
        ...(input.payload ?? {})
      },
      actor: {
        id: input.actorId,
        email: input.actorEmail ?? null,
        type: "admin"
      }
    })
    .then(() => undefined, () => undefined);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  const supabase = createAdminClient();
  const actorId = admin.session.user.id;
  const actorEmail = admin.session.user.email;

  if (body.action === "soldout") {
    const { error: productError } = await supabase.from("products").update({ is_active: true }).eq("id", id);
    if (productError) return NextResponse.json({ ok: false, message: productError.message }, { status: 500 });

    const { error: optionError } = await supabase.from("product_options").update({ stock: 0 }).eq("product_id", id);
    if (optionError) return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });

    await writeProductOperationLogBestEffort(supabase, {
      eventType: "product.soldout",
      summary: "상품을 품절 처리했습니다.",
      productId: id,
      actorId,
      actorEmail
    });

    revalidateCustomerProducts();
    return NextResponse.json({ ok: true, mode: "soldout" });
  }

  if (body.action === "recover") {
    const { data: currentProduct } = await supabase.from("products").select("detail_json").eq("id", id).single();
    const { data: product, error } = await supabase
      .from("products")
      .update({ is_active: true, detail_json: withOperationState(currentProduct?.detail_json, null, actorId) })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    await writeProductOperationLogBestEffort(supabase, {
      eventType: "product.recovered",
      summary: "상품을 복원했습니다.",
      productId: id,
      actorId,
      actorEmail
    });
    revalidateCustomerProducts();
    return NextResponse.json({ ok: true, mode: "recover", product });
  }

  if (body.action === "end_sale") {
    const { data: currentProduct, error: currentError } = await supabase.from("products").select("detail_json").eq("id", id).single();
    if (currentError) return NextResponse.json({ ok: false, message: currentError.message }, { status: 500 });

    const { data: product, error } = await supabase
      .from("products")
      .update({ is_active: false, detail_json: withOperationState(currentProduct?.detail_json, "ended", actorId) })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    await writeProductOperationLogBestEffort(supabase, {
      eventType: "product.sale_ended",
      summary: "상품 판매를 종료했습니다.",
      productId: id,
      actorId,
      actorEmail
    });
    revalidateCustomerProducts();
    return NextResponse.json({ ok: true, mode: "end_sale", product });
  }

  if (body.action === "hide") {
    const { data: currentProduct, error: currentError } = await supabase.from("products").select("detail_json").eq("id", id).single();
    if (currentError) return NextResponse.json({ ok: false, message: currentError.message }, { status: 500 });
    const { data: product, error } = await supabase
      .from("products")
      .update({ is_active: false, detail_json: withOperationState(currentProduct?.detail_json, "hidden", actorId) })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    await writeProductOperationLogBestEffort(supabase, {
      eventType: "product.hidden",
      summary: "상품을 고객 화면에서 숨겼습니다.",
      productId: id,
      actorId,
      actorEmail
    });
    revalidateCustomerProducts();
    return NextResponse.json({ ok: true, mode: "hidden", product });
  }

  const updates: Record<string, unknown> = {};
  const parsedOptions = body.options !== undefined
    ? parseProductOptions(body.options, "", Number(body.basePrice ?? 0))
    : null;
  if (body.slug !== undefined) updates.slug = String(body.slug).trim();
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.origin !== undefined) updates.origin = String(body.origin).trim();
  if (body.category !== undefined) updates.category = String(body.category).trim();
  if (body.subtitle !== undefined) updates.subtitle = String(body.subtitle).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.basePrice !== undefined) updates.base_price = Number(body.basePrice);
  if (parsedOptions?.length && !hasInvalidProductOption(parsedOptions)) {
    updates.base_price = Math.min(...parsedOptions.map((option) => option.price));
  }
  if (body.imageUrl !== undefined) updates.image_url = String(body.imageUrl).trim();
  if (body.badge !== undefined) updates.badge = String(body.badge).trim() || null;
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
  if (body.highlights !== undefined) {
    updates.highlights = String(body.highlights)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (body.detailJson !== undefined || body.detail_json !== undefined) {
    updates.detail_json = normalizeProductDetailInput(body.detailJson ?? body.detail_json);
  }

  if (updates.base_price !== undefined && (!Number.isFinite(updates.base_price) || Number(updates.base_price) < 0)) {
    return NextResponse.json({ ok: false, message: "기본 가격은 0원 이상의 숫자로 입력해주세요." }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    const isMissingDetailColumn = error.message.includes("detail_json");
    return NextResponse.json(
      {
        ok: false,
        message: isDuplicate
          ? "이미 같은 URL 이름(slug)의 상품이 있습니다."
          : isMissingDetailColumn
            ? "Supabase products.detail_json 컬럼이 필요합니다. SQL Editor에서 alter table products add column if not exists detail_json jsonb not null default '{}'::jsonb; 를 먼저 실행해주세요."
            : error.message
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  await writeProductOperationLogBestEffort(supabase, {
    eventType: "product.updated",
    summary: "상품 정보를 수정했습니다.",
    productId: id,
    actorId,
    actorEmail,
    payload: {
      changedFields: Object.keys(updates),
      optionsChanged: body.options !== undefined
    }
  });

  if (body.options !== undefined) {
    const basePriceForOptions = Number(product.base_price ?? body.basePrice ?? 0);
    const options = parsedOptions ?? [];
    if (!options.length || hasInvalidProductOption(options)) {
      return NextResponse.json({ ok: false, message: "옵션 형식을 확인해주세요. 예: 1kg|0|30" }, { status: 400 });
    }

    const { data: existingOptions, error: existingOptionsError } = await supabase
      .from("product_options")
      .select("id")
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (existingOptionsError) {
      return NextResponse.json({ ok: false, message: existingOptionsError.message }, { status: 500 });
    }

    for (const [index, option] of options.entries()) {
      const existingOptionId = existingOptions?.[index]?.id;
      if (existingOptionId) {
        let { error: updateOptionError } = await supabase
          .from("product_options")
          .update(option)
          .eq("id", existingOptionId);

        if (isMissingOptionPriceColumn(updateOptionError)) {
          const { price, regular_price: _regularPrice, coupang_price: _coupangPrice, ...legacyOption } = option;
          ({ error: updateOptionError } = await supabase.from("product_options").update({ ...legacyOption, price_delta: price - basePriceForOptions }).eq("id", existingOptionId));
        }

        if (updateOptionError) return NextResponse.json({ ok: false, message: updateOptionError.message }, { status: 500 });
      } else {
        let { error: insertOptionError } = await supabase
          .from("product_options")
          .insert({ ...option, product_id: id });

        if (isMissingOptionPriceColumn(insertOptionError)) {
          const { price, regular_price: _regularPrice, coupang_price: _coupangPrice, ...legacyOption } = option;
          ({ error: insertOptionError } = await supabase.from("product_options").insert({ ...legacyOption, price_delta: price - basePriceForOptions, product_id: id }));
        }

        if (insertOptionError) return NextResponse.json({ ok: false, message: insertOptionError.message }, { status: 500 });
      }
    }

    const removedOptionIds = (existingOptions ?? []).slice(options.length).map((option) => option.id);
    if (removedOptionIds.length) {
      const { error: deleteOptionError } = await supabase.from("product_options").delete().in("id", removedOptionIds);
      if (deleteOptionError) return NextResponse.json({ ok: false, message: deleteOptionError.message }, { status: 500 });
    }
  }

  revalidateCustomerProducts();
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const actorId = admin.session.user.id;
  const actorEmail = admin.session.user.email;
  const { data: currentProduct, error: currentError } = await supabase.from("products").select("detail_json").eq("id", id).single();
  if (currentError) return NextResponse.json({ ok: false, message: currentError.message }, { status: 500 });

  const { error } = await supabase
    .from("products")
    .update({ is_active: false, detail_json: withOperationState(currentProduct?.detail_json, "deleted", actorId) })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  await writeProductOperationLogBestEffort(supabase, {
    eventType: "product.soft_deleted",
    summary: "상품을 소프트 삭제했습니다.",
    productId: id,
    actorId,
    actorEmail
  });
  revalidateCustomerProducts();
  return NextResponse.json({ ok: true, mode: "soft-delete" });
}
