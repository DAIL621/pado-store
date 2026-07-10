import type { ProductDetail } from "@/lib/products/detail";
import { getStandardAiRoleLabel } from "@/lib/admin/ai-role-dictionary";
import { getStandardAiSectionLabel } from "@/lib/admin/ai-section-dictionary";

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
  | "process"
  | "review"
  | "detail"
  | "unknown";

export type AiImageRecommendedSection =
  | "heroImages"
  | "journey"
  | "gallery"
  | "packaging"
  | "recipes"
  | "components"
  | "process"
  | "extraSections";

export type AiImageAnalysisInput = {
  imageUrl: string;
  originalName: string;
  index: number;
  category?: string;
};

export type AiImageQualityFactors = {
  sharpness: number;
  brightness: number;
  composition: number;
  productFocus: number;
  backgroundCleanliness: number;
  usability: number;
  heroSuitability: number;
  trustSignal: number;
  penalty: number;
};

export type AiImageAnalysisResult = {
  imageUrl: string;
  originalName: string;
  suggestedRole: AiImageRole;
  confidence: number;
  title: string;
  description: string;
  caption?: string;
  recommendedSection: AiImageRecommendedSection;
  qualityScore: number;
  heroRank?: number;
  warningMessage: string;
  reasoningSummary?: string;
  qualityFactors?: AiImageQualityFactors;
};

export type AiImageAnalysisDraft = {
  source: "ai-image-analysis";
  category: string;
  results: AiImageAnalysisResult[];
  detailJson: Partial<ProductDetail>;
  savedAt: string;
};

export const AI_IMAGE_ROLE_OPTIONS: Array<{ value: AiImageRole; label: string }> = [
  { value: "hero", label: "대표사진" },
  { value: "origin", label: "산지/현장" },
  { value: "sizeComparison", label: "크기 비교" },
  { value: "freshness", label: "신선도/질감" },
  { value: "package", label: "포장" },
  { value: "shipping", label: "배송/보냉" },
  { value: "cooking", label: "조리 예시" },
  { value: "components", label: "구성품" },
  { value: "process", label: "선별/작업 과정" },
  { value: "review", label: "후기용 사진" },
  { value: "detail", label: "상세 사진" },
  { value: "unknown", label: "확인 필요" }
];

export const AI_IMAGE_SECTION_OPTIONS: Array<{ value: AiImageRecommendedSection; label: string }> = [
  { value: "heroImages", label: "대표사진 영역" },
  { value: "journey", label: "산지에서 식탁까지" },
  { value: "gallery", label: "상세 갤러리" },
  { value: "packaging", label: "포장/배송 안내" },
  { value: "recipes", label: "맛있게 먹는 방법" },
  { value: "components", label: "구성품" },
  { value: "process", label: "선별/작업 과정" },
  { value: "extraSections", label: "추가 섹션" }
];

