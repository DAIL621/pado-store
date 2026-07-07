import {
  analyzeImagesWithMockEngine,
  type AiImageAnalysisInput,
  type AiImageAnalysisResult,
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
    const prompt = [
      "You analyze product photos for PADO STORY, a Korean premium seafood shop.",
      "Look only at visible image content. Do not claim origin, freshness date, domestic origin, Wando, Tongyeong, same-day harvest, or certification unless it is visibly present.",
      "Choose one role: hero, origin, sizeComparison, freshness, package, shipping, cooking, components, detail, unknown.",
      "Choose one recommendedSection: heroImages, journey, gallery, packaging, recipes, components, extraSections.",
      "Return strict JSON only with keys: suggestedRole, confidence, qualityScore, title, description, recommendedSection, warningMessage, reasoningSummary.",
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
    const section = asSection(parsed.recommendedSection);

    return {
      imageUrl: input.imageUrl,
      originalName: input.originalName,
      suggestedRole: role,
      confidence: clampScore(parsed.confidence, mock.confidence),
      qualityScore: clampScore(parsed.qualityScore, mock.qualityScore),
      title: cleanText(parsed.title, mock.title),
      description: cleanText(parsed.description, mock.description),
      recommendedSection: section,
      warningMessage: cleanText(parsed.warningMessage),
      reasoningSummary: cleanText(parsed.reasoningSummary, "사진에 보이는 요소를 기준으로 역할을 추천했습니다.")
    };
  }

  async analyzeImages(inputs: AiImageAnalysisInput[]) {
    const results: AiImageAnalysisResult[] = [];
    for (const input of inputs) {
      results.push(await this.analyzeImage(input));
    }
    return results;
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
