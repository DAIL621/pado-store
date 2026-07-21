import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readJsonBody } from "@/lib/api/request";
import { hasInvalidProductOption, parseProductOptions } from "@/lib/admin/product-options";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { normalizeProductDetailInput } from "@/lib/products/detail";
import { createProductSlug } from "@/lib/products/slug";
import { withOptionPriceMetadata } from "@/lib/products/option-pricing";
import { createAdminClient } from "@/lib/supabase/admin";

const LOW_STOCK_THRESHOLD = 10;
const verificationPattern = /(verification|admin-edit|detail-auto|ops-db-test|stock-check|test|e2e|duplicate|private-detail|legacy-detail|diagnose|debug|테스트|검증)/i;

type ListedProduct = {
  id: string; slug: string; name: string; origin: string; category: string; base_price: number;
  is_active: boolean; created_at: string; updated_at?: string | null; detail_json?: Record<string, unknown> | null;
  product_options?: Array<{ name?: string; stock?: number }>;
};

const totalStock = (product: ListedProduct) => (product.product_options ?? []).reduce((sum, option) => sum + Math.max(0, Number(option.stock) || 0), 0);
const productState = (product: ListedProduct) => {
  const operationState = product.detail_json?.operationState;
  if (operationState === "deleted") return "deleted";
  if (operationState === "ended") return "ended";
  if (!product.is_active) return "hidden";
  return totalStock(product) > 0 ? "selling" : "soldout";
};
const isVerificationProduct = (product: ListedProduct) =>
  [product.id, product.slug, product.name, product.origin, product.category].some((value) => verificationPattern.test(String(value ?? "")));

