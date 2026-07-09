import fs from "node:fs";
import path from "node:path";
import {
  analyzeImagesWithMockEngine,
  type AiImageAnalysisInput,
  type AiImageAnalysisResult,
  type AiImageRecommendedSection,
  type AiImageRole
} from "@/lib/admin/ai-image-analysis";
import { readAiDatasets, type AiDatasetLabel } from "@/lib/admin/ai-dataset";
import { readRealDatasetItems, type AiRealDatasetLabel, type AiRealDatasetMetadata } from "@/lib/admin/ai-real-dataset";

export type AiReviewStatus =
  | "auto-approved"
  | "review-recommended"
  | "needs-review"
  | "operator-required"
  | "corrected"
  | "held"
  | "misclassified";

export type AiReviewSeverity = "green" | "yellow" | "orange" | "red";

export type AiReviewRule = {
  id: string;
  name: string;
  productCategory?: string;
  filenameIncludes: string[];
  targetRole: AiImageRole;
  targetSection: AiImageRecommendedSection;
  priority: number;
  source: "operator" | "system";
  usageCount: number;
  description: string;
};

export type AiReviewHistoryItem = {
  id: string;
  imageId: string;
  productCategory: string;
  originalRole: AiImageRole;
  correctedRole: AiImageRole;
  originalSection: AiImageRecommendedSection;
  correctedSection: AiImageRecommendedSection;
  actor: "system" | "operator";
  createdAt: string;
  reason: string;
};

export type AiReviewQueueItem = {
  id: string;
  label: AiDatasetLabel;
  analysis: AiImageAnalysisResult;
  imageSrc?: string;
  realLabel?: AiRealDatasetLabel;
  metadata?: AiRealDatasetMetadata;
  finalRole: AiImageRole;
  finalSection: AiImageRecommendedSection;
  status: AiReviewStatus;
  severity: AiReviewSeverity;
  confidenceTier: string;
  appliedRule?: AiReviewRule;
  reviewHint: string;
  correctionSuggested: boolean;
};

export type AiReviewMetrics = {
  total: number;
  autoApproved: number;
  reviewRecommended: number;
  needsReview: number;
  operatorRequired: number;
  corrected: number;
  misclassified: number;
  averageConfidence: number;
  autoApprovalRate: number;
  operatorCorrectionRate: number;
  ruleUsageRate: number;
  averageReviewTimeSeconds: number;
};

export type AiReviewCenterState = {
  queue: AiReviewQueueItem[];
  rules: AiReviewRule[];
  history: AiReviewHistoryItem[];
  ruleSuggestions: AiReviewRule[];
  metrics: AiReviewMetrics;
  roleAccuracyByCategory: Array<{ category: string; total: number; autoApproved: number; corrected: number; averageConfidence: number }>;
  promptVersions: Array<{ version: string; score: number; notes: string; createdAt: string }>;
};

const REVIEW_REPORT_ROOT = path.join(process.cwd(), "reports", "ai-review-center");
const RULE_REPORT_PATH = path.join(REVIEW_REPORT_ROOT, "rules.json");
const HISTORY_REPORT_PATH = path.join(REVIEW_REPORT_ROOT, "history.json");

const DEFAULT_RULES: AiReviewRule[] = [
  {
    id: "rule-abalone-hand-size",
    name: "Abalone held in hand means size comparison",
    productCategory: "abalone",
    filenameIncludes: ["hand", "size", "compare"],
    targetRole: "sizeComparison",
    targetSection: "gallery",
    priority: 100,
    source: "operator",
    usageCount: 5,
    description: "When abalone is held by hand, customers use it to understand real size."
  },
  {
    id: "rule-gift-set-package",
    name: "Gift set box means premium package",
    productCategory: "gift",
    filenameIncludes: ["gift", "set", "package", "box"],
    targetRole: "package",
    targetSection: "packaging",
    priority: 95,
    source: "operator",
    usageCount: 5,
    description: "Gift set box photos should emphasize package quality and gift suitability."
  },
  {
    id: "rule-icepack-shipping",
    name: "Ice pack and cold box means shipping/package",
    filenameIncludes: ["ice", "icepack", "cold", "delivery"],
    targetRole: "shipping",
    targetSection: "packaging",
    priority: 90,
    source: "operator",
    usageCount: 7,
    description: "Ice pack, box, and cold-chain images should support delivery trust."
  },
  {
    id: "rule-cooking-recipe",
    name: "Cooked dish means recipe",
    filenameIncludes: ["cook", "recipe", "porridge", "grill", "soup"],
    targetRole: "cooking",
    targetSection: "recipes",
    priority: 80,
    source: "system",
    usageCount: 4,
    description: "Finished dishes and cooking examples belong in the recipe section."
  }
];

