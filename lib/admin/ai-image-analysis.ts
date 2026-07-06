import type { ProductDetail } from "@/lib/products/detail";

export const AI_IMAGE_ANALYSIS_DRAFT_KEY = "pado-ai-image-analysis-draft";

export type AiImageRole =
  | "hero"
  | "origin"
  | "sizeComparison"
  | "freshness"
  | "package"
  | "shipping"
  | "cooking"
  | "components"
  | "detail"
  | "unknown";

export type AiImageRecommendedSection =
  | "heroImages"
  | "journey"
  | "gallery"
  | "packaging"
  | "recipes"
  | "components"
  | "extraSections";

export type AiImageAnalysisInput = {
  imageUrl: string;
  originalName: string;
  index: number;
  category?: string;
};

export type AiImageAnalysisResult = {
  imageUrl: string;
  originalName: string;
  suggestedRole: AiImageRole;
  confidence: number;
  title: string;
  description: string;
  recommendedSection: AiImageRecommendedSection;
  qualityScore: number;
  warningMessage: string;
};

export type AiImageAnalysisDraft = {
  source: "ai-image-analysis";
  category: string;
  results: AiImageAnalysisResult[];
  detailJson: Partial<ProductDetail>;
  savedAt: string;
};

const ROLE_COPY: Record<AiImageRole, { title: string; description: string; section: AiImageRecommendedSection }> = {
  hero: {
    title: "대표 상품 사진",
    description: "상세페이지 첫 화면에서 상품의 신선함과 크기를 가장 먼저 보여주는 사진입니다.",
    section: "heroImages"
  },
  origin: {
    title: "산지 사진",
    description: "어디에서 온 상품인지 신뢰감을 만드는 산지/생산자 스토리 사진입니다.",
    section: "journey"
  },
  sizeComparison: {
    title: "크기 비교 사진",
    description: "고객이 실제 크기와 구성을 쉽게 이해하도록 돕는 비교 사진입니다.",
    section: "gallery"
  },
  freshness: {
    title: "신선도 확인 사진",
    description: "질감, 윤기, 선도 등 구매를 설득하는 근접 사진입니다.",
    section: "gallery"
  },
  package: {
    title: "포장 사진",
    description: "아이스팩, 산소포장, 진공포장 등 배송 신뢰를 만드는 사진입니다.",
    section: "packaging"
  },
  shipping: {
    title: "배송 사진",
    description: "택배 박스와 냉장 배송 흐름을 보여주는 운영 신뢰 사진입니다.",
    section: "packaging"
  },
  cooking: {
    title: "조리 예시 사진",
    description: "고객이 식탁에서 먹는 장면을 상상하게 만드는 조리/완성 사진입니다.",
    section: "recipes"
  },
  components: {
    title: "구성품 사진",
    description: "실제로 받는 구성과 포함품을 명확히 보여주는 사진입니다.",
    section: "components"
  },
  detail: {
    title: "상세 질감 사진",
    description: "상품 표면, 손질 상태, 품질 포인트를 보강하는 상세 사진입니다.",
    section: "gallery"
  },
  unknown: {
    title: "역할 확인 필요",
    description: "파일명과 순서만으로는 역할이 명확하지 않아 운영자 확인이 필요합니다.",
    section: "extraSections"
  }
};

const CATEGORY_KEYWORDS: Record<string, Partial<Record<AiImageRole, string[]>>> = {
  abalone: {
    hero: ["abalone", "전복", "완도"],
    freshness: ["live", "fresh", "활", "선도"],
    cooking: ["butter", "죽", "구이", "recipe"]
  },
  eel: {
    hero: ["eel", "장어", "anago"],
    cooking: ["grill", "구이", "양념"]
  },
  conch: {
    hero: ["conch", "sora", "소라", "참소라"],
    freshness: ["shell", "껍질", "살"]
  },
  fish: {
    hero: ["fish", "갈치", "고등어", "생선"],
    detail: ["slice", "fillet", "손질"]
  },
  mealKit: {
    hero: ["meal", "kit", "밀키트"],
    components: ["구성", "set", "ingredient"]
  },
  gift: {
    hero: ["gift", "선물", "세트"],
    package: ["box", "package", "포장"]
  }
};

