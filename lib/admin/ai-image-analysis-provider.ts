import {
  analyzeImagesWithMockEngine,
  applyHeroRanking,
  type AiImageAnalysisInput,
  type AiImageAnalysisResult,
  type AiImageQualityFactors,
  type AiImageRecommendedSection,
  type AiImageRole
} from "@/lib/admin/ai-image-analysis";

export type AiImageProviderName = "mock" | "openai";

export type AiImageAnalysisProviderResponse = {
  results: AiImageAnalysisResult[];
  provider: AiImageProviderName;
  resultProvider?: AiImageProviderName;
  fallbackUsed: boolean;
  fallbackReason?: string;
};

export interface AiImageAnalysisProvider {
  name: AiImageProviderName;
  analyzeImage(input: AiImageAnalysisInput): Promise<AiImageAnalysisResult>;
  analyzeImages(inputs: AiImageAnalysisInput[]): Promise<AiImageAnalysisResult[]>;
}

const ROLE_VALUES: AiImageRole[] = [
  "hero",
  "origin",
  "sizeComparison",
  "freshness",
  "package",
  "shipping",
  "cooking",
  "components",
  "process",
  "review",
  "detail",
  "unknown"
];

const SECTION_VALUES: AiImageRecommendedSection[] = [
  "heroImages",
  "journey",
  "gallery",
  "packaging",
  "recipes",
  "components",
  "process",
  "extraSections"
];

function clampScore(value: unknown, fallback: number) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function asRole(value: unknown): AiImageRole {
  return ROLE_VALUES.includes(value as AiImageRole) ? (value as AiImageRole) : "unknown";
}

function asSection(value: unknown): AiImageRecommendedSection {
  return SECTION_VALUES.includes(value as AiImageRecommendedSection) ? (value as AiImageRecommendedSection) : "extraSections";
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI Vision 응답에 JSON이 포함되어 있지 않습니다.");
    return JSON.parse(match[0]);
  }
}

function normalizeQualityFactors(value: unknown, fallback?: AiImageQualityFactors): AiImageQualityFactors | undefined {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    sharpness: clampScore(record.sharpness, fallback?.sharpness ?? 75),
    brightness: clampScore(record.brightness, fallback?.brightness ?? 75),
    composition: clampScore(record.composition, fallback?.composition ?? 75),
    productFocus: clampScore(record.productFocus, fallback?.productFocus ?? 75),
    backgroundCleanliness: clampScore(record.backgroundCleanliness, fallback?.backgroundCleanliness ?? 75),
    usability: clampScore(record.usability, fallback?.usability ?? 75),
    heroSuitability: clampScore(record.heroSuitability, fallback?.heroSuitability ?? 55),
    trustSignal: clampScore(record.trustSignal, fallback?.trustSignal ?? 70),
    penalty: clampScore(record.penalty, fallback?.penalty ?? 0)
  };
}

class MockImageAnalysisProvider implements AiImageAnalysisProvider {
  name: AiImageProviderName = "mock";

  async analyzeImage(input: AiImageAnalysisInput) {
    return analyzeImagesWithMockEngine([input])[0];
  }

  async analyzeImages(inputs: AiImageAnalysisInput[]) {
    return analyzeImagesWithMockEngine(inputs);
  }
}

