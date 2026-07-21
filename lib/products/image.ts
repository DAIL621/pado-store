import { normalizeProductDetailInput } from "@/lib/products/detail";

export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

export function normalizeProductImageUrl(value: unknown) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate || candidate === PRODUCT_IMAGE_PLACEHOLDER) return "";
  if (/^(https?:|data:|blob:)/i.test(candidate) || candidate.startsWith("/")) return candidate;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return `/${candidate.replace(/^\/+/, "")}`;
  const storagePath = candidate.replace(/^storage\/v1\/object\/public\//, "").replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
}

export function resolveProductImage(input: { imageUrl?: unknown; images?: unknown; optionImages?: unknown; detail?: unknown }) {
  const detail = normalizeProductDetailInput(input.detail);
  const candidates = [input.imageUrl, ...(Array.isArray(input.images) ? input.images : []), detail.heroImages.find((image) => image.label === "대표사진")?.url, ...detail.heroImages.map((image) => image.url), ...(Array.isArray(input.optionImages) ? input.optionImages : [])];
  for (const candidate of candidates) {
    const normalized = normalizeProductImageUrl(candidate);
    if (normalized) return normalized;
  }
  return PRODUCT_IMAGE_PLACEHOLDER;
}
