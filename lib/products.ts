import { products as fallbackProducts, type Product, type ProductOption } from "@/data/products";
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
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    origin: row.origin,
    category: row.category,
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    price: row.base_price,
    image: row.image_url ?? "/images/products/wando-abalone.webp",
    badge: row.badge ?? undefined,
    highlights: row.highlights ?? [],
    isActive: row.is_active,
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
    return data.map((row) => toProduct(row as ProductRow));
  } catch {
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!hasSupabaseEnv()) return fallbackProducts.find((product) => product.slug === slug);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_options(id, name, price_delta, stock)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) return fallbackProducts.find((product) => product.slug === slug);
    return toProduct(data as ProductRow);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug);
  }
}
