import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { hasInvalidProductOption, parseProductOptions } from "@/lib/admin/product-options";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { normalizeProductDetailInput } from "@/lib/products/detail";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_options(id, name, price_delta, stock)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, products: data });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  const supabase = createAdminClient();

  const requiredFields = ["name", "origin", "category", "subtitle", "description", "basePrice"] as const;
  const missingField = requiredFields.find((field) => !String(body[field] ?? "").trim());
  if (missingField) {
    return NextResponse.json({ ok: false, message: "필수 상품 정보를 모두 입력해주세요." }, { status: 400 });
  }

  const basePrice = Number(body.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return NextResponse.json({ ok: false, message: "기본 가격은 0원 이상의 숫자로 입력해주세요." }, { status: 400 });
  }

  const slug =
    body.slug ||
    String(body.name ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "");

  if (!slug) {
    return NextResponse.json({ ok: false, message: "상품 URL 이름을 만들 수 없습니다. slug를 직접 입력해주세요." }, { status: 400 });
  }

  const optionInputs = parseProductOptions(body.options, "기본 옵션");

  if (!optionInputs.length || hasInvalidProductOption(optionInputs)) {
    return NextResponse.json(
      { ok: false, message: "옵션 형식을 확인해주세요. 예: 1kg|0|30" },
      { status: 400 }
    );
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: body.name,
      origin: body.origin,
      category: body.category,
      subtitle: body.subtitle,
      description: body.description,
      base_price: basePrice,
      image_url: body.imageUrl || "/images/products/wando-abalone.webp",
      badge: body.badge || null,
      detail_json: normalizeProductDetailInput(body.detailJson ?? body.detail_json),
      highlights: String(body.highlights ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      is_active: true
    })
    .select()
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { ok: false, message: isDuplicate ? "이미 같은 URL 이름(slug)의 상품이 있습니다." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const options = optionInputs.map((option) => ({ ...option, product_id: product.id }));

  const { error: optionError } = await supabase.from("product_options").insert(options);
  if (optionError) {
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product, productUrl: `/products/${product.slug}` });
}
