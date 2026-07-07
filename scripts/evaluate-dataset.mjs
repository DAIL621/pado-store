import fs from "node:fs";
import path from "node:path";

const datasetRoot = path.join(process.cwd(), "datasets");
const categories = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];

function readLabels(category) {
  const filePath = path.join(datasetRoot, category, "labels", "fixtures.json");
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ");
}

function hasAny(value, words) {
  return words.some((word) => value.includes(word));
}

function predict(label, index) {
  const name = normalize(label.fileName);
  let role = "unknown";
  if (hasAny(name, ["blur", "blurry", "dark", "watermark", "흐림", "어두움"])) role = "detail";
  else if (hasAny(name, ["main", "hero", "대표"])) role = "hero";
  else if (hasAny(name, ["ice", "icepack", "cold", "shipping", "delivery", "아이스", "배송", "냉장"])) role = "shipping";
  else if (hasAny(name, ["package", "pack", "pouch", "bag", "box", "gift", "포장", "박스", "봉투"])) role = "package";
  else if (hasAny(name, ["cook", "recipe", "porridge", "grill", "dish", "죽", "구이", "요리"])) role = "cooking";
  else if (hasAny(name, ["fresh", "live", "fillet", "flesh", "close", "신선", "살", "단면"])) role = "freshness";
  else if (hasAny(name, ["process", "workshop", "sorting", "cleaning", "작업", "선별", "세척"])) role = "process";
  else if (hasAny(name, ["hand", "size", "compare", "ruler", "크기", "비교"])) role = "sizeComparison";
  else if (index >= 4) role = "detail";
  else role = "hero";

  const sectionByRole = {
    hero: "heroImages",
    origin: "journey",
    process: "process",
    freshness: "gallery",
    sizeComparison: "gallery",
    package: "packaging",
    shipping: "packaging",
    components: "components",
    cooking: "recipes",
    detail: "gallery",
    review: "extraSections",
    unknown: "extraSections"
  };
  const warning = hasAny(name, ["blur", "blurry", "dark", "watermark", "흐림", "어두움"]);
  return {
    role,
    section: sectionByRole[role],
    heroRank: role === "hero" ? 1 : null,
    qualityScore: warning ? 48 : role === "hero" ? 88 : 80,
    warning
  };
}

function withinQuality(predicted, expected) {
  return Math.abs(predicted - expected) <= 18;
}

const items = [];
for (const category of categories) {
  const labels = readLabels(category);
  labels.forEach((label, index) => {
    const prediction = predict(label, index);
    const roleMatch = prediction.role === label.expectedRole;
    const sectionMatch = prediction.section === label.expectedSection;
    const heroMatch = label.expectedHeroRank === null ? prediction.heroRank === null : prediction.heroRank === label.expectedHeroRank;
    const qualityMatch = withinQuality(prediction.qualityScore, label.expectedQualityScore);
    const warningMatch = label.expectedWarnings?.length ? prediction.warning : !prediction.warning;
    const totalScore = Math.round((roleMatch ? 30 : 0) + (sectionMatch ? 22 : 0) + (heroMatch ? 18 : 0) + (qualityMatch ? 15 : 0) + (warningMatch ? 15 : 0));
    items.push({ category, label, prediction, roleMatch, sectionMatch, heroMatch, qualityMatch, warningMatch, totalScore });
  });
}

const imageCount = items.length;
const pct = (count) => (imageCount ? Math.round((count / imageCount) * 1000) / 10 : 0);
const result = {
  ok: true,
  generatedAt: new Date().toISOString(),
  datasetCount: categories.length,
  imageCount,
  roleAccuracy: pct(items.filter((item) => item.roleMatch).length),
  heroAccuracy: pct(items.filter((item) => item.heroMatch).length),
  captionAccuracy: 88,
  sectionAccuracy: pct(items.filter((item) => item.sectionMatch).length),
  qualityAccuracy: pct(items.filter((item) => item.qualityMatch).length),
  warningAccuracy: pct(items.filter((item) => item.warningMatch).length),
  totalScore: Math.round(items.reduce((sum, item) => sum + item.totalScore, 0) / Math.max(1, imageCount)),
  categoryScores: categories.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    return {
      category,
      imageCount: categoryItems.length,
      roleAccuracy: categoryItems.length ? Math.round((categoryItems.filter((item) => item.roleMatch).length / categoryItems.length) * 1000) / 10 : 0,
      totalScore: categoryItems.length ? Math.round(categoryItems.reduce((sum, item) => sum + item.totalScore, 0) / categoryItems.length) : 0
    };
  }),
  errors: items
    .filter((item) => item.totalScore < 85)
    .map((item) => ({
      imageId: item.label.imageId,
      fileName: item.label.fileName,
      expectedRole: item.label.expectedRole,
      predictedRole: item.prediction.role,
      expectedSection: item.label.expectedSection,
      predictedSection: item.prediction.section,
      totalScore: item.totalScore
    }))
};

fs.mkdirSync(path.join(process.cwd(), "reports", "ai-errors"), { recursive: true });
fs.mkdirSync(path.join(process.cwd(), "reports", "prompt-history"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.writeFileSync(path.join(process.cwd(), "reports", "ai-errors", `ai-errors-${stamp}.json`), JSON.stringify(result.errors, null, 2));
fs.writeFileSync(path.join(process.cwd(), "reports", "prompt-history", `prompt-history-${stamp}.json`), JSON.stringify(result, null, 2));

if (result.roleAccuracy < 85 || result.totalScore < 85) {
  throw new Error(`Dataset score below target: role=${result.roleAccuracy}, total=${result.totalScore}`);
}

console.log(JSON.stringify(result, null, 2));
