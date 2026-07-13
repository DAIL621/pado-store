export type ProductDetailImage = {
  label: string;
  url: string;
  description?: string;
};

export type ProductDetailJourneyStep = {
  key: string;
  title: string;
  image: string;
  description: string;
};

export type ProductDetailRecipe = {
  title: string;
  description: string;
  image?: string;
};

export type ProductDetailFaq = {
  question: string;
  answer: string;
};

export type ProductDetailVideo = {
  title: string;
  url: string;
  thumbnail?: string;
  placement?: "top" | "bottom";
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
};

export type ProductDetailCertificate = {
  title: string;
  image: string;
  description?: string;
};

export type ProductDetailExtraSection = {
  type: string;
  title: string;
  items?: unknown[];
};

export type ProductDetailDisplayMode = "legacy" | "ai";

export type ProductDetail = {
  schemaVersion: number;
  detailDisplayMode: ProductDetailDisplayMode;
  heroImages: ProductDetailImage[];
  legacyDetailImages: ProductDetailImage[];
  benefits: string[];
  journey: ProductDetailJourneyStep[];
  packaging: string[];
  recipes: ProductDetailRecipe[];
  components: string[];
  faq: ProductDetailFaq[];
  videos: ProductDetailVideo[];
  certificates: ProductDetailCertificate[];
  extraSections: ProductDetailExtraSection[];
};

export const DETAIL_SCHEMA_VERSION = 1;

export const HERO_IMAGE_LABELS = [
  "대표사진",
  "크기 비교 사진",
  "신선도/질감 사진",
  "구성품 사진",
  "포장 상태 사진",
  "조리 후 모습 사진"
] as const;

export const JOURNEY_STEPS = [
  { key: "origin", title: "산지" },
  { key: "sorting", title: "선별" },
  { key: "packing", title: "포장" },
  { key: "delivery", title: "배송" },
  { key: "table", title: "식탁" }
] as const;

export const DEFAULT_PACKAGING = [
  "아이스팩 동봉",
  "냉장 신선 포장",
  "평일 오후 1시 이전 주문 당일 출고",
  "안전한 포장으로 신선도 유지"
] as const;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const cleanText = (value: unknown) => String(value ?? "").trim();

const cleanTextList = (value: unknown) =>
  Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];

function normalizeDisplayMode(value: unknown): ProductDetailDisplayMode {
  return value === "ai" ? "ai" : "legacy";
}

function normalizeDetailImages(value: unknown): ProductDetailImage[] {
  return Array.isArray(value)
    ? value
        .map((item, index) => {
          const record = asRecord(item);
          return {
            label: cleanText(record.label) || `기존 상세페이지 ${index + 1}`,
            url: cleanText(record.url),
            description: cleanText(record.description)
          };
        })
        .filter((item) => item.url)
    : [];
}

export function createProductDetailFormValue(input?: unknown): ProductDetail {
  const source = asRecord(input);
  const heroSource = Array.isArray(source.heroImages) ? source.heroImages : [];
  const journeySource = Array.isArray(source.journey) ? source.journey : [];

  return {
    schemaVersion: DETAIL_SCHEMA_VERSION,
    detailDisplayMode: normalizeDisplayMode(source.detailDisplayMode),
    heroImages: HERO_IMAGE_LABELS.map((defaultLabel, index) => {
      const item = asRecord(heroSource[index]);
      return {
        label: cleanText(item.label) || defaultLabel,
        url: cleanText(item.url),
        description: cleanText(item.description)
      };
    }),
    legacyDetailImages: normalizeDetailImages(source.legacyDetailImages),
    benefits: padTextList(cleanTextList(source.benefits), 3),
    journey: JOURNEY_STEPS.map((step, index) => {
      const item = asRecord(journeySource[index]);
      return {
        key: cleanText(item.key) || step.key,
        title: cleanText(item.title) || step.title,
        image: cleanText(item.image),
        description: cleanText(item.description)
      };
    }),
    packaging: cleanTextList(source.packaging).length ? cleanTextList(source.packaging) : [...DEFAULT_PACKAGING],
    recipes: normalizeRecipes(source.recipes, true),
    components: cleanTextList(source.components).length ? cleanTextList(source.components) : [""],
    faq: normalizeFaq(source.faq, true),
    videos: normalizeVideos(source.videos),
    certificates: normalizeCertificates(source.certificates),
    extraSections: normalizeExtraSections(source.extraSections)
  };
}

