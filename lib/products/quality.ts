type UnknownRecord = Record<string, unknown>;

export type ProductCompletenessInput = {
  name?: unknown;
  origin?: unknown;
  category?: unknown;
  subtitle?: unknown;
  description?: unknown;
  slug?: unknown;
  basePrice?: unknown;
  imageUrl?: unknown;
  isActive?: unknown;
  options?: unknown;
  detail?: unknown;
};

const asRecord = (value: unknown): UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const hasText = (value: unknown) => Boolean(asText(value));
const itemHas = (value: unknown, keys: string[]) => {
  const item = asRecord(value);
  return keys.some((key) => hasText(item[key]));
};

export function calculateDetailPageQuality(detailValue?: unknown) {
  const detail = asRecord(detailValue);
  if (!Object.keys(detail).length) return { score: 0, missing: ["상세페이지"] };

  const legacyImages = asArray(detail.legacyDetailImages);
  const heroImages = asArray(detail.heroImages);
  const benefits = asArray(detail.benefits);
  const journey = asArray(detail.journey);
  const packaging = asArray(detail.packaging);
  const recipes = asArray(detail.recipes);
  const components = asArray(detail.components);
  const faq = asArray(detail.faq);
  // Videos and extra sections are optional and must never break legacy products.
  asArray(detail.videos);
  asArray(detail.extraSections);

  if (detail.detailDisplayMode === "legacy" && legacyImages.some((image) => itemHas(image, ["url"]))) {
    return { score: 100, missing: [] as string[] };
  }

  const checks: Array<[string, boolean]> = [
    ["상세 이미지", heroImages.some((image) => itemHas(image, ["url"]))],
    ["핵심 문구", benefits.filter((item) => hasText(item)).length >= 3],
    ["산지 여정", journey.filter((item) => itemHas(item, ["description", "image"])).length >= 3],
    ["포장·배송 안내", packaging.filter((item) => hasText(item)).length >= 3],
    ["먹는 방법", recipes.some((item) => itemHas(item, ["title", "description", "image"]))],
    ["구성품", components.some((item) => hasText(item))],
    ["FAQ", faq.some((item) => itemHas(item, ["question", "answer"]))],
  ];
  const completed = checks.filter(([, done]) => done).length;
  return { score: Math.round(completed / checks.length * 100), missing: checks.filter(([, done]) => !done).map(([label]) => label) };
}

export function calculateProductCompleteness(inputValue?: ProductCompletenessInput | null) {
  const input = asRecord(inputValue) as ProductCompletenessInput;
  const options = asArray(input.options).map(asRecord);
  const detail = asRecord(input.detail);
  const heroImages = asArray(detail.heroImages);
  const packaging = asArray(detail.packaging);
  const detailQuality = calculateDetailPageQuality(detail);
  const checks: Array<[string, boolean]> = [
    ["상품명", hasText(input.name)],
    ["판매가", options.some((option) => Number(option.price) > 0) || Number(input.basePrice) > 0],
    ["정상가", options.some((option) => Number(option.regularPrice) >= Number(option.price) && Number(option.regularPrice) > 0)],
    ["옵션", options.some((option) => hasText(option.name))],
    ["재고", options.some((option) => Number(option.stock) > 0)],
    ["대표이미지", hasText(input.imageUrl) || heroImages.some((image) => itemHas(image, ["url"]))],
    ["상세페이지", detailQuality.score > 0],
    ["배송정보", packaging.some((item) => hasText(item))],
    ["원산지", hasText(input.origin)],
    ["카테고리", hasText(input.category)],
    ["공개상태", input.isActive === true],
    ["SEO 정보", hasText(input.name) && hasText(input.slug) && hasText(input.subtitle)],
  ];
  const missing = checks.filter(([, done]) => !done).map(([label]) => label);
  return { score: Math.round(checks.filter(([, done]) => done).length / checks.length * 100), missing };
}
