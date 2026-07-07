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
    if (!match) throw new Error("OpenAI Vision response did not include JSON.");
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
      "Category-specific criteria:",
      "- abalone: hero, size comparison, flesh/cut surface, vitality/freshness, trimming/cleaning, package, ice pack, cooking example.",
      "- eel: trimmed condition, grilled dish, package condition, flesh/bone composition, cooking example.",
      "- octopus: live/boiled state, size comparison, trimming, package, sashimi/sukhoe example.",
      "- oyster: shell oyster, shucked oyster, washed state, size, cooking, package.",
      "- shrimp: shell/head condition, freshness, size, cooking, ice/package.",
      "- fish: fillet/cut surface, freshness, trimmed state, cooking, package.",
      "- mealKit: ingredients, components, cooking steps, finished dish.",
      "- gift: package, components, premium package impression, gift suitability."
    ].join("\n");
    const prompt = [
      "You analyze product photos for PADO STORY, a Korean premium seafood shop.",
      "Look only at visible image content. Do not claim origin, freshness date, domestic origin, Wando, Tongyeong, same-day harvest, or certification unless it is visibly present.",
      categoryGuide,
      "Choose one role: hero, origin, sizeComparison, freshness, package, shipping, cooking, components, process, review, detail, unknown.",
      "Map ice pack/cold box to shipping or package. Cooked porridge/grill/soup to cooking. Seafood held in hand to sizeComparison or freshness. Factory/workshop/sorting/cleaning to process or origin. Package bag/pouch to package or components. Plated appetizing dish can be hero or cooking.",
      "Choose one recommendedSection: heroImages, journey, gallery, packaging, recipes, components, process, extraSections.",
      "Quality score must reflect sharpness, brightness, composition, product focus, clean background, detail page usability, hero suitability, customer trust, and penalties for blur/watermark/text/messy background.",
      "Score guide: 90-100 core/hero candidate, 75-89 usable, 60-74 supporting image, 0-59 needs review or not recommended.",
      "Return strict JSON only with keys: suggestedRole, confidence, qualityScore, title, description, caption, recommendedSection, warningMessage, reasoningSummary, qualityFactors.",
      "qualityFactors must include: sharpness, brightness, composition, productFocus, backgroundCleanliness, usability, heroSuitability, trustSignal, penalty.",
      "Use short, trustworthy Korean copy suitable for a seafood product detail page.",
      `Product category hint: ${input.category || "seafood"}. Original filename: ${input.originalName}.`
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
      throw new Error(`OpenAI Vision request failed (${response.status}): ${body.slice(0, 240)}`);
    }

    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") throw new Error("OpenAI Vision response was empty.");

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
      reasoningSummary: cleanText(parsed.reasoningSummary, "사진에 보이는 요소를 기준으로 역할을 추천했습니다."),
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
        reasoningSummary: "OpenAI Vision 호출 실패로 파일명/순서 기반 Mock 분석을 사용했습니다."
      })),
      provider: "mock",
      fallbackUsed: true,
      fallbackReason: error instanceof Error ? error.message : "Unknown OpenAI Vision failure"
    };
  }
}
