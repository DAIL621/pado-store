import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { analyzeImagesWithSelectedProvider } from "@/lib/admin/ai-image-analysis-provider";
import type { AiImageAnalysisInput } from "@/lib/admin/ai-image-analysis";
import { requireAdminApi } from "@/lib/auth/admin-api";

export const dynamic = "force-dynamic";

const MAX_IMAGES = 20;
const MAX_DATA_URL_LENGTH = 8 * 1024 * 1024;

function normalizeInputs(value: unknown): AiImageAnalysisInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const imageUrl = String(record.imageUrl ?? "").trim();
      const originalName = String(record.originalName ?? `image-${index + 1}.jpg`).trim();
      const category = String(record.category ?? "").trim();

      return {
        imageUrl,
        originalName,
        index: Number.isFinite(Number(record.index)) ? Number(record.index) : index,
        category
      };
    })
    .filter((item) => item.imageUrl && item.originalName)
    .slice(0, MAX_IMAGES);
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const body = parsedBody.body as Record<string, unknown>;
  const category = String(body.category ?? "seafood");
  const inputs = normalizeInputs(body.images).map((input) => ({ ...input, category: input.category || category }));

  if (!inputs.length) {
    return NextResponse.json({ ok: false, message: "분석할 이미지가 없습니다." }, { status: 400 });
  }

  const oversized = inputs.find((input) => input.imageUrl.startsWith("data:") && input.imageUrl.length > MAX_DATA_URL_LENGTH);
  if (oversized) {
    return NextResponse.json(
      {
        ok: false,
        message: `${oversized.originalName} 이미지가 너무 큽니다. 8MB 이하 이미지로 다시 시도해주세요.`
      },
      { status: 413 }
    );
  }

  const analysis = await analyzeImagesWithSelectedProvider(inputs);

  return NextResponse.json({
    ok: true,
    results: analysis.results,
    provider: analysis.provider,
    resultProvider: analysis.resultProvider || analysis.provider,
    fallbackUsed: analysis.fallbackUsed,
    fallbackReason: analysis.fallbackReason,
    envStatus: {
      padoAiImageProvider: process.env.PADO_AI_IMAGE_PROVIDER || "",
      hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
      padoAiImageModel: process.env.PADO_AI_IMAGE_MODEL || ""
    }
  });
}
