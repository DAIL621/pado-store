import type { ProductDetail } from "@/lib/products/detail";

export type ProductCompletenessInput = {
  name?: string | null;
  origin?: string | null;
  category?: string | null;
  subtitle?: string | null;
  description?: string | null;
  slug?: string | null;
  basePrice?: number | string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  options?: Array<{ name?: string | null; price?: number | string | null; regularPrice?: number | string | null; stock?: number | string | null }>;
  detail?: ProductDetail | null;
};

export function calculateDetailPageQuality(detail?: ProductDetail | null) {
  if (!detail) return { score: 0, missing: ["상세페이지"] };
  if (detail.detailDisplayMode === "legacy" && detail.legacyDetailImages.some((image) => image.url.trim())) {
    return { score: 100, missing: [] as string[] };
  }
  const checks = [
    ["상세 이미지", detail.heroImages.some((image) => image.url)],
    ["핵심 문구", detail.benefits.filter(Boolean).length >= 3],
    ["산지 여정", detail.journey.filter((item) => item.description || item.image).length >= 3],
    ["포장·배송 안내", detail.packaging.filter(Boolean).length >= 3],
    ["먹는 방법", detail.recipes.some((item) => item.title || item.description || item.image)],
    ["구성품", detail.components.some(Boolean)],
    ["FAQ", detail.faq.some((item) => item.question || item.answer)],
  ] as const;
  return { score: Math.round(checks.filter(([, done]) => done).length / checks.length * 100), missing: checks.filter(([, done]) => !done).map(([label]) => label) };
}

export function calculateProductCompleteness(input: ProductCompletenessInput) {
  const options = input.options ?? [];
  const checks = [
    ["상품명", Boolean(input.name?.trim())],
    ["판매가", options.some((option) => Number(option.price) > 0) || Number(input.basePrice) > 0],
    ["정상가", options.some((option) => Number(option.regularPrice) >= Number(option.price) && Number(option.regularPrice) > 0)],
    ["옵션", options.some((option) => option.name?.trim())],
    ["재고", options.some((option) => Number(option.stock) > 0)],
    ["대표이미지", Boolean(input.imageUrl?.trim() || input.detail?.heroImages.some((image) => image.url))],
    ["상세페이지", calculateDetailPageQuality(input.detail).score > 0],
    ["배송정보", Boolean(input.detail?.packaging.some(Boolean))],
    ["원산지", Boolean(input.origin?.trim())],
    ["카테고리", Boolean(input.category?.trim())],
    ["공개상태", input.isActive === true],
    ["SEO 정보", Boolean(input.name?.trim() && input.slug?.trim() && input.subtitle?.trim())],
  ] as const;
  const missing = checks.filter(([, done]) => !done).map(([label]) => label);
  return { score: Math.round(checks.filter(([, done]) => done).length / checks.length * 100), missing };
}
