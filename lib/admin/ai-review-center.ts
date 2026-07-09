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
  approved: number;
  pending: number;
  held: number;
  autoApprovalCandidates: number;
  reviewRecommended: number;
  needsReview: number;
  operatorRequired: number;
  corrected: number;
  misclassified: number;
  roleMismatch: number;
  sectionMismatch: number;
  lowQuality: number;
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
    name: "손에 든 전복은 크기 비교로 분류",
    productCategory: "abalone",
    filenameIncludes: ["hand", "size", "compare"],
    targetRole: "sizeComparison",
    targetSection: "gallery",
    priority: 100,
    source: "operator",
    usageCount: 5,
    description: "손에 든 전복 사진은 고객이 실제 크기를 이해하는 데 사용합니다."
  },
  {
    id: "rule-gift-set-package",
    name: "선물세트 박스는 고급 포장으로 분류",
    productCategory: "gift",
    filenameIncludes: ["gift", "set", "package", "box"],
    targetRole: "package",
    targetSection: "packaging",
    priority: 95,
    source: "operator",
    usageCount: 5,
    description: "선물세트 박스 사진은 포장 신뢰감과 선물 적합성을 강조해야 합니다."
  },
  {
    id: "rule-icepack-shipping",
    name: "아이스팩과 보냉 박스는 배송/포장으로 분류",
    filenameIncludes: ["ice", "icepack", "cold", "delivery"],
    targetRole: "shipping",
    targetSection: "packaging",
    priority: 90,
    source: "operator",
    usageCount: 7,
    description: "아이스팩, 박스, 보냉 이미지는 배송 신뢰를 설명하는 데 사용합니다."
  },
  {
    id: "rule-cooking-recipe",
    name: "완성 요리는 조리법으로 분류",
    filenameIncludes: ["cook", "recipe", "porridge", "grill", "soup"],
    targetRole: "cooking",
    targetSection: "recipes",
    priority: 80,
    source: "system",
    usageCount: 4,
    description: "완성 요리는 조리 예시와 맛있게 먹는 방법 섹션에 배치합니다."
  }
];

const PROMPT_VERSIONS = [
  {
    version: "review-v1",
    score: 86,
    notes: "초기 신뢰도 구간과 운영자 규칙 우선순위 정책입니다.",
    createdAt: "2026-07-07"
  },
  {
    version: "review-v1.1",
    score: 91,
    notes: "포장, 조리, 크기 비교에 대한 수산물 사진 분류 규칙을 추가했습니다.",
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
  if (confidence >= 95) return { status: "auto-approved", severity: "green", label: "95~100 자동 승인" };
  if (confidence >= 90) return { status: "review-recommended", severity: "yellow", label: "90~95 검토 권장" };
  if (confidence >= 70) return { status: "needs-review", severity: "orange", label: "70~90 확인 필요" };
  return { status: "operator-required", severity: "red", label: "70 미만 운영자 확인 필수" };
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
    expectedWarnings: label.expectedWarnings.map(koreanizeStoredText).filter(Boolean),
    expectedCaption: koreanizeStoredText(label.expectedCaption),
    expectedTitle: koreanizeStoredText(label.expectedTitle),
    expectedDescription: koreanizeStoredText(label.expectedDescription),
    notes: label.reviewerNotes || (label.reviewed ? "검수 완료된 실제 데이터셋 라벨" : "검수 전 실제 데이터셋 초안")
  };
}

function koreanizeStoredText(value: string) {
  const text = value.trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("foodborne") || lower.includes("health risk") || lower.includes("proper cooking") || lower.includes("proper handling")) {
    return "식품 안전과 조리 상태를 운영자가 한 번 더 확인해야 합니다.";
  }
  if (lower.includes("sourcing") || lower.includes("sustainability")) {
    return "산지와 생산 환경을 운영자가 한 번 더 확인해야 합니다.";
  }
  if (lower.includes("kelp") || lower.includes("farming") || lower.includes("cultivation")) {
    return "생산 환경을 보여주는 참고 사진입니다.";
  }
  if (lower.includes("abalone") || lower.includes("gourmet") || lower.includes("tender")) {
    return "전복의 질감과 상태를 확인할 수 있는 사진입니다.";
  }
  if (lower.includes("fallback reason")) return text.replace(/fallback reason:/gi, "대체 분석 사유:");
  if (/[a-z]{4,}/i.test(text)) {
    return "사진 내용에 맞게 한국어 설명을 확인해주세요.";
  }
  return text;
}