const isMissingOptionPriceColumn = (error: { code?: string; message: string } | null) =>
  Boolean(error && (error.code === "PGRST204" || (error.message.includes("schema cache") && error.message.includes("price"))));

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

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const supabase = createAdminClient();
  const searchParams = new URL(request.url).searchParams;
  const slugQuery = searchParams.get("slug");
  if (slugQuery !== null) {
    const requestedSlug = createProductSlug({ slug: slugQuery });
    let query = supabase.from("products").select("id, slug").eq("slug", requestedSlug);
    const excludeId = searchParams.get("excludeId");
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, slug: requestedSlug, available: !data });
  }
  const { data, error } = await supabase
    .from("products")
    .select("*, product_options(*)")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  const q = String(searchParams.get("q") ?? "").trim().toLowerCase();
  const status = searchParams.get("status") ?? "all";
  const kind = searchParams.get("kind") ?? "all";
  const stock = searchParams.get("stock") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const sort = searchParams.get("sort") ?? "created_desc";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = [20, 50].includes(Number(searchParams.get("pageSize"))) ? Number(searchParams.get("pageSize")) : 20;
  const allProducts = (data ?? []) as ListedProduct[];
  const categories = [...new Set(allProducts.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));

  const filtered = allProducts.filter((product) => {
    const state = productState(product);
    if (state === "deleted") return false;
    const optionStocks = product.product_options ?? [];
    const stockTotal = totalStock(product);
    const verification = isVerificationProduct(product);
    const searchable = [product.id, product.name, product.slug, product.category, product.origin, ...optionStocks.map((option) => option.name)].join(" ").toLowerCase();
    return (!q || searchable.includes(q))
      && (status === "all" || state === status)
      && (kind === "all" || (kind === "production" ? !verification : kind === "test_hidden" ? verification && state === "hidden" : verification))
      && (category === "all" || product.category === category)
      && (stock === "all" || (stock === "out" ? stockTotal === 0 : stock === "low" ? stockTotal > 0 && stockTotal <= LOW_STOCK_THRESHOLD : stockTotal > LOW_STOCK_THRESHOLD));
  });

  filtered.sort((a, b) => {
    if (sort === "created_desc") return Date.parse(b.created_at) - Date.parse(a.created_at);
    if (sort === "name_asc") return a.name.localeCompare(b.name, "ko");
    if (sort === "name_desc") return b.name.localeCompare(a.name, "ko");
    if (sort === "price_asc") return a.base_price - b.base_price;
    if (sort === "price_desc") return b.base_price - a.base_price;
    if (sort === "stock_asc") return totalStock(a) - totalStock(b);
    if (sort === "stock_desc") return totalStock(b) - totalStock(a);
    return Date.parse(b.updated_at ?? b.created_at) - Date.parse(a.updated_at ?? a.created_at);
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  return NextResponse.json({
    ok: true,
    products: filtered.slice(start, start + pageSize),
    pagination: { page: safePage, pageSize, total, pageCount },
    categories,
    lowStockThreshold: LOW_STOCK_THRESHOLD
  });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
  if (body.productId || body.id) {
    return NextResponse.json(
      { ok: false, code: "CREATE_WITH_PRODUCT_ID", message: "신규 상품 등록 요청에는 기존 상품 ID를 포함할 수 없습니다." },
      { status: 400 }
    );
  }
  const supabase = createAdminClient();
  const actorId = admin.session.user.id;
  const actorEmail = admin.session.user.email;

  const requiredFields = ["name", "origin", "category", "subtitle", "description", "basePrice"] as const;
  const missingField = requiredFields.find((field) => !String(body[field] ?? "").trim());
  if (missingField) {
    return NextResponse.json({ ok: false, message: "필수 상품 정보를 모두 입력해주세요." }, { status: 400 });
  }

  let basePrice = Number(body.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return NextResponse.json({ ok: false, message: "기본 가격은 0원 이상의 숫자로 입력해주세요." }, { status: 400 });
  }

  const baseSlug = createProductSlug({ slug: body.slug, name: body.name, origin: body.origin });
  let slug = baseSlug;

  if (!slug) {
    return NextResponse.json({ ok: false, message: "영문 상품 URL(slug)을 만들 수 없습니다. 예: wando-live-abalone" }, { status: 400 });
  }

  const { data: duplicateProduct, error: duplicateError } = await supabase
    .from("products")
    .select("id, slug, name, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (duplicateError) {
    return NextResponse.json({ ok: false, message: duplicateError.message }, { status: 500 });
  }

  if (duplicateProduct) {
    if (body.slugAutoGenerated) {
      for (let suffix = 2; suffix <= 999; suffix += 1) {
        const candidate = `${baseSlug}-${suffix}`;
        const { data, error } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
        if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
        if (!data) {
          slug = candidate;
          break;
        }
      }
    } else {
    return NextResponse.json(
      {
        ok: false,
        code: "DUPLICATE_SLUG",
        slug,
        message: `이미 같은 URL 이름(slug)의 상품이 있습니다: ${duplicateProduct.name} (${slug})`
      },
      { status: 409 }
    );
    }
  }

  const optionInputs = parseProductOptions(body.options, "기본 옵션", basePrice);

  if (!optionInputs.length || hasInvalidProductOption(optionInputs)) {
    return NextResponse.json(
      { ok: false, message: "옵션 형식을 확인해주세요. 예: 1kg|0|30" },
      { status: 400 }
    );
  }
  basePrice = Math.min(...optionInputs.map((option) => option.price));

  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);
  const reservedNote =
    body.publishMode === "reserved" && body.reservedAt
      ? `예약 공개 예정: ${String(body.reservedAt)}`
      : "";

  const normalizedDetail = normalizeProductDetailInput(body.detailJson ?? body.detail_json);
  const detailForCreate = body.sourceProductId
    ? { ...normalizedDetail, operationState: "hidden", operation: { state: "hidden", copiedFrom: String(body.sourceProductId), changedAt: new Date().toISOString(), changedBy: actorId } }
    : normalizedDetail;
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
      image_url: body.imageUrl || "/images/product-placeholder.svg",
      badge: body.badge || null,
      detail_json: withOptionPriceMetadata(detailForCreate, optionInputs),
      highlights: String(body.highlights ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .concat(reservedNote ? [reservedNote] : []),
      is_active: isActive
    })
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

  const options = optionInputs.map((option) => ({ ...option, product_id: product.id }));

  let { error: optionError } = await supabase.from("product_options").insert(options);
  if (isMissingOptionPriceColumn(optionError)) {
    const legacyOptions = options.map(({ price, regular_price: _regularPrice, coupang_price: _coupangPrice, ...option }) => ({ ...option, price_delta: price - basePrice }));
    ({ error: optionError } = await supabase.from("product_options").insert(legacyOptions));
  }
  if (optionError) {
    await supabase.from("products").update({ is_active: false }).eq("id", product.id);
    return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });
  }

  await writeProductOperationLogBestEffort(supabase, {
    eventType: body.sourceProductId ? "product.duplicated" : "product.created",
    summary: body.sourceProductId ? "상품 복사본을 생성했습니다." : "상품을 등록했습니다.",
    productId: product.id,
    actorId,
    actorEmail,
    payload: {
      slug: product.slug,
      isActive,
      sourceProductId: body.sourceProductId ? String(body.sourceProductId) : null
    }
  });

  revalidatePath("/", "layout");

  return NextResponse.json({
    ok: true,
    product,
    productId: product.id,
    productSlug: product.slug,
    productUrl: `/products/${product.slug}`,
    message: `상품 등록완료: ${product.name} (${product.slug})`
  });
}
