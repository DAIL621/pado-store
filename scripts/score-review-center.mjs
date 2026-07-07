import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const datasetCategories = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];
const reportRoot = path.join(root, "reports", "ai-review-center");

const rules = [
  {
    id: "rule-abalone-hand-size",
    productCategory: "abalone",
    filenameIncludes: ["hand", "size", "compare"],
    targetRole: "sizeComparison",
    targetSection: "gallery",
    source: "operator"
  },
  {
    id: "rule-gift-set-package",
    productCategory: "gift",
    filenameIncludes: ["gift", "set", "package", "box"],
    targetRole: "package",
    targetSection: "packaging",
    source: "operator"
  },
  {
    id: "rule-icepack-shipping",
    filenameIncludes: ["ice", "icepack", "cold", "delivery"],
    targetRole: "shipping",
    targetSection: "packaging",
    source: "operator"
  },
  {
    id: "rule-cooking-recipe",
    filenameIncludes: ["cook", "recipe", "porridge", "grill", "soup"],
    targetRole: "cooking",
    targetSection: "recipes",
    source: "system"
  }
];

function readLabels() {
  return datasetCategories.flatMap((category) => {
    const file = path.join(root, "datasets", category, "labels", "fixtures.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  });
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ");
}

function detectRole(fileName, index) {
  const name = normalize(fileName);
  if (name.includes("blur") || name.includes("dark")) return { role: "detail", section: "gallery", confidence: 58, quality: 45 };
  if (/(main|hero|octopus|shrimp|oyster)/.test(name) || index === 0) return { role: "hero", section: "heroImages", confidence: 96, quality: 90 };
  if (/(ice|icepack|cold|delivery|box)/.test(name)) return { role: "shipping", section: "packaging", confidence: 96, quality: 82 };
  if (/(package|pack|pouch|bag|gift|set)/.test(name)) return { role: "package", section: "packaging", confidence: 94, quality: 84 };
  if (/(cook|recipe|porridge|grill|soup|dish)/.test(name)) return { role: "cooking", section: "recipes", confidence: 96, quality: 82 };
  if (/(hand|size|compare|ruler)/.test(name)) return { role: "sizeComparison", section: "gallery", confidence: 92, quality: 78 };
  if (/(process|factory|workshop|trim|clean|sorting|fillet|flesh)/.test(name)) return { role: "freshness", section: "gallery", confidence: 88, quality: 80 };
  return { role: "unknown", section: "extraSections", confidence: 54, quality: 55 };
}

function applyRules(label, prediction) {
  const filename = normalize(label.fileName);
  const matched = rules.find((rule) => {
    const categoryMatch = !rule.productCategory || rule.productCategory === label.productCategory;
    const keywordMatch = rule.filenameIncludes.some((keyword) => filename.includes(keyword));
    return categoryMatch && keywordMatch;
  });
  if (!matched) return { ...prediction, appliedRule: null };
  return {
    ...prediction,
    role: matched.targetRole,
    section: matched.targetSection,
    appliedRule: matched.id
  };
}

function confidenceStatus(confidence) {
  if (confidence >= 95) return "auto-approved";
  if (confidence >= 90) return "review-recommended";
  if (confidence >= 70) return "needs-review";
  return "operator-required";
}

function percent(value, total) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

const labels = readLabels();
const queue = labels.map((label, index) => {
  const predicted = detectRole(label.fileName, index);
  const finalResult = applyRules(label, predicted);
  const roleMatch = finalResult.role === label.expectedRole || (label.expectedRole === "gallery" && finalResult.section === "gallery");
  const sectionMatch = finalResult.section === label.expectedSection;
  const status = !roleMatch || !sectionMatch ? "misclassified" : confidenceStatus(finalResult.confidence);
  return {
    imageId: label.imageId,
    fileName: label.fileName,
    productCategory: label.productCategory,
    expectedRole: label.expectedRole,
    expectedSection: label.expectedSection,
    role: finalResult.role,
    section: finalResult.section,
    confidence: finalResult.confidence,
    quality: finalResult.quality,
    status,
    appliedRule: finalResult.appliedRule,
    roleMatch,
    sectionMatch
  };
});

const total = queue.length;
const metrics = {
  total,
  autoApproved: queue.filter((item) => item.status === "auto-approved").length,
  reviewRecommended: queue.filter((item) => item.status === "review-recommended").length,
  needsReview: queue.filter((item) => item.status === "needs-review").length,
  operatorRequired: queue.filter((item) => item.status === "operator-required").length,
  misclassified: queue.filter((item) => item.status === "misclassified").length,
  averageConfidence: total ? Math.round(queue.reduce((sum, item) => sum + item.confidence, 0) / total) : 0,
  autoApprovalRate: percent(queue.filter((item) => item.status === "auto-approved").length, total),
  operatorCorrectionRate: percent(queue.filter((item) => !item.roleMatch || !item.sectionMatch).length, total),
  ruleUsageRate: percent(queue.filter((item) => item.appliedRule).length, total),
  confidenceAccuracy: percent(queue.filter((item) => item.roleMatch && item.sectionMatch).length, total)
};

fs.mkdirSync(reportRoot, { recursive: true });
const reportPath = path.join(reportRoot, `review-center-score-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), metrics, queue }, null, 2));

console.log(JSON.stringify({ ok: true, metrics, reportPath }, null, 2));

if (metrics.confidenceAccuracy < 85 || metrics.autoApprovalRate < 40) {
  console.error("score:review-center failed: review center score is below launch threshold.");
  process.exit(1);
}
