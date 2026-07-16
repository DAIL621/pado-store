import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

type RequestedItem = { productSlug?: string; optionId?: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { items?: RequestedItem[] } | null;
  const requested = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  const products = await getProducts();
  const items = requested.flatMap((requestedItem) => {
    const product = products.find((item) => item.slug === requestedItem.productSlug && item.isActive !== false);
    const option = product?.options.find((item) => item.id === requestedItem.optionId);
    if (!product || !option) return [];
    const unitPrice = option.price ?? product.price + option.priceDelta;
    return [{
      productSlug: product.slug,
      name: product.name,
      origin: product.origin,
      image: product.image,
      optionId: option.id,
      optionLabel: option.label,
      unitPrice,
      regularPrice: option.regularPrice && option.regularPrice > unitPrice ? option.regularPrice : undefined,
      coupangPrice: option.coupangPrice && option.coupangPrice > unitPrice ? option.coupangPrice : undefined,
      stock: Number(option.stock ?? 0)
    }];
  });
  return NextResponse.json({ ok: true, items });
}
