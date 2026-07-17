import { products as fallbackProducts, type Product, type ProductOption } from "@/data/products";
import { normalizeProductDetailInput } from "@/lib/products/detail";
import { isPublicProductSlug } from "@/lib/products/public-slug";
import { isNeutralProductPlaceholder } from "@/lib/products/stock-visibility";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  category: string;
  subtitle: string | null;
  description: string | null;
  base_price: number;
  regular_price?: number | null;
  image_url: string | null;
  badge: string | null;
  highlights: string[] | null;
  detail_json?: unknown;
  is_active: boolean;
  product_options?: OptionRow[];
};

type OptionRow = {
  id: string;
  name: string;
  price_delta: number;
  price?: number | null;
  regular_price?: number | null;
  coupang_price?: number | null;
  stock: number;
};

const hasSupabaseEnv = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const demoProductsEnabled = () => process.env.ENABLE_DEMO_PRODUCTS === "true";

function isCustomerVisibleRow(row: ProductRow) {
  const detail = (row.detail_json && typeof row.detail_json === "object" ? row.detail_json : {}) as Record<string, unknown>;
  const state = detail.operationState;
  return row.is_active === true && state !== "deleted" && state !== "hidden" && state !== "ended" && isPublicProductSlug(row.slug);
}

function toProduct(row: ProductRow): Product {
  const pricedOptions = (row.product_options ?? []).map((option) => ({
    option,
    price: Number(option.price ?? row.base_price + option.price_delta)
  })).filter((item) => item.price > 0);
  const optionPrices = pricedOptions.map((item) => item.price);
  const price = optionPrices.length ? Math.min(...optionPrices) : row.base_price;
  const representativeOption = pricedOptions.find((item) => item.price === price)?.option;
  const representativeRegularPrice = Number(representativeOption?.regular_price ?? 0);
  const normalPrice = representativeRegularPrice > price ? representativeRegularPrice : Number(row.regular_price ?? price);
  const discountRate = normalPrice > price ? Math.round((1 - price / normalPrice) * 100) : 0;
  const detail = normalizeProductDetailInput(row.detail_json);
  const primaryDetailImage = detail.heroImages.find((item) => item.label === "대표사진" && item.url)?.url
    || detail.heroImages.find((item) => item.url)?.url;
  const image = isNeutralProductPlaceholder(row.image_url)
    ? primaryDetailImage || "/images/product-placeholder.svg"
    : row.image_url!;
  const detailImages = detail.heroImages.length ? detail.heroImages.map((item) => item.url) : [image];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    origin: row.origin,
    category: row.category,
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    price,
    normalPrice,
    discountRate,
    image,
    badge: row.badge ?? undefined,
    detailImages,
    highlights: row.highlights ?? [],
    detail,
    isActive: row.is_active,
    shippingInfo: {
      title: "평일 오후 1시 이전 주문 당일 출고",
      body: "상품 특성에 맞춰 아이스팩, 보냉재, 냉장 포장으로 신선하게 발송합니다."
    },
    exchangeInfo: {
      title: "신선식품 교환·반품 안내",
      body: "신선식품 특성상 상품 준비 또는 배송 시작 이후에는 단순 변심에 의한 취소·교환·반품이 제한될 수 있습니다. 상품 하자, 오배송 등 표시 내용과 다른 경우에는 고객센터 확인 후 교환 또는 환불을 지원해드립니다."
    },
    originInfo: {
      title: row.origin,
      body: "상품별 산지 기준으로 선별 후 출고합니다."
    },
    producerInfo: {
      title: `${row.origin} 생산자`,
      body: "산지와 작업장 정보를 확인해 상세페이지에 반영합니다."
    },
    options: (row.product_options ?? []).map<ProductOption>((option) => ({
      id: option.id,
      label: option.name,
      priceDelta: option.price_delta,
      price: Number(option.price ?? row.base_price + option.price_delta),
      regularPrice: option.regular_price && Number(option.regular_price) > Number(option.price ?? row.base_price + option.price_delta) ? Number(option.regular_price) : undefined,
      coupangPrice: option.coupang_price && Number(option.coupang_price) > Number(option.price ?? row.base_price + option.price_delta) ? Number(option.coupang_price) : undefined,
      stock: option.stock
    }))
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!hasSupabaseEnv()) return demoProductsEnabled() ? fallbackProducts : [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_options(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return demoProductsEnabled() ? fallbackProducts : [];

    const remoteProducts = data
      .filter((row) => isCustomerVisibleRow(row as ProductRow))
      .map((row) => toProduct(row as ProductRow))
      .filter((product) => isPublicProductSlug(product.slug));
    return remoteProducts;
  } catch {
    return demoProductsEnabled() ? fallbackProducts : [];
  }
}

export async function getProductBySlug(slug: string, options: { includePrivate?: boolean } = {}): Promise<Product | undefined> {
  const includePrivate = Boolean(options.includePrivate);
  if (!includePrivate && !isPublicProductSlug(slug)) return undefined;
  if (!hasSupabaseEnv()) return demoProductsEnabled() ? fallbackProducts.find((product) => product.slug === slug) : undefined;

  try {
    if (includePrivate && hasSupabaseAdminEnv()) {
      const supabase = createAdminClient();
      const { data: productRow, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (productError || !productRow) return undefined;

      const { data: optionRows } = await supabase
        .from("product_options")
        .select("*")
        .eq("product_id", productRow.id)
        .order("created_at", { ascending: true });

      return toProduct({ ...(productRow as ProductRow), product_options: (optionRows ?? []) as OptionRow[] });
    }

    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*, product_options(*)")
      .eq("slug", slug);

    if (!includePrivate) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      const products = await getProducts();
      return products.find((product) => product.slug === slug);
    }
    if (!includePrivate && !isCustomerVisibleRow(data as ProductRow)) return undefined;
    return toProduct(data as ProductRow);
  } catch {
    return demoProductsEnabled() ? fallbackProducts.find((product) => product.slug === slug) : undefined;
  }
}
