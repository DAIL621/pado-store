import fs from "node:fs";
import path from "node:path";
import type { AiImageAnalysisResult, AiImageRecommendedSection, AiImageRole } from "@/lib/admin/ai-image-analysis";

export type AiRealDatasetMetadata = {
  imageId: string;
  fileName: string;
  filePath: string;
  category: string;
  provider: string;
  fallbackUsed: boolean;
  suggestedRole: AiImageRole;
  recommendedSection: AiImageRecommendedSection;
  confidence: number;
  qualityScore: number;
  heroRank?: number;
  title: string;
  description: string;
  caption?: string;
  warningMessage: string;
  reasoningSummary?: string;
  analyzedAt: string;
};

export type AiRealDatasetLabel = {
  imageId: string;
  fileName: string;
  productCategory: string;
  expectedRole: AiImageRole;
  expectedSection: AiImageRecommendedSection;
  expectedHeroRank: number | null;
  expectedQualityScore: number;
  expectedWarnings: string[];
  expectedCaption: string;
  expectedTitle: string;
  expectedDescription: string;
  reviewed: boolean;
  approved: boolean;
  reviewerNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type AiRealDatasetStatus = {
  category: string;
  imageCount: number;
  metadataCount: number;
  labelCount: number;
  reviewedCount: number;
  approvedCount: number;
  missingMetadata: string[];
  missingLabels: string[];
};

export type AiReviewHistoryRecord = {
  fileName: string;
  beforeRole: AiImageRole;
  afterRole: AiImageRole;
  beforeSection: AiImageRecommendedSection;
  afterSection: AiImageRecommendedSection;
  changedAt: string;
  reason?: string;
};

export const REAL_DATASET_CATEGORIES = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];
export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function datasetCategoryRoot(category: string) {
  return path.join(process.cwd(), "datasets", category);
}

export function datasetImageDir(category: string) {
  return path.join(datasetCategoryRoot(category), "images");
}

export function datasetMetadataDir(category: string) {
  return path.join(datasetCategoryRoot(category), "metadata");
}

export function datasetLabelDir(category: string) {
  return path.join(datasetCategoryRoot(category), "labels");
}

export function ensureDatasetDirs(category: string) {
  fs.mkdirSync(datasetImageDir(category), { recursive: true });
  fs.mkdirSync(datasetMetadataDir(category), { recursive: true });
  fs.mkdirSync(datasetLabelDir(category), { recursive: true });
}

export function safeDatasetBaseName(fileName: string) {
  const parsed = path.parse(fileName);
  const ascii = parsed.name
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return ascii || Buffer.from(parsed.name).toString("hex").slice(0, 32);
}

export function imageIdFor(category: string, fileName: string) {
  return `${category}-${safeDatasetBaseName(fileName)}`;
}

export function metadataPathFor(category: string, fileName: string) {
  return path.join(datasetMetadataDir(category), `${safeDatasetBaseName(fileName)}.json`);
}

export function labelPathFor(category: string, fileName: string) {
  return path.join(datasetLabelDir(category), `${safeDatasetBaseName(fileName)}.json`);
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function listDatasetImages(category: string) {
  const dir = datasetImageDir(category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== ".gitkeep" && IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ko"));
}

export function readRealMetadata(category: string, fileName: string) {
  return readJson<AiRealDatasetMetadata>(metadataPathFor(category, fileName));
}

export function readRealLabel(category: string, fileName: string) {
  return readJson<AiRealDatasetLabel>(labelPathFor(category, fileName));
}

export function createMetadataFromAnalysis({
  category,
  fileName,
  result,
  provider,
  fallbackUsed
}: {
  category: string;
  fileName: string;
  result: AiImageAnalysisResult;
  provider: string;
  fallbackUsed: boolean;
}): AiRealDatasetMetadata {
  return {
    imageId: imageIdFor(category, fileName),
    fileName,
    filePath: path.join("datasets", category, "images", fileName).replace(/\\/g, "/"),
    category,
    provider,
    fallbackUsed,
    suggestedRole: result.suggestedRole,
    recommendedSection: result.recommendedSection,
    confidence: result.confidence,
    qualityScore: result.qualityScore,
    heroRank: result.heroRank,
    title: result.title,
    description: result.description,
    caption: result.caption,
    warningMessage: result.warningMessage,
    reasoningSummary: result.reasoningSummary,
    analyzedAt: new Date().toISOString()
  };
}

export function createLabelDraftFromMetadata(metadata: AiRealDatasetMetadata): AiRealDatasetLabel {
  return {
    imageId: metadata.imageId,
    fileName: metadata.fileName,
    productCategory: metadata.category,
    expectedRole: metadata.suggestedRole,
    expectedSection: metadata.recommendedSection,
    expectedHeroRank: metadata.heroRank ?? null,
    expectedQualityScore: metadata.qualityScore,
    expectedWarnings: metadata.warningMessage ? [metadata.warningMessage] : [],
    expectedCaption: metadata.caption || "",
    expectedTitle: metadata.title,
    expectedDescription: metadata.description,
    reviewed: false,
    approved: false,
    reviewerNotes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getRealDatasetStatus(category: string): AiRealDatasetStatus {
  const images = listDatasetImages(category);
  const metadata = images.map((fileName) => readRealMetadata(category, fileName));
  const labels = images.map((fileName) => readRealLabel(category, fileName));
  return {
    category,
    imageCount: images.length,
    metadataCount: metadata.filter(Boolean).length,
    labelCount: labels.filter(Boolean).length,
    reviewedCount: labels.filter((label) => label?.reviewed).length,
    approvedCount: labels.filter((label) => label?.approved).length,
    missingMetadata: images.filter((fileName, index) => !metadata[index]),
    missingLabels: images.filter((fileName, index) => !labels[index])
  };
}

export function readRealDatasetItems(category: string) {
  return listDatasetImages(category).map((fileName) => ({
    fileName,
    imageId: imageIdFor(category, fileName),
    imagePath: path.join(datasetImageDir(category), fileName),
    metadata: readRealMetadata(category, fileName),
    label: readRealLabel(category, fileName)
  }));
}

export function appendReviewHistory(record: AiReviewHistoryRecord) {
  const historyDir = path.join(process.cwd(), "reports", "ai-review-history");
  fs.mkdirSync(historyDir, { recursive: true });
  const filePath = path.join(historyDir, `${new Date().toISOString().slice(0, 10)}.json`);
  const current = readJson<AiReviewHistoryRecord[]>(filePath) ?? [];
  writeJson(filePath, [...current, record]);
}