const ROLE_COPY: Record<AiImageRole, { title: string; description: string; section: AiImageRecommendedSection; caption: string }> = {
  hero: {
    title: "상품이 가장 잘 보이는 대표사진",
    description: "첫 화면에서 상품의 인상을 만드는 대표 이미지 후보입니다.",
    caption: "상품의 전체 모습과 매력을 한눈에 확인할 수 있습니다.",
    section: "heroImages"
  },
  origin: {
    title: "산지와 생산 현장",
    description: "상품이 준비되는 산지나 생산 현장의 분위기를 보여주는 사진입니다.",
    caption: "어디에서 어떻게 준비되는지 신뢰감을 더해줍니다.",
    section: "journey"
  },
  sizeComparison: {
    title: "실제 크기 비교",
    description: "손, 도구, 그릇과 함께 실제 크기감을 이해하기 좋은 사진입니다.",
    caption: "구매 전 상품의 크기감을 쉽게 확인할 수 있습니다.",
    section: "gallery"
  },
  freshness: {
    title: "신선도와 질감 확인",
    description: "살, 표면, 색감, 질감을 가까이에서 보여주는 사진입니다.",
    caption: "상품의 상태와 신선함을 가까이에서 확인할 수 있습니다.",
    section: "gallery"
  },
  package: {
    title: "포장 상태 확인",
    description: "실제 포장 방식과 상품이 담긴 상태를 보여주는 사진입니다.",
    caption: "고객이 받게 될 포장 상태를 미리 확인할 수 있습니다.",
    section: "packaging"
  },
  shipping: {
    title: "배송과 보냉 준비",
    description: "아이스팩, 보냉재, 배송 박스처럼 신선 배송을 설명하는 사진입니다.",
    caption: "신선도를 지키기 위한 배송 준비 과정을 보여줍니다.",
    section: "packaging"
  },
  cooking: {
    title: "조리 및 섭취 예시",
    description: "구이, 죽, 찜, 회 등 상품을 맛있게 즐기는 방법을 보여주는 사진입니다.",
    caption: "어떻게 먹으면 좋은지 바로 떠올릴 수 있습니다.",
    section: "recipes"
  },
  components: {
    title: "구성품 확인",
    description: "고객이 실제로 받는 구성품과 포함 물품을 보여주는 사진입니다.",
    caption: "받는 상품의 구성을 명확하게 확인할 수 있습니다.",
    section: "components"
  },
  process: {
    title: "선별과 작업 과정",
    description: "선별, 손질, 세척, 포장 전 작업 과정을 보여주는 사진입니다.",
    caption: "상품이 준비되는 과정을 보여주어 신뢰감을 높입니다.",
    section: "process"
  },
  review: {
    title: "고객 후기 활용 사진",
    description: "수령 후 모습이나 실제 사용 장면처럼 후기 영역에 어울리는 사진입니다.",
    caption: "실제 사용 장면처럼 자연스럽게 활용할 수 있습니다.",
    section: "extraSections"
  },
  detail: {
    title: "상품 상세 사진",
    description: "표면, 단면, 질감 등 상품의 세부 상태를 보여주는 사진입니다.",
    caption: "상품의 디테일을 자세히 확인할 수 있습니다.",
    section: "gallery"
  },
  unknown: {
    title: "운영자 확인 필요",
    description: "사진의 역할이 명확하지 않아 운영자가 배치 위치를 확인해야 합니다.",
    caption: "상세페이지 사용 전 운영자 검수가 필요합니다.",
    section: "extraSections"
  }
};

const PRODUCT_KEYWORDS: Record<string, Partial<Record<AiImageRole, string[]>>> = {
  abalone: {
    hero: ["abalone", "전복", "wando", "main", "대표"],
    sizeComparison: ["size", "compare", "hand", "ruler", "크기", "비교", "손"],
    freshness: ["live", "fresh", "close", "texture", "신선", "표면", "살", "질감"],
    cooking: ["butter", "porridge", "죽", "구이", "recipe", "cook", "조리"],
    process: ["clean", "손질", "선별", "세척", "작업"]
  },
  eel: {
    hero: ["eel", "장어", "anago", "main", "대표"],
    freshness: ["fillet", "살", "손질", "육질", "bone"],
    cooking: ["grill", "구이", "양념", "cook", "recipe"],
    package: ["pack", "vacuum", "포장", "진공"]
  },
  octopus: {
    hero: ["octopus", "문어", "main"],
    freshness: ["live", "boiled", "숙회", "삶은", "생물"],
    sizeComparison: ["size", "hand", "크기", "손"],
    cooking: ["sashimi", "숙회", "초장", "요리"],
    process: ["clean", "손질", "세척"]
  },
  oyster: {
    hero: ["oyster", "굴", "main"],
    freshness: ["shell", "석화", "깐굴", "세척", "fresh"],
    sizeComparison: ["size", "크기", "손"],
    cooking: ["찜", "구이", "전", "요리"],
    package: ["pack", "box", "ice", "포장"]
  },
  shrimp: {
    hero: ["shrimp", "새우", "main"],
    freshness: ["fresh", "close", "head", "shell", "신선"],
    cooking: ["grill", "찜", "구이", "요리"],
    package: ["pack", "ice", "box", "포장"]
  },
  fish: {
    hero: ["fish", "갈치", "고등어", "생선", "main"],
    detail: ["slice", "fillet", "cut", "단면", "손질"],
    freshness: ["fresh", "close", "살", "윤기"],
    cooking: ["grill", "구이", "조림", "요리"]
  },
  mealKit: {
    hero: ["meal", "kit", "밀키트", "main"],
    components: ["구성", "set", "ingredient", "재료"],
    cooking: ["cook", "recipe", "조리", "완성"]
  },
  gift: {
    hero: ["gift", "선물", "세트", "premium"],
    package: ["box", "package", "포장", "패키지"],
    components: ["구성", "set", "구성품"],
    detail: ["ribbon", "고급", "명절"]
  }
};