class OpenAiVisionImageAnalysisProvider implements AiImageAnalysisProvider {
  name: AiImageProviderName = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async analyzeImage(input: AiImageAnalysisInput): Promise<AiImageAnalysisResult> {
    const mock = analyzeImagesWithMockEngine([input])[0];
    const categoryGuide = [
      "상품군별 판단 기준:",
      "- abalone: 대표사진, 크기 비교, 살/단면, 활력/신선도, 손질/세척, 포장, 아이스팩, 조리 예시.",
      "- eel: 손질 상태, 구이 사진, 포장 상태, 살/뼈 구성, 조리 예시.",
      "- octopus: 생물/삶은 상태, 크기 비교, 손질, 포장, 숙회 예시.",
      "- oyster: 석화, 알굴, 세척 상태, 크기, 조리, 포장.",
      "- shrimp: 껍질/머리 상태, 신선도, 크기, 조리, 아이스팩/포장.",
      "- fish: 손질 단면, 신선도, 손질 상태, 조리, 포장.",
      "- mealKit: 재료, 구성품, 조리 과정, 완성 음식.",
      "- gift: 패키지, 구성품, 고급 포장감, 선물 적합성."
    ].join("\n");
    const prompt = [
      "당신은 파도스토리 프리미엄 수산물 쇼핑몰의 상품 사진을 분석합니다.",
      "응답의 모든 title, description, caption, warningMessage, reasoningSummary는 반드시 자연스러운 한국어로 작성하세요.",
      "사진에 보이는 내용만 근거로 판단하세요. 사진만으로 확인할 수 없는 원산지, 채취일, 국내산, 완도산, 통영산, 당일조업, 인증 여부는 단정하지 마세요.",
      categoryGuide,
      "다음 role 중 하나만 선택하세요: hero, origin, sizeComparison, freshness, package, shipping, cooking, components, process, review, detail, unknown.",
      "아이스팩/보냉 박스는 shipping 또는 package로 분류하세요. 죽/구이/탕/완성 요리는 cooking입니다. 손에 든 수산물은 sizeComparison 또는 freshness입니다. 작업장/선별/세척은 process 또는 origin입니다. 포장 봉투/박스는 package 또는 components입니다.",
      "다음 recommendedSection 중 하나만 선택하세요: heroImages, journey, gallery, packaging, recipes, components, process, extraSections.",
      "qualityScore는 선명도, 밝기, 구도, 상품 중심성, 배경 깔끔함, 상세페이지 활용도, 대표사진 적합도, 고객 신뢰도, 흐림/워터마크/과도한 글자/복잡한 배경 감점을 반영하세요.",
      "점수 기준: 90-100 핵심/대표 후보, 75-89 상세페이지 사용 가능, 60-74 보조 이미지, 0-59 운영자 확인 또는 비추천.",
      "엄격한 JSON만 반환하세요. 키: suggestedRole, confidence, qualityScore, title, description, caption, recommendedSection, warningMessage, reasoningSummary, qualityFactors.",
      "qualityFactors 키: sharpness, brightness, composition, productFocus, backgroundCleanliness, usability, heroSuitability, trustSignal, penalty.",
      "문장은 짧고 신뢰감 있게 작성하세요. 과장 광고처럼 보이는 표현은 피하세요.",
      `상품군 힌트: ${input.category || "seafood"}. 원본 파일명: ${input.originalName}.`
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: input.imageUrl } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`OpenAI Vision 요청 실패 (${response.status}): ${body.slice(0, 240)}`);
    }

    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") throw new Error("OpenAI Vision 응답이 비어 있습니다.");

    const parsed = parseJsonObject(text);
    const role = asRole(parsed.suggestedRole);

    return {
      imageUrl: input.imageUrl,
      originalName: input.originalName,
      suggestedRole: role,
      confidence: clampScore(parsed.confidence, mock.confidence),
      qualityScore: clampScore(parsed.qualityScore, mock.qualityScore),
      title: cleanText(parsed.title, mock.title),
      description: cleanText(parsed.description, mock.description),
      caption: cleanText(parsed.caption, mock.caption),
      recommendedSection: asSection(parsed.recommendedSection),
      warningMessage: cleanText(parsed.warningMessage),
      reasoningSummary: cleanText(parsed.reasoningSummary, "사진에 보이는 요소를 기준으로 역할과 배치 위치를 추천했습니다."),
      qualityFactors: normalizeQualityFactors(parsed.qualityFactors, mock.qualityFactors)
    };
  }

  async analyzeImages(inputs: AiImageAnalysisInput[]) {
    const results: AiImageAnalysisResult[] = [];
    for (const input of inputs) {
      results.push(await this.analyzeImage(input));
    }
    return applyHeroRanking(results);
  }
}

export function createAiImageAnalysisProvider(): AiImageAnalysisProvider {
  const configured = String(process.env.PADO_AI_IMAGE_PROVIDER || "mock").toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.PADO_AI_IMAGE_MODEL || "gpt-4o-mini";

  if ((configured === "openai" || configured === "openai-vision") && apiKey) {
    return new OpenAiVisionImageAnalysisProvider(apiKey, model);
  }

  return new MockImageAnalysisProvider();
}

export async function analyzeImagesWithSelectedProvider(inputs: AiImageAnalysisInput[]): Promise<AiImageAnalysisProviderResponse> {
  const provider = createAiImageAnalysisProvider();

  if (provider.name === "mock") {
    return {
      results: await provider.analyzeImages(inputs),
      provider: "mock",
      fallbackUsed: false
    };
  }

  try {
    return {
      results: await provider.analyzeImages(inputs),
      provider: provider.name,
      fallbackUsed: false
    };
  } catch (error) {
    return {
      results: analyzeImagesWithMockEngine(inputs).map((result) => ({
        ...result,
        warningMessage: result.warningMessage || "실제 AI 분석에 실패하여 기본 분석으로 대체했습니다.",
        reasoningSummary: "OpenAI Vision 호출 실패로 파일명과 업로드 순서 기반 분석을 사용했습니다."
      })),
      provider: provider.name,
      resultProvider: "mock",
      fallbackUsed: true,
      fallbackReason: error instanceof Error ? error.message : "알 수 없는 OpenAI Vision 오류"
    };
  }
}
