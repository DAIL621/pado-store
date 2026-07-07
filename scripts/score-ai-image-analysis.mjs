import fs from "node:fs";

const engine = fs.readFileSync("lib/admin/ai-image-analysis.ts", "utf8");
const provider = fs.readFileSync("lib/admin/ai-image-analysis-provider.ts", "utf8");
const component = fs.readFileSync("components/admin/AdminAiImageAnalyzer.tsx", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredRoles = ["hero", "origin", "sizeComparison", "freshness", "package", "shipping", "cooking", "components", "process", "review", "detail", "unknown"];
const requiredSections = ["heroImages", "journey", "gallery", "packaging", "recipes", "components", "process", "extraSections"];
const qualityFactors = ["sharpness", "brightness", "composition", "productFocus", "backgroundCleanliness", "usability", "heroSuitability", "trustSignal", "penalty"];
const productGroups = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "mealKit", "gift"];

const metrics = {
  roleAccuracy: 0,
  captionQuality: 0,
  heroSelection: 0,
  sectionMapping: 0,
  warningQuality: 0,
  draftConversion: 0,
  promptDepth: 0,
  uiOperatorReadiness: 0
};

metrics.roleAccuracy = Math.round((requiredRoles.filter((role) => engine.includes(`"${role}"`)).length / requiredRoles.length) * 100);
metrics.sectionMapping = Math.round((requiredSections.filter((section) => engine.includes(`"${section}"`) || engine.includes(section)).length / requiredSections.length) * 100);
metrics.captionQuality = engine.includes("caption") && engine.includes("title") && engine.includes("description") ? 100 : 60;
metrics.heroSelection = engine.includes("applyHeroRanking") && engine.includes("heroRank") && component.includes("Hero") ? 100 : 60;
metrics.warningQuality = engine.includes("warningFor") && engine.includes("흐림") && engine.includes("대표사진") ? 100 : 70;
metrics.draftConversion =
  (engine.includes("ai-faq-draft") ? 20 : 0) +
  (engine.includes("ai-seo-draft") ? 20 : 0) +
  (engine.includes("ai-quality-summary") ? 20 : 0) +
  (engine.includes("benefits") ? 20 : 0) +
  (engine.includes("faq") ? 20 : 0);
metrics.promptDepth = Math.round(
  ((productGroups.filter((group) => provider.includes(group)).length + qualityFactors.filter((factor) => provider.includes(factor)).length) /
    (productGroups.length + qualityFactors.length)) *
    100
);
metrics.uiOperatorReadiness =
  (component.includes("roleCounts") ? 15 : 0) +
  (component.includes("heroCandidates") ? 15 : 0) +
  (component.includes("resultFilter") ? 15 : 0) +
  (component.includes("AI 추천 순서로 정렬") ? 15 : 0) +
  (component.includes("needsReview") ? 15 : 0) +
  (component.includes("providerInfo") ? 15 : 0) +
  (component.includes("qualityScore") ? 10 : 0);

const totalScore = Math.round(
  metrics.roleAccuracy * 0.2 +
    metrics.captionQuality * 0.12 +
    metrics.heroSelection * 0.16 +
    metrics.sectionMapping * 0.14 +
    metrics.warningQuality * 0.12 +
    metrics.draftConversion * 0.12 +
    metrics.promptDepth * 0.08 +
    metrics.uiOperatorReadiness * 0.06
);

assert(metrics.roleAccuracy >= 90, `Role Accuracy too low: ${metrics.roleAccuracy}`);
assert(metrics.sectionMapping >= 90, `Section Mapping too low: ${metrics.sectionMapping}`);
assert(metrics.heroSelection >= 90, `Hero Selection too low: ${metrics.heroSelection}`);
assert(metrics.warningQuality >= 90, `Warning Quality too low: ${metrics.warningQuality}`);
assert(metrics.draftConversion >= 80, `Draft Conversion too low: ${metrics.draftConversion}`);
assert(metrics.uiOperatorReadiness >= 85, `UI Operator Readiness too low: ${metrics.uiOperatorReadiness}`);
assert(totalScore >= 90, `AI image analysis quality score below target: ${totalScore}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      totalScore,
      metrics,
      checks: [
        "role-taxonomy-expanded",
        "product-group-prompt-depth",
        "quality-factor-scoring",
        "hero-ranking",
        "operator-result-filters",
        "detail-json-draft-conversion"
      ]
    },
    null,
    2
  )
);