const ROLE_KEYWORDS: Record<AiImageRole, string[]> = {
  hero: ["main", "hero", "대표", "thumbnail", "cover"],
  origin: ["origin", "sea", "boat", "producer", "farm", "산지", "바다", "어선", "생산자"],
  sizeComparison: ["size", "scale", "compare", "hand", "ruler", "크기", "비교"],
  freshness: ["fresh", "live", "texture", "close", "선도", "신선", "질감", "근접"],
  package: ["pack", "package", "box", "ice", "vacuum", "포장", "박스", "아이스", "진공"],
  shipping: ["ship", "delivery", "courier", "cj", "배송", "택배", "송장"],
  cooking: ["cook", "recipe", "grill", "dish", "table", "조리", "요리", "구이", "식탁"],
  components: ["component", "set", "inside", "ingredient", "구성", "내용물", "재료"],
  detail: ["detail", "cut", "slice", "손질", "상세", "단면"],
  unknown: []
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function detectCategoryRole(name: string, category: string) {
  const categoryRules = CATEGORY_KEYWORDS[category] ?? {};
  for (const [role, keywords] of Object.entries(categoryRules) as Array<[AiImageRole, string[]]>) {
    if (keywords.some((keyword) => name.includes(keyword.toLowerCase()))) return role;
  }
  return null;
}

export function analyzeImageWithMockEngine(input: AiImageAnalysisInput): AiImageAnalysisResult {
  const name = normalize(input.originalName);
  const category = input.category || "seafood";
  let role = detectCategoryRole(name, category) ?? "unknown";
  let confidence = role === "unknown" ? 42 : 82;

  if (role === "unknown") {
    for (const [candidate, keywords] of Object.entries(ROLE_KEYWORDS) as Array<[AiImageRole, string[]]>) {
      if (keywords.some((keyword) => name.includes(keyword.toLowerCase()))) {
        role = candidate;
        confidence = 78;
        break;
      }
    }
  }

  if (input.index === 0 && role === "unknown") {
    role = "hero";
    confidence = 74;
  } else if (input.index === 1 && role === "unknown") {
    role = "sizeComparison";
    confidence = 58;
  } else if (input.index >= 4 && role === "unknown") {
    role = "detail";
    confidence = 52;
  }

  const copy = ROLE_COPY[role];
  const qualityScore = Math.min(100, Math.max(35, confidence + (input.imageUrl ? 8 : 0) - (role === "unknown" ? 10 : 0)));
  const warningMessage =
    role === "unknown"
      ? "역할이 불명확합니다. 운영자가 제목과 배치 위치를 확인해주세요."
      : qualityScore < 65
        ? "상세페이지에 사용할 수 있지만 선명도나 역할 확인이 필요합니다."
        : "";

  return {
    imageUrl: input.imageUrl,
    originalName: input.originalName,
    suggestedRole: role,
    confidence,
    title: copy.title,
    description: copy.description,
    recommendedSection: copy.section,
    qualityScore,
    warningMessage
  };
}

export function analyzeImagesWithMockEngine(inputs: AiImageAnalysisInput[]) {
  return inputs.map(analyzeImageWithMockEngine);
}

export function convertImageAnalysisToDetailJson(results: AiImageAnalysisResult[]): Partial<ProductDetail> {
  const heroImages = results
    .filter((item) => item.recommendedSection === "heroImages" || item.suggestedRole === "hero")
    .slice(0, 6)
    .map((item) => ({
      label: item.title,
      url: item.imageUrl,
      description: item.description
    }));

  const journey = results
    .filter((item) => item.suggestedRole === "origin")
    .slice(0, 5)
    .map((item, index) => ({
      key: `ai-origin-${index + 1}`,
      title: item.title,
      image: item.imageUrl,
      description: item.description
    }));

  const packaging = results
    .filter((item) => item.suggestedRole === "package" || item.suggestedRole === "shipping")
    .map((item) => item.description);

  const recipes = results
    .filter((item) => item.suggestedRole === "cooking")
    .map((item) => ({
      title: item.title,
      description: item.description,
      image: item.imageUrl
    }));

  const components = results
    .filter((item) => item.suggestedRole === "components")
    .map((item) => item.title);

  const galleryItems = results
    .filter((item) => item.recommendedSection === "gallery" || item.suggestedRole === "detail" || item.suggestedRole === "freshness" || item.suggestedRole === "sizeComparison")
    .map((item) => ({
      imageUrl: item.imageUrl,
      title: item.title,
      description: item.description,
      caption: `${item.title} · 신뢰도 ${item.confidence}%`,
      role: item.suggestedRole
    }));

  const extraSections = [
    ...(galleryItems.length
      ? [
          {
            type: "ai-gallery",
            title: "AI 추천 갤러리",
            items: galleryItems
          }
        ]
      : []),
    {
      type: "ai-image-analysis",
      title: "AI 사진 분석 결과",
      items: results.map((item) => ({
        imageUrl: item.imageUrl,
        originalName: item.originalName,
        suggestedRole: item.suggestedRole,
        confidence: item.confidence,
        title: item.title,
        description: item.description,
        recommendedSection: item.recommendedSection,
        qualityScore: item.qualityScore,
        warningMessage: item.warningMessage
      }))
    }
  ];

  return {
    heroImages,
    journey,
    packaging,
    recipes,
    components,
    extraSections
  };
}

export const AI_IMAGE_ROLE_OPTIONS: Array<{ value: AiImageRole; label: string }> = [
  { value: "hero", label: "대표사진" },
  { value: "origin", label: "산지" },
  { value: "sizeComparison", label: "크기 비교" },
  { value: "freshness", label: "신선도" },
  { value: "package", label: "포장" },
  { value: "shipping", label: "배송" },
  { value: "cooking", label: "조리" },
  { value: "components", label: "구성품" },
  { value: "detail", label: "상세" },
  { value: "unknown", label: "확인 필요" }
];

export const AI_IMAGE_SECTION_OPTIONS: Array<{ value: AiImageRecommendedSection; label: string }> = [
  { value: "heroImages", label: "대표사진" },
  { value: "journey", label: "산지에서 식탁까지" },
  { value: "gallery", label: "갤러리" },
  { value: "packaging", label: "포장/배송" },
  { value: "recipes", label: "맛있게 먹는 방법" },
  { value: "components", label: "구성품" },
  { value: "extraSections", label: "추가 섹션" }
];