const ROLE_KEYWORDS: Record<AiImageRole, string[]> = {
  hero: ["main", "hero", "대표", "thumbnail", "cover", "plate", "접시"],
  origin: ["origin", "sea", "boat", "producer", "farm", "산지", "바다", "어선", "생산자", "양식장"],
  sizeComparison: ["size", "scale", "compare", "hand", "ruler", "크기", "비교", "손"],
  freshness: ["fresh", "live", "texture", "close", "신선", "질감", "근접", "살", "표면", "윤기"],
  package: ["pack", "package", "pouch", "bag", "box", "vacuum", "포장", "봉투", "박스", "진공", "패키지"],
  shipping: ["ship", "shipping", "delivery", "courier", "ice", "icepack", "cold", "cj", "배송", "냉장", "아이스팩", "보냉"],
  cooking: ["cook", "recipe", "grill", "dish", "table", "porridge", "soup", "조리", "요리", "구이", "죽", "찜", "숙회", "식탁"],
  components: ["component", "set", "inside", "ingredient", "구성", "내용물", "재료", "구성품"],
  process: ["process", "factory", "workshop", "sorting", "cleaning", "trim", "선별", "손질", "세척", "작업장", "공정"],
  review: ["review", "customer", "unboxing", "home", "후기", "수령", "언박싱"],
  detail: ["detail", "cut", "slice", "fillet", "surface", "상세", "단면", "표면"],
  unknown: []
};

const ROLE_ORDER: Record<AiImageRole, number> = {
  hero: 1,
  freshness: 2,
  sizeComparison: 3,
  origin: 4,
  process: 5,
  package: 6,
  shipping: 7,
  cooking: 8,
  components: 9,
  detail: 10,
  review: 11,
  unknown: 12
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

function detectRoleByKeywords(name: string, category: string) {
  const productRules = PRODUCT_KEYWORDS[category] ?? {};
  for (const [role, keywords] of Object.entries(productRules) as Array<[AiImageRole, string[]]>) {
    if (hasAny(name, keywords)) return { role, confidence: 86 };
  }
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS) as Array<[AiImageRole, string[]]>) {
    if (hasAny(name, keywords)) return { role, confidence: 80 };
  }
  return { role: "unknown" as AiImageRole, confidence: 42 };
}

