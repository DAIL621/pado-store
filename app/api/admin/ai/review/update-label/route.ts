import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import {
  appendReviewHistory,
  labelPathFor,
  readRealLabel,
  writeJson,
  type AiRealDatasetLabel
} from "@/lib/admin/ai-real-dataset";
import type { AiImageRecommendedSection, AiImageRole } from "@/lib/admin/ai-image-analysis";
import { requireAdminApi } from "@/lib/auth/admin-api";

export const dynamic = "force-dynamic";

const ROLE_VALUES = new Set(["hero", "origin", "sizeComparison", "freshness", "package", "shipping", "cooking", "components", "process", "review", "detail", "unknown"]);
const SECTION_VALUES = new Set(["heroImages", "journey", "gallery", "packaging", "recipes", "components", "process", "extraSections"]);

function asRole(value: unknown, fallback: AiImageRole): AiImageRole {
  return ROLE_VALUES.has(String(value)) ? (String(value) as AiImageRole) : fallback;
}

function asSection(value: unknown, fallback: AiImageRecommendedSection): AiImageRecommendedSection {
  return SECTION_VALUES.has(String(value)) ? (String(value) as AiImageRecommendedSection) : fallback;
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const body = parsedBody.body as Record<string, unknown>;
  const category = String(body.category || "");
  const fileName = String(body.fileName || "");
  if (!category || !fileName || fileName.includes("..")) {
    return NextResponse.json({ ok: false, message: "Invalid label update request." }, { status: 400 });
  }

  const current = readRealLabel(category, fileName);
  if (!current) return NextResponse.json({ ok: false, message: "Label file not found." }, { status: 404 });

  const beforeRole = current.expectedRole;
  const beforeSection = current.expectedSection;
  const next: AiRealDatasetLabel = {
    ...current,
    expectedRole: asRole(body.expectedRole, current.expectedRole),
    expectedSection: asSection(body.expectedSection, current.expectedSection),
    expectedHeroRank: body.expectedHeroRank === "" || body.expectedHeroRank === null ? null : Number(body.expectedHeroRank ?? current.expectedHeroRank),
    expectedQualityScore: Math.max(0, Math.min(100, Math.round(Number(body.expectedQualityScore ?? current.expectedQualityScore)))),
    expectedCaption: String(body.expectedCaption ?? current.expectedCaption),
    expectedTitle: String(body.expectedTitle ?? current.expectedTitle),
    expectedDescription: String(body.expectedDescription ?? current.expectedDescription),
    reviewed: Boolean(body.reviewed),
    approved: Boolean(body.approved),
    reviewerNotes: String(body.reviewerNotes ?? current.reviewerNotes),
    updatedAt: new Date().toISOString()
  };

  writeJson(labelPathFor(category, fileName), next);

  if (beforeRole !== next.expectedRole || beforeSection !== next.expectedSection) {
    appendReviewHistory({
      fileName,
      beforeRole,
      afterRole: next.expectedRole,
      beforeSection,
      afterSection: next.expectedSection,
      changedAt: new Date().toISOString(),
      reason: next.reviewerNotes || "AI 검수센터에서 수정했습니다."
    });
  }

  return NextResponse.json({ ok: true, label: next });
}