export function normalizeProductDetailInput(input?: unknown): ProductDetail {
  const source = asRecord(input);
  const heroSource = Array.isArray(source.heroImages) ? source.heroImages : [];
  const journeySource = Array.isArray(source.journey) ? source.journey : [];

  return {
    schemaVersion: DETAIL_SCHEMA_VERSION,
    detailDisplayMode: normalizeDisplayMode(source.detailDisplayMode),
    heroImages: heroSource
      .map((item, index) => {
        const record = asRecord(item);
        return {
          label: cleanText(record.label) || HERO_IMAGE_LABELS[index] || "상세 사진",
          url: cleanText(record.url),
          description: cleanText(record.description)
        };
      })
      .filter((item) => item.url)
      .slice(0, 6),
    legacyDetailImages: normalizeDetailImages(source.legacyDetailImages),
    benefits: cleanTextList(source.benefits).slice(0, 5),
    journey: journeySource
      .map((item, index) => {
        const record = asRecord(item);
        const defaultStep = JOURNEY_STEPS[index];
        const title = cleanText(record.title);
        const image = cleanText(record.image);
        const description = cleanText(record.description);
        return {
          key: cleanText(record.key) || defaultStep?.key || `step-${index + 1}`,
          title: title || defaultStep?.title || `단계 ${index + 1}`,
          image,
          description,
          hasContent: Boolean(image || description || (title && title !== defaultStep?.title))
        };
      })
      .filter((item) => item.hasContent)
      .map(({ hasContent: _hasContent, ...item }) => item)
      .slice(0, 5),
    packaging: cleanTextList(source.packaging),
    recipes: normalizeRecipes(source.recipes, false),
    components: cleanTextList(source.components),
    faq: normalizeFaq(source.faq, false),
    videos: normalizeVideos(source.videos),
    certificates: normalizeCertificates(source.certificates),
    extraSections: normalizeExtraSections(source.extraSections)
  };
}

function padTextList(items: string[], minimumLength: number) {
  const next = [...items];
  while (next.length < minimumLength) next.push("");
  return next.slice(0, 5);
}

function normalizeRecipes(value: unknown, forForm: boolean): ProductDetailRecipe[] {
  const recipes = Array.isArray(value)
    ? value
        .map((item) => {
          const record = asRecord(item);
          return {
            title: cleanText(record.title),
            description: cleanText(record.description),
            image: cleanText(record.image)
          };
        })
        .filter((item) => forForm || item.title || item.description || item.image)
    : [];

  return recipes.length || !forForm ? recipes : [{ title: "", description: "", image: "" }];
}

function normalizeFaq(value: unknown, forForm: boolean): ProductDetailFaq[] {
  const faq = Array.isArray(value)
    ? value
        .map((item) => {
          const record = asRecord(item);
          return {
            question: cleanText(record.question),
            answer: cleanText(record.answer)
          };
        })
        .filter((item) => forForm || item.question || item.answer)
    : [];

  return faq.length || !forForm ? faq : [{ question: "", answer: "" }];
}

function normalizeVideos(value: unknown): ProductDetailVideo[] {
  return Array.isArray(value)
    ? value
        .map((item): ProductDetailVideo => {
          const record = asRecord(item);
          const placement = cleanText(record.placement || record.position);
          const autoplay = record.autoplay === true;
          return {
            title: cleanText(record.title),
            url: cleanText(record.url),
            thumbnail: cleanText(record.thumbnail),
            placement: placement === "top" ? "top" : "bottom",
            autoplay,
            muted: autoplay ? true : record.muted !== false,
            loop: record.loop === true,
            controls: record.controls !== false
          };
        })
        .filter((item) => item.title || item.url || item.thumbnail)
    : [];
}

function normalizeCertificates(value: unknown): ProductDetailCertificate[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          const record = asRecord(item);
          return {
            title: cleanText(record.title),
            image: cleanText(record.image),
            description: cleanText(record.description)
          };
        })
        .filter((item) => item.title || item.image || item.description)
    : [];
}

function normalizeExtraSections(value: unknown): ProductDetailExtraSection[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          const record = asRecord(item);
          return {
            type: cleanText(record.type),
            title: cleanText(record.title),
            items: Array.isArray(record.items) ? record.items : []
          };
        })
        .filter((item) => item.type || item.title || item.items?.length)
    : [];
}