function inferQualityFactors(name: string, role: AiImageRole, index: number): AiImageQualityFactors {
  const negative = {
    blur: hasAny(name, ["blur", "blurry", "흐림", "흔들림"]),
    dark: hasAny(name, ["dark", "어두운", "어둠"]),
    watermark: hasAny(name, ["watermark", "logo", "text", "워터마크", "글자"]),
    messy: hasAny(name, ["messy", "dirty", "background", "복잡", "지저분"])
  };
  const positive = {
    clean: hasAny(name, ["clean", "white", "studio", "깨끗", "깔끔"]),
    close: hasAny(name, ["close", "detail", "fresh", "근접", "상세", "신선"]),
    main: role === "hero" || hasAny(name, ["main", "hero", "대표"]),
    trust: role === "origin" || role === "process" || role === "package" || role === "shipping"
  };
  const penalty = (negative.blur ? 22 : 0) + (negative.dark ? 12 : 0) + (negative.watermark ? 16 : 0) + (negative.messy ? 10 : 0);

  return {
    sharpness: Math.max(35, 82 + (positive.close ? 8 : 0) - (negative.blur ? 28 : 0)),
    brightness: Math.max(35, 80 + (positive.clean ? 8 : 0) - (negative.dark ? 22 : 0)),
    composition: Math.max(35, 78 + (positive.main ? 10 : 0) - (negative.messy ? 18 : 0)),
    productFocus: Math.max(35, 80 + (positive.main || positive.close ? 8 : 0) - (negative.messy ? 16 : 0)),
    backgroundCleanliness: Math.max(35, 78 + (positive.clean ? 12 : 0) - (negative.messy ? 22 : 0)),
    usability: Math.max(35, 78 + (role !== "unknown" ? 8 : -18) - (negative.blur ? 12 : 0)),
    heroSuitability: Math.max(25, 58 + (role === "hero" ? 28 : 0) + (index === 0 ? 8 : 0) - penalty),
    trustSignal: Math.max(35, 72 + (positive.trust ? 14 : 0) + (role === "freshness" ? 8 : 0) - (negative.watermark ? 16 : 0)),
    penalty
  };
}

function calculateQualityScore(factors: AiImageQualityFactors) {
  const weighted =
    factors.sharpness * 0.15 +
    factors.brightness * 0.1 +
    factors.composition * 0.12 +
    factors.productFocus * 0.17 +
    factors.backgroundCleanliness * 0.1 +
    factors.usability * 0.18 +
    factors.heroSuitability * 0.1 +
    factors.trustSignal * 0.08 -
    factors.penalty * 0.35;
  return Math.min(100, Math.max(0, Math.round(weighted)));
}

function warningFor(score: number, role: AiImageRole, factors: AiImageQualityFactors) {
  if (factors.penalty >= 30) return "흐림, 어두움, 워터마크, 복잡한 배경 요소가 있어 대표사진으로는 적합하지 않습니다.";
  if (score < 60) return "상세페이지에 사용하기 전 운영자 확인이 필요합니다.";
  if (score < 75) return "보조 이미지로는 사용할 수 있지만 대표사진보다는 하단 갤러리에 적합합니다.";
  if (role === "package" || role === "shipping") return "포장/배송 설명에는 좋지만 메인 대표사진으로는 약합니다.";
  if (role === "cooking") return "조리 예시로 적합합니다. 대표사진보다는 먹는 방법 섹션에 배치하세요.";
  return "";
}

function recommendedRole(input: AiImageAnalysisInput) {
  const name = normalize(input.originalName);
  const detected = detectRoleByKeywords(name, input.category || "seafood");
  if (detected.role !== "unknown") return detected;
  if (input.index === 0) return { role: "hero" as AiImageRole, confidence: 74 };
  if (input.index === 1) return { role: "sizeComparison" as AiImageRole, confidence: 60 };
  if (input.index >= 4) return { role: "detail" as AiImageRole, confidence: 55 };
  return detected;
}

export function getAiRoleLabel(role: AiImageRole | "gallery") {
  return getStandardAiRoleLabel(role);
}

export function getAiSectionLabel(section: AiImageRecommendedSection) {
  return getStandardAiSectionLabel(section);
}

export function sortAiImageAnalysisResults(results: AiImageAnalysisResult[]) {
  return [...results].sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.suggestedRole] - ROLE_ORDER[b.suggestedRole];
    if (roleDiff) return roleDiff;
    return b.qualityScore - a.qualityScore;
  });
}

export function applyHeroRanking(results: AiImageAnalysisResult[]) {
  const heroCandidates = [...results]
    .map((item) => ({
      item,
      score: item.qualityScore + (item.suggestedRole === "hero" ? 18 : 0) + (item.suggestedRole === "freshness" ? 8 : 0) + (item.qualityFactors?.heroSuitability ?? 0) * 0.2
    }))
    .filter(({ item }) => item.suggestedRole === "hero" || item.suggestedRole === "freshness" || item.recommendedSection === "heroImages")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const rankByImage = new Map(heroCandidates.map(({ item }, index) => [item.imageUrl, index + 1]));
  return results.map((item) => ({
    ...item,
    heroRank: rankByImage.get(item.imageUrl)
  }));
}