const PROMPT_VERSIONS = [
  {
    version: "review-v1",
    score: 86,
    notes: "Initial confidence tier and operator rule priority policy.",
    createdAt: "2026-07-07"
  },
  {
    version: "review-v1.1",
    score: 91,
    notes: "Added seafood role-specific rules for package, cooking, and size comparison.",
    createdAt: "2026-07-07"
  }
];

function ensureReportRoot() {
  fs.mkdirSync(REVIEW_REPORT_ROOT, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getConfidenceTier(confidence: number): { status: AiReviewStatus; severity: AiReviewSeverity; label: string } {
  if (confidence >= 95) return { status: "auto-approved", severity: "green", label: "95-100 auto approved" };
  if (confidence >= 90) return { status: "review-recommended", severity: "yellow", label: "90-95 review recommended" };
  if (confidence >= 70) return { status: "needs-review", severity: "orange", label: "70-90 needs review" };
  return { status: "operator-required", severity: "red", label: "under 70 operator required" };
}

function fixtureImage(imageId: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#0b6f73"/><text x="48" y="245" fill="white" font-size="32" font-family="Arial">${imageId}</text></svg>`
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

function realLabelToDatasetLabel(label: AiRealDatasetLabel): AiDatasetLabel {
  return {
    imageId: label.imageId,
    fileName: label.fileName,
    productCategory: label.productCategory,
    expectedRole: label.expectedRole,
    expectedSection: label.expectedSection,
    expectedHeroRank: label.expectedHeroRank,
    expectedQualityScore: label.expectedQualityScore,
    expectedWarnings: label.expectedWarnings,
    expectedCaption: label.expectedCaption,
    expectedTitle: label.expectedTitle,
    expectedDescription: label.expectedDescription,
    notes: label.reviewerNotes || (label.reviewed ? "reviewed real dataset label" : "unreviewed real dataset draft")
  };
}

function metadataToAnalysis(metadata: AiRealDatasetMetadata): AiImageAnalysisResult {
  return {
    imageUrl: `/api/admin/ai/dataset-image?category=${encodeURIComponent(metadata.category)}&file=${encodeURIComponent(metadata.fileName)}`,
    originalName: metadata.fileName,
    suggestedRole: metadata.suggestedRole,
    confidence: metadata.confidence,
    qualityScore: metadata.qualityScore,
    title: metadata.title,
    description: metadata.description,
    caption: metadata.caption,
    recommendedSection: metadata.recommendedSection,
    heroRank: metadata.heroRank,
    warningMessage: metadata.warningMessage,
    reasoningSummary: metadata.reasoningSummary
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

export function getAiReviewRules(): AiReviewRule[] {
  const stored = readJsonFile<AiReviewRule[]>(RULE_REPORT_PATH, []);
  return [...DEFAULT_RULES, ...stored].sort((a, b) => b.priority - a.priority);
}

export function getAiReviewHistory(): AiReviewHistoryItem[] {
  return readJsonFile<AiReviewHistoryItem[]>(HISTORY_REPORT_PATH, buildDefaultHistory());
}

export function applyAiReviewRules(label: AiDatasetLabel, analysis: AiImageAnalysisResult, rules = getAiReviewRules()) {
  const filename = normalize(label.fileName);
  const matched = rules.find((rule) => {
    const categoryMatch = !rule.productCategory || rule.productCategory === label.productCategory;
    const keywordMatch = rule.filenameIncludes.some((keyword) => filename.includes(normalize(keyword)));
    return categoryMatch && keywordMatch;
  });

  if (!matched) return { finalRole: analysis.suggestedRole, finalSection: analysis.recommendedSection, appliedRule: undefined };

  return {
    finalRole: matched.targetRole,
    finalSection: matched.targetSection,
    appliedRule: matched
  };
}

function reviewHintFor(item: {
  analysis: AiImageAnalysisResult;
  label: AiDatasetLabel;
  status: AiReviewStatus;
  roleMatch: boolean;
  sectionMatch: boolean;
  appliedRule?: AiReviewRule;
}) {
  if (item.appliedRule) return `Operator rule applied: ${item.appliedRule.name}`;
  if (item.status === "auto-approved" && item.roleMatch && item.sectionMatch) return "High confidence and label match. Safe to approve automatically.";
  if (!item.roleMatch) return `Role mismatch: AI suggested ${item.analysis.suggestedRole}, label expects ${item.label.expectedRole}.`;
  if (!item.sectionMatch) return `Section mismatch: AI suggested ${item.analysis.recommendedSection}, label expects ${item.label.expectedSection}.`;
  if (item.analysis.warningMessage) return item.analysis.warningMessage;
  return "Review image role and caption before sending to product draft.";
}

function buildDefaultHistory(): AiReviewHistoryItem[] {
  return [
    {
      id: "history-abalone-hand-001",
      imageId: "abalone-size-001",
      productCategory: "abalone",
      originalRole: "freshness",
      correctedRole: "sizeComparison",
      originalSection: "gallery",
      correctedSection: "gallery",
      actor: "operator",
      createdAt: "2026-07-07T09:00:00.000Z",
      reason: "Operator repeatedly corrected hand-held abalone photos to size comparison."
    },
    {
      id: "history-icepack-001",
      imageId: "fish-shipping-001",
      productCategory: "fish",
      originalRole: "detail",
      correctedRole: "shipping",
      originalSection: "gallery",
      correctedSection: "packaging",
      actor: "operator",
      createdAt: "2026-07-07T09:20:00.000Z",
      reason: "Ice pack images support delivery trust, not detail gallery."
    }
  ];
}

export function buildAiReviewQueue(): AiReviewQueueItem[] {
  const realItems = readRealDatasetItems("abalone").filter((item) => item.metadata && item.label);
  if (realItems.length) {
    const rules = getAiReviewRules();
    return realItems.map((item) => {
      const label = realLabelToDatasetLabel(item.label!);
      const analysis = metadataToAnalysis(item.metadata!);
      const tier = getConfidenceTier(analysis.confidence);
      const ruled = applyAiReviewRules(label, analysis, rules);
      const roleMatch = ruled.finalRole === label.expectedRole || (label.expectedRole === "gallery" && ruled.finalSection === "gallery");
      const sectionMatch = ruled.finalSection === label.expectedSection;
      const correctionSuggested = !roleMatch || !sectionMatch;
      const status: AiReviewStatus = item.label!.approved
        ? "auto-approved"
        : item.label!.reviewed
          ? "corrected"
          : correctionSuggested
            ? analysis.confidence >= 95
              ? "misclassified"
              : tier.status
            : tier.status;

      return {
        id: `review-real-${label.imageId}`,
        label,
        analysis,
        imageSrc: analysis.imageUrl,
        realLabel: item.label!,
        metadata: item.metadata!,
        finalRole: ruled.finalRole,
        finalSection: ruled.finalSection,
        status,
        severity: status === "misclassified" ? "red" : tier.severity,
        confidenceTier: tier.label,
        appliedRule: ruled.appliedRule,
        reviewHint: reviewHintFor({ analysis, label, status, roleMatch, sectionMatch, appliedRule: ruled.appliedRule }),
        correctionSuggested
      };
    });
  }

  const labels = readAiDatasets().flatMap((dataset) => dataset.labels);
  const inputs = labels.map(labelToInput);
  const predictions = analyzeImagesWithMockEngine(inputs);
  const rules = getAiReviewRules();

  return labels.map((label, index) => {
    const analysis = predictions[index];
    const tier = getConfidenceTier(analysis.confidence);
    const ruled = applyAiReviewRules(label, analysis, rules);
    const roleMatch = ruled.finalRole === label.expectedRole || (label.expectedRole === "gallery" && ruled.finalSection === "gallery");
    const sectionMatch = ruled.finalSection === label.expectedSection;
    const correctionSuggested = !roleMatch || !sectionMatch;
    const status: AiReviewStatus = correctionSuggested
      ? analysis.confidence >= 95
        ? "misclassified"
        : tier.status
      : tier.status;

    return {
      id: `review-${label.imageId}`,
      label,
      analysis,
      finalRole: ruled.finalRole,
      finalSection: ruled.finalSection,
      status,
      severity: status === "misclassified" ? "red" : tier.severity,
      confidenceTier: tier.label,
      appliedRule: ruled.appliedRule,
      reviewHint: reviewHintFor({ analysis, label, status, roleMatch, sectionMatch, appliedRule: ruled.appliedRule }),
      correctionSuggested
    };
  });
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

export function scoreAiReviewCenter(queue = buildAiReviewQueue()): AiReviewMetrics {
  const total = queue.length;
  const autoApproved = queue.filter((item) => item.status === "auto-approved").length;
  const reviewRecommended = queue.filter((item) => item.status === "review-recommended").length;
  const needsReview = queue.filter((item) => item.status === "needs-review").length;
  const operatorRequired = queue.filter((item) => item.status === "operator-required").length;
  const corrected = queue.filter((item) => item.appliedRule).length;
  const misclassified = queue.filter((item) => item.status === "misclassified").length;
  const averageConfidence = total ? Math.round(queue.reduce((sum, item) => sum + item.analysis.confidence, 0) / total) : 0;

  return {
    total,
    autoApproved,
    reviewRecommended,
    needsReview,
    operatorRequired,
    corrected,
    misclassified,
    averageConfidence,
    autoApprovalRate: percent(autoApproved, total),
    operatorCorrectionRate: percent(queue.filter((item) => item.correctionSuggested).length, total),
    ruleUsageRate: percent(corrected, total),
    averageReviewTimeSeconds: Math.max(18, Math.round(90 - averageConfidence * 0.55 + needsReview * 1.5))
  };
}

export function getRuleSuggestions(history = getAiReviewHistory()): AiReviewRule[] {
  const grouped = new Map<string, AiReviewHistoryItem[]>();
  for (const item of history) {
    const key = `${item.productCategory}:${item.correctedRole}:${item.correctedSection}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return [...grouped.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([key, items], index) => {
      const [category, role, section] = key.split(":");
      return {
        id: `suggested-rule-${index + 1}`,
        name: `Suggested rule for ${category} ${role}`,
        productCategory: category,
        filenameIncludes: [role === "sizeComparison" ? "hand" : role === "shipping" ? "ice" : role],
        targetRole: role as AiImageRole,
        targetSection: section as AiImageRecommendedSection,
        priority: 70,
        source: "system",
        usageCount: items.length,
        description: `${items.length} similar operator corrections were found. Review and promote this rule if it matches operations.`
      };
    });
}

export function getAiReviewCenterState(): AiReviewCenterState {
  const queue = buildAiReviewQueue();
  const metrics = scoreAiReviewCenter(queue);
  const rules = getAiReviewRules();
  const history = getAiReviewHistory();
  const ruleSuggestions = getRuleSuggestions(history);
  const categories = [...new Set(queue.map((item) => item.label.productCategory))];

  return {
    queue,
    rules,
    history,
    ruleSuggestions,
    metrics,
    roleAccuracyByCategory: categories.map((category) => {
      const items = queue.filter((item) => item.label.productCategory === category);
      return {
        category,
        total: items.length,
        autoApproved: items.filter((item) => item.status === "auto-approved").length,
        corrected: items.filter((item) => item.appliedRule).length,
        averageConfidence: items.length ? Math.round(items.reduce((sum, item) => sum + item.analysis.confidence, 0) / items.length) : 0
      };
    }),
    promptVersions: PROMPT_VERSIONS
  };
}

export function writeAiReviewReport() {
  ensureReportRoot();
  const state = getAiReviewCenterState();
  const payload = {
    generatedAt: new Date().toISOString(),
    metrics: state.metrics,
    rules: state.rules,
    ruleSuggestions: state.ruleSuggestions,
    queue: state.queue.map((item) => ({
      id: item.id,
      imageId: item.label.imageId,
      fileName: item.label.fileName,
      productCategory: item.label.productCategory,
      status: item.status,
      confidence: item.analysis.confidence,
      finalRole: item.finalRole,
      finalSection: item.finalSection,
      appliedRule: item.appliedRule?.id,
      reviewHint: item.reviewHint
    }))
  };
  const reportPath = path.join(REVIEW_REPORT_ROOT, `review-center-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
  return { reportPath, state };
}
