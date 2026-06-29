import { products as fallbackProducts, type Product, type ProductOption } from "@/data/products";
import { isPublicProductSlug } from "@/lib/products/public-slug";
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
  image_url: string | null;
  badge: string | null;
  highlights: string[] | null;
  is_active: boolean;
  product_options?: OptionRow[];
};

type OptionRow = {
  id: string;
  name: string;
  price_delta: number;
  stock: number;
};

const hasSupabaseEnv = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function toProduct(row: ProductRow): Product {
  const price = row.base_price;
  const normalPrice = price + (price >= 40000 ? 6000 : 5000);
  const discountRate = Math.round((1 - price / normalPrice) * 100);
  const image = row.image_url ?? "/images/products/wando-abalone.webp";

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
    detailImages: [image],
    highlights: row.highlights ?? [],
    isActive: row.is_active,
    shippingInfo: {
      title: "평일 오후 1시 이전 주문 당일 출고",
      body: "상품 특성에 맞춰 아이스팩, 보냉재, 냉장 포장으로 신선하게 발송합니다."
    },
    exchangeInfo: {
      title: "신선식품 특성상 단순 변심 교환/반품 제한",
      body: "상품 이상이나 오배송은 수령 즉시 사진과 함께 고객센터로 문의해 주세요."
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
      stock: option.stock
    }))
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!hasSupabaseEnv()) return fallbackProducts;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_options(id, name, price_delta, stock)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data?.length) return fallbackProducts;

    const remoteProducts = data
      .map((row) => toProduct(row as ProductRow))
      .filter((product) => isPublicProductSlug(product.slug));
    const remoteSlugs = new Set(remoteProducts.map((product) => product.slug));
    const missingFallbackProducts = fallbackProducts.filter((product) => !remoteSlugs.has(product.slug));
    return [...remoteProducts, ...missingFallbackProducts];
  } catch {
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isPublicProductSlug(slug)) return undefined;
  if (!hasSupabaseEnv()) return fallbackProducts.find((product) => product.slug === slug);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_options(id, name, price_delta, stock)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      const products = await getProducts();
      return products.find((product) => product.slug === slug);
    }
    return toProduct(data as ProductRow);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug);
  }
}