export function analyzeImageWithMockEngine(input: AiImageAnalysisInput): AiImageAnalysisResult {
  const { role, confidence } = recommendedRole(input);
  const copy = ROLE_COPY[role];
  const normalizedName = normalize(input.originalName);
  const qualityFactors = inferQualityFactors(normalizedName, role, input.index);
  const qualityScore = calculateQualityScore(qualityFactors);
  const warningMessage = warningFor(qualityScore, role, qualityFactors);

  return {
    imageUrl: input.imageUrl,
    originalName: input.originalName,
    suggestedRole: role,
    confidence,
    title: copy.title,
    description: copy.description,
    caption: copy.caption,
    recommendedSection: copy.section,
    qualityScore,
    warningMessage,
    reasoningSummary: "파일명, 업로드 순서, 상품군 규칙, 품질 점수를 종합해 추천했습니다.",
    qualityFactors
  };
}

export function analyzeImagesWithMockEngine(inputs: AiImageAnalysisInput[]) {
  return applyHeroRanking(inputs.map(analyzeImageWithMockEngine));
}

export function summarizeAiImageAnalysis(results: AiImageAnalysisResult[]) {
  const roleCounts = results.reduce<Record<string, number>>((acc, item) => {
    acc[getAiRoleLabel(item.suggestedRole)] = (acc[getAiRoleLabel(item.suggestedRole)] ?? 0) + 1;
    return acc;
  }, {});
  const needsReview = results.filter((item) => item.qualityScore < 75 || item.suggestedRole === "unknown" || item.warningMessage).length;
  const heroCandidates = results.filter((item) => item.heroRank).sort((a, b) => (a.heroRank ?? 99) - (b.heroRank ?? 99));
  const averageQuality = results.length ? Math.round(results.reduce((sum, item) => sum + item.qualityScore, 0) / results.length) : 0;
  return {
    total: results.length,
    roleCounts,
    needsReview,
    heroCandidates,
    averageQuality
  };
}

function firstByRole(results: AiImageAnalysisResult[], roles: AiImageRole[]) {
  return sortAiImageAnalysisResults(results).find((item) => roles.includes(item.suggestedRole));
}

