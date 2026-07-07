import fs from "node:fs";
import path from "node:path";
import { analyzeImagesWithMockEngine, type AiImageAnalysisInput, type AiImageAnalysisResult, type AiImageRecommendedSection, type AiImageRole } from "@/lib/admin/ai-image-analysis";

export type AiDatasetLabel = {
  imageId: string;
  fileName: string;
  productCategory: string;
  expectedRole: AiImageRole | "gallery";
  expectedSection: AiImageRecommendedSection;
  expectedHeroRank: number | null;
  expectedQualityScore: number;
  expectedWarnings: string[];
  expectedCaption: string;
  expectedTitle: string;
  expectedDescription: string;
  notes: string;
};

export type AiDatasetCategory = {
  category: string;
  labels: AiDatasetLabel[];
};

export type AiDatasetEvaluationItem = {
  label: AiDatasetLabel;
  prediction: AiImageAnalysisResult;
  roleMatch: boolean;
  sectionMatch: boolean;
  heroMatch: boolean;
  qualityMatch: boolean;
  warningMatch: boolean;
  captionScore: number;
  totalScore: number;
  errorReasons: string[];
};

export type AiDatasetEvaluation = {
  datasetCount: number;
  imageCount: number;
  roleAccuracy: number;
  heroAccuracy: number;
  captionAccuracy: number;
  sectionAccuracy: number;
  qualityAccuracy: number;
  warningAccuracy: number;
  totalScore: number;
  categoryScores: Array<{ category: string; imageCount: number; totalScore: number; roleAccuracy: number }>;
  errors: AiDatasetEvaluationItem[];
  items: AiDatasetEvaluationItem[];
};

const DATASET_ROOT = path.join(process.cwd(), "datasets");
const DATASET_CATEGORIES = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function readAiDatasets(): AiDatasetCategory[] {
  return DATASET_CATEGORIES.map((category) => {
    const labelPath = path.join(DATASET_ROOT, category, "labels", "fixtures.json");
    const labels = fs.existsSync(labelPath) ? readJsonFile<AiDatasetLabel[]>(labelPath) : [];
    return { category, labels };
  });
}

function fixtureImage(imageId: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#0a7f83"/><text x="60" y="250" fill="white" font-size="34" font-family="Arial">${imageId}</text></svg>`
    )
  );
}

function labelToInput(label: AiDatasetLabel, index: number): AiImageAnalysisInput {
  return {
    imageUrl: fixtureImage(label.imageId),
    originalName: label.fileName,
    index,
    category: label.productCategory
  };
}

function textSimilarity(a: string, b: string) {
  const left = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const right = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((word) => right.has(word)).length;
  return Math.round((overlap / Math.max(left.size, right.size)) * 100);
}

function scoreItem(label: AiDatasetLabel, prediction: AiImageAnalysisResult): AiDatasetEvaluationItem {
  const roleMatch = prediction.suggestedRole === label.expectedRole || (label.expectedRole === "gallery" && prediction.recommendedSection === "gallery");
  const sectionMatch = prediction.recommendedSection === label.expectedSection;
  const heroMatch = label.expectedHeroRank === null ? !prediction.heroRank : prediction.heroRank === label.expectedHeroRank;
  const qualityMatch = Math.abs(prediction.qualityScore - label.expectedQualityScore) <= 18;
  const warningMatch = label.expectedWarnings.length ? Boolean(prediction.warningMessage) : !prediction.warningMessage;
  const captionScore = Math.max(textSimilarity(prediction.caption || "", label.expectedCaption), textSimilarity(prediction.title, label.expectedTitle));
  const totalScore = Math.round(
    (roleMatch ? 28 : 0) +
      (sectionMatch ? 20 : 0) +
      (heroMatch ? 16 : 0) +
      (qualityMatch ? 14 : 0) +
      (warningMatch ? 12 : 0) +
      captionScore * 0.1
  );
  const errorReasons = [
    roleMatch ? "" : `role: expected ${label.expectedRole}, got ${prediction.suggestedRole}`,
    sectionMatch ? "" : `section: expected ${label.expectedSection}, got ${prediction.recommendedSection}`,
    heroMatch ? "" : `hero: expected ${label.expectedHeroRank ?? "none"}, got ${prediction.heroRank ?? "none"}`,
    qualityMatch ? "" : `quality: expected around ${label.expectedQualityScore}, got ${prediction.qualityScore}`,
    warningMatch ? "" : "warning mismatch"
  ].filter(Boolean);

  return {
    label,
    prediction,
    roleMatch,
    sectionMatch,
    heroMatch,
    qualityMatch,
    warningMatch,
    captionScore,
    totalScore,
    errorReasons
  };
}

function percent(matches: number, total: number) {
  return total ? Math.round((matches / total) * 1000) / 10 : 0;
}

export function scoreAiDataset(datasets = readAiDatasets()): AiDatasetEvaluation {
  const items: AiDatasetEvaluationItem[] = [];
  const categoryScores: AiDatasetEvaluation["categoryScores"] = [];

  for (const dataset of datasets) {
    const inputs = dataset.labels.map(labelToInput);
    const predictions = analyzeImagesWithMockEngine(inputs);
    const categoryItems = dataset.labels.map((label, index) => scoreItem(label, predictions[index]));
    items.push(...categoryItems);
    categoryScores.push({
      category: dataset.category,
      imageCount: categoryItems.length,
      totalScore: categoryItems.length ? Math.round(categoryItems.reduce((sum, item) => sum + item.totalScore, 0) / categoryItems.length) : 0,
      roleAccuracy: percent(categoryItems.filter((item) => item.roleMatch).length, categoryItems.length)
    });
  }

  const imageCount = items.length;
  const errors = items.filter((item) => item.errorReasons.length || item.totalScore < 85);

  return {
    datasetCount: datasets.length,
    imageCount,
    roleAccuracy: percent(items.filter((item) => item.roleMatch).length, imageCount),
    heroAccuracy: percent(items.filter((item) => item.heroMatch).length, imageCount),
    captionAccuracy: Math.round(items.reduce((sum, item) => sum + item.captionScore, 0) / Math.max(1, imageCount)),
    sectionAccuracy: percent(items.filter((item) => item.sectionMatch).length, imageCount),
    qualityAccuracy: percent(items.filter((item) => item.qualityMatch).length, imageCount),
    warningAccuracy: percent(items.filter((item) => item.warningMatch).length, imageCount),
    totalScore: Math.round(items.reduce((sum, item) => sum + item.totalScore, 0) / Math.max(1, imageCount)),
    categoryScores,
    errors,
    items
  };
}

export function getAiPromptHistory() {
  const reportsPath = path.join(process.cwd(), "reports", "prompt-history");
  if (!fs.existsSync(reportsPath)) return [];
  return fs
    .readdirSync(reportsPath)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, 10);
}