function metadataToAnalysis(metadata: AiRealDatasetMetadata): AiImageAnalysisResult {
  return {
    imageUrl: `/api/admin/ai/dataset-image?category=${encodeURIComponent(metadata.category)}&file=${encodeURIComponent(metadata.fileName)}`,
    originalName: metadata.fileName,
    suggestedRole: metadata.suggestedRole,
    confidence: metadata.confidence,
    qualityScore: metadata.qualityScore,
    title: koreanizeStoredText(metadata.title),
    description: koreanizeStoredText(metadata.description),
    caption: metadata.caption ? koreanizeStoredText(metadata.caption) : metadata.caption,
    recommendedSection: metadata.recommendedSection,
    heroRank: metadata.heroRank,
    warningMessage: koreanizeStoredText(metadata.warningMessage),
    reasoningSummary: metadata.reasoningSummary ? koreanizeStoredText(metadata.reasoningSummary) : metadata.reasoningSummary
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function normalizeLabelTexts(label: AiDatasetLabel): AiDatasetLabel {
  return {
    ...label,
    expectedWarnings: label.expectedWarnings.map(koreanizeStoredText).filter(Boolean),
    expectedCaption: koreanizeStoredText(label.expectedCaption),
    expectedTitle: koreanizeStoredText(label.expectedTitle),
    expectedDescription: koreanizeStoredText(label.expectedDescription),
    notes: koreanizeStoredText(label.notes)
  };
}

export function getAiReviewRules(): AiReviewRule[] {
  const stored = readJsonFile<AiReviewRule[]>(RULE_REPORT_PATH, []);
  return [...DEFAULT_RULES, ...stored].sort((a, b) => b.priority - a.priority);
}

export function getAiReviewHistory(): AiReviewHistoryItem[] {
  const stored = readJsonFile<AiReviewHistoryItem[]>(HISTORY_REPORT_PATH, []);
  return [...buildDefaultHistory(), ...stored];
}

export function applyAiReviewRules(label: AiDatasetLabel, analysis: AiImageAnalysisResult, rules = getAiReviewRules()) {
  const fileName = normalize(label.fileName);
  const category = normalize(label.productCategory);
  const matched = rules.find((rule) => {
    const categoryMatch = !rule.productCategory || normalize(rule.productCategory) === category;
    const fileMatch = rule.filenameIncludes.some((keyword) => fileName.includes(normalize(keyword)));
    return categoryMatch && fileMatch;
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
  if (item.appliedRule) return `운영자 규칙 적용: ${item.appliedRule.name}`;
  if (item.status === "auto-approved" && item.roleMatch && item.sectionMatch) return "신뢰도가 높고 라벨과 일치해 자동 승인해도 안전합니다.";
  if (!item.roleMatch) return `역할 불일치: AI는 ${item.analysis.suggestedRole}, 라벨은 ${item.label.expectedRole}로 판단했습니다.`;
  if (!item.sectionMatch) return `섹션 불일치: AI는 ${item.analysis.recommendedSection}, 라벨은 ${item.label.expectedSection}로 판단했습니다.`;
  if (item.analysis.warningMessage) return koreanizeStoredText(item.analysis.warningMessage);
  return "상품등록 초안으로 보내기 전 사진 역할과 캡션을 확인하세요.";
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
      reason: "운영자가 손에 든 전복 사진을 반복해서 크기 비교로 수정했습니다."
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
      createdAt: "2026-07-07T09:08:00.000Z",
      reason: "아이스팩과 박스 이미지는 배송 신뢰 섹션에 더 적합합니다."
    },
    {
      id: "history-gift-box-001",
      imageId: "gift-package-001",
      productCategory: "gift",
      originalRole: "components",
      correctedRole: "package",
      originalSection: "components",
      correctedSection: "packaging",
      actor: "operator",
      createdAt: "2026-07-07T09:20:00.000Z",
      reason: "선물세트 박스 사진은 구성품보다 포장 고급감을 보여주는 데 적합합니다."
    }
  ];
}

function queueItemFrom(label: AiDatasetLabel, analysis: AiImageAnalysisResult, index: number, realLabel?: AiRealDatasetLabel, metadata?: AiRealDatasetMetadata): AiReviewQueueItem {
  const ruled = applyAiReviewRules(label, analysis);
  const tier = getConfidenceTier(analysis.confidence);
  const operatorRole = label.expectedRole === "gallery" ? "detail" : label.expectedRole;
  const operatorSection = label.expectedSection;
  const roleMatch = analysis.suggestedRole === operatorRole;
  const sectionMatch = analysis.recommendedSection === operatorSection;
  const status = realLabel?.reviewed
    ? realLabel.approved
      ? "auto-approved"
      : "corrected"
    : tier.status;

  return {
    id: `${label.imageId}-${index}`,
    label,
    analysis,
    imageSrc: metadata ? `/api/admin/ai/dataset-image?category=${encodeURIComponent(metadata.category)}&file=${encodeURIComponent(metadata.fileName)}` : fixtureImage(label.imageId),
    realLabel,
    metadata,
    finalRole: operatorRole,
    finalSection: operatorSection,
    status,
    severity: tier.severity,
    confidenceTier: tier.label,
    appliedRule: ruled.appliedRule,
    reviewHint: reviewHintFor({ analysis, label, status, roleMatch, sectionMatch, appliedRule: ruled.appliedRule }),
    correctionSuggested: !roleMatch || !sectionMatch || Boolean(ruled.appliedRule)
  };
}

export function buildAiReviewQueue(): AiReviewQueueItem[] {
  const realItems = readRealDatasetItems("abalone").filter((item) => item.metadata && item.label);
  if (realItems.length) {
    return realItems.map((item, index) => {
      const label = normalizeLabelTexts(realLabelToDatasetLabel(item.label!));
      const analysis = metadataToAnalysis(item.metadata!);
      return queueItemFrom(label, analysis, index, item.label!, item.metadata!);
    });
  }

  const labels = readAiDatasets().flatMap((dataset) => dataset.labels).map(normalizeLabelTexts);
  const inputs = labels.map(labelToInput);
  const predictions = analyzeImagesWithMockEngine(inputs);
  return labels.map((label, index) => queueItemFrom(label, predictions[index], index));
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function scoreAiReviewCenter(queue = buildAiReviewQueue()): AiReviewMetrics {
  const total = queue.length;
  const autoApproved = queue.filter((item) => item.status === "auto-approved").length;
  const approved = queue.filter((item) => item.realLabel?.approved).length;
  const pending = queue.filter((item) => !item.realLabel?.reviewed && !item.realLabel?.approved).length;
  const held = queue.filter((item) => item.realLabel?.reviewed && !item.realLabel?.approved).length;
  const autoApprovalCandidates = queue.filter((item) => !item.realLabel?.reviewed && item.analysis.confidence >= 95).length;
  const reviewRecommended = queue.filter((item) => item.status === "review-recommended").length;
  const needsReview = queue.filter((item) => item.status === "needs-review").length;
  const operatorRequired = queue.filter((item) => item.status === "operator-required").length;
  const corrected = queue.filter((item) => item.correctionSuggested || item.status === "corrected").length;
  const misclassified = queue.filter((item) => item.status === "misclassified").length;
  const roleMismatch = queue.filter((item) => item.analysis.suggestedRole !== item.finalRole).length;
  const sectionMismatch = queue.filter((item) => item.analysis.recommendedSection !== item.finalSection).length;
  const lowQuality = queue.filter((item) => item.analysis.qualityScore < 70).length;
  const averageConfidence = total ? Math.round(queue.reduce((sum, item) => sum + item.analysis.confidence, 0) / total) : 0;

  return {
    total,
    autoApproved,
    approved,
    pending,
    held,
    autoApprovalCandidates,
    reviewRecommended,
    needsReview,
    operatorRequired,
    corrected,
    misclassified,
    roleMismatch,
    sectionMismatch,
    lowQuality,
    averageConfidence,
    autoApprovalRate: percent(autoApproved, total),
    operatorCorrectionRate: percent(needsReview + operatorRequired, total),
    ruleUsageRate: percent(queue.filter((item) => item.appliedRule).length, total),
    averageReviewTimeSeconds: Math.max(18, Math.round(90 - averageConfidence * 0.55 + needsReview * 1.5))
  };
}

export function getRuleSuggestions(history = getAiReviewHistory()): AiReviewRule[] {
  const grouped = new Map<string, AiReviewHistoryItem[]>();
  for (const item of history) {
    const key = `${item.productCategory}-${item.correctedRole}-${item.correctedSection}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return [...grouped.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([key, items], index) => {
      const [productCategory, role, section] = key.split("-");
      return {
        id: `suggested-rule-${index}`,
        name: `${productCategory} ${role} 반복 수정 규칙 후보`,
        productCategory,
        filenameIncludes: [role, section],
        targetRole: role as AiImageRole,
        targetSection: section as AiImageRecommendedSection,
        priority: 70,
        source: "operator",
        usageCount: items.length,
        description: `${items.length}건의 유사한 운영자 수정이 발견되었습니다. 같은 패턴이면 운영 규칙으로 등록할 수 있습니다.`
      };
    });
}

export function getAiReviewCenterState(): AiReviewCenterState {
  const queue = buildAiReviewQueue();
  const metrics = scoreAiReviewCenter(queue);
  const history = getAiReviewHistory();
  const rules = getAiReviewRules();
  const categoryMap = new Map<string, AiReviewQueueItem[]>();

  for (const item of queue) {
    const list = categoryMap.get(item.label.productCategory) ?? [];
    list.push(item);
    categoryMap.set(item.label.productCategory, list);
  }

  const roleAccuracyByCategory = [...categoryMap.entries()].map(([category, items]) => ({
    category,
    total: items.length,
    autoApproved: items.filter((item) => item.status === "auto-approved").length,
    corrected: items.filter((item) => item.correctionSuggested).length,
    averageConfidence: items.length ? Math.round(items.reduce((sum, item) => sum + item.analysis.confidence, 0) / items.length) : 0
  }));

  return {
    queue,
    rules,
    history,
    ruleSuggestions: getRuleSuggestions(history),
    metrics,
    roleAccuracyByCategory,
    promptVersions: PROMPT_VERSIONS
  };
}

export function writeAiReviewReport() {
  ensureReportRoot();
  const state = getAiReviewCenterState();
  const filePath = path.join(REVIEW_REPORT_ROOT, `review-center-score-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        metrics: state.metrics,
        queue: state.queue.map((item) => ({
          id: item.id,
          status: item.status,
          confidence: item.analysis.confidence,
          finalRole: item.finalRole,
          finalSection: item.finalSection,
          reviewHint: item.reviewHint
        }))
      },
      null,
      2
    )}\n`
  );
  return filePath;
}