export function convertImageAnalysisToDetailJson(results: AiImageAnalysisResult[]): Partial<ProductDetail> {
  const rankedResults = applyHeroRanking(results);
  const sorted = sortAiImageAnalysisResults(rankedResults);
  const heroImages = sorted
    .filter((item) => item.recommendedSection === "heroImages" || item.suggestedRole === "hero" || item.heroRank)
    .sort((a, b) => (a.heroRank ?? 99) - (b.heroRank ?? 99) || b.qualityScore - a.qualityScore)
    .slice(0, 6)
    .map((item) => ({
      label: item.title,
      url: item.imageUrl,
      description: item.description
    }));

  const journey = sorted
    .filter((item) => item.suggestedRole === "origin" || item.suggestedRole === "process")
    .slice(0, 5)
    .map((item, index) => ({
      key: `ai-journey-${index + 1}`,
      title: item.title,
      image: item.imageUrl,
      description: item.description
    }));

  const packaging = sorted
    .filter((item) => item.suggestedRole === "package" || item.suggestedRole === "shipping")
    .map((item) => item.description);

  const recipes = sorted
    .filter((item) => item.suggestedRole === "cooking")
    .map((item) => ({
      title: item.title,
      description: item.description,
      image: item.imageUrl
    }));

  const components = sorted
    .filter((item) => item.suggestedRole === "components")
    .map((item) => item.title);

  const galleryItems = sorted
    .filter((item) => item.recommendedSection === "gallery" || ["detail", "freshness", "sizeComparison", "review"].includes(item.suggestedRole))
    .map((item) => ({
      imageUrl: item.imageUrl,
      title: item.title,
      description: item.description,
      caption: item.caption || `${item.title} · 신뢰도 ${item.confidence}%`,
      role: item.suggestedRole,
      qualityScore: item.qualityScore,
      heroRank: item.heroRank,
      reasoningSummary: item.reasoningSummary
    }));

  const processItems = sorted
    .filter((item) => item.suggestedRole === "process")
    .map((item) => ({
      imageUrl: item.imageUrl,
      title: item.title,
      description: item.description,
      caption: item.caption,
      qualityScore: item.qualityScore
    }));

  const summary = summarizeAiImageAnalysis(rankedResults);
  const hero = firstByRole(rankedResults, ["hero", "freshness"]);
  const packageOrShipping = firstByRole(rankedResults, ["shipping", "package"]);
  const cooking = firstByRole(rankedResults, ["cooking"]);

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
    ...(processItems.length
      ? [
          {
            type: "ai-process",
            title: "AI 추천 선별/작업 과정",
            items: processItems
          }
        ]
      : []),
    {
      type: "ai-quality-summary",
      title: "AI 상세페이지 품질 요약",
      items: [
        {
          averageQuality: summary.averageQuality,
          totalImages: summary.total,
          needsReview: summary.needsReview,
          heroCandidateCount: summary.heroCandidates.length,
          roleCounts: summary.roleCounts
        }
      ]
    },
    {
      type: "ai-faq-draft",
      title: "AI FAQ 초안",
      items: [
        {
          question: "사진 속 상품 그대로 배송되나요?",
          answer: "사진은 상품 이해를 돕기 위한 예시입니다. 실제 구성과 옵션은 상품 등록 정보 기준으로 확인해주세요."
        },
        {
          question: "포장은 어떻게 오나요?",
          answer: packageOrShipping?.description || "상품 특성에 맞는 냉장/보냉 포장 기준으로 발송됩니다."
        },
        {
          question: "어떻게 먹으면 좋나요?",
          answer: cooking?.description || "상품 상세의 조리 예시와 보관 안내를 함께 확인해주세요."
        }
      ]
    },
    {
      type: "ai-seo-draft",
      title: "AI SEO 초안",
      items: [
        {
          title: hero?.title || "파도스토리 프리미엄 수산물",
          description: hero?.description || "사진 분석 결과를 바탕으로 상세페이지 초안을 준비했습니다.",
          keywords: Object.keys(summary.roleCounts)
        }
      ]
    },
    {
      type: "ai-image-analysis",
      title: "AI 사진 분석 결과",
      items: rankedResults.map((item) => ({
        imageUrl: item.imageUrl,
        originalName: item.originalName,
        suggestedRole: item.suggestedRole,
        confidence: item.confidence,
        title: item.title,
        description: item.description,
        caption: item.caption,
        recommendedSection: item.recommendedSection,
        qualityScore: item.qualityScore,
        heroRank: item.heroRank,
        warningMessage: item.warningMessage,
        reasoningSummary: item.reasoningSummary,
        qualityFactors: item.qualityFactors
      }))
    }
  ];

  return {
    heroImages,
    benefits: [
      hero ? "대표사진 후보를 자동 선별했습니다." : "",
      packageOrShipping ? "포장/배송 사진을 확인했습니다." : "",
      cooking ? "조리 예시를 상세페이지에 연결할 수 있습니다." : "",
      summary.averageQuality >= 75 ? "상세페이지 활용도가 양호합니다." : "운영자 품질 확인이 필요합니다."
    ].filter(Boolean),
    journey,
    packaging,
    recipes,
    components,
    faq: [
      {
        question: "사진 속 상품 그대로 배송되나요?",
        answer: "사진은 상품 이해를 돕기 위한 예시입니다. 실제 구성과 옵션은 상품 등록 정보 기준으로 확인해주세요."
      },
      {
        question: "포장은 어떻게 오나요?",
        answer: packageOrShipping?.description || "상품 특성에 맞는 냉장/보냉 포장 기준으로 발송됩니다."
      }
    ],
    extraSections
  };
}
