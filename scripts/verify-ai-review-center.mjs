import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`verify:ai-review-center failed: ${message}`);
    process.exit(1);
  }
}

const requiredFiles = [
  "app/admin/ai/review/page.tsx",
  "app/api/admin/ai/dataset-image/route.ts",
  "app/api/admin/ai/review/update-label/route.ts",
  "lib/admin/ai-review-center.ts",
  "lib/admin/ai-real-dataset.ts",
  "scripts/score-review-center.mjs",
  "AI_REVIEW_CENTER.md",
  "RULE_ENGINE_GUIDE.md"
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} is missing`);
}

const layout = read("components/admin/AdminLayout.tsx");
assert(layout.includes("/admin/ai/review"), "AdminLayout must include AI Review Center menu link");

const page = read("app/admin/ai/review/page.tsx");
for (const marker of ["AI Review Center", "신뢰도 기준", "AI 검수 대기열", "운영 규칙", "규칙 제안"]) {
  assert(page.includes(marker), `review page is missing marker: ${marker}`);
}

const engine = read("lib/admin/ai-review-center.ts");
for (const marker of [
  "getConfidenceTier",
  "applyAiReviewRules",
  "buildAiReviewQueue",
  "scoreAiReviewCenter",
  "getRuleSuggestions",
  "writeAiReviewReport"
]) {
  assert(engine.includes(marker), `review engine is missing ${marker}`);
}

const realDataset = read("lib/admin/ai-real-dataset.ts");
for (const marker of ["readRealDatasetItems", "getRealDatasetStatus", "appendReviewHistory", "labelPathFor"]) {
  assert(realDataset.includes(marker), `real dataset helper is missing ${marker}`);
}

const updateApi = read("app/api/admin/ai/review/update-label/route.ts");
assert(updateApi.includes("appendReviewHistory"), "label update API should append review history");
assert(updateApi.includes("reviewed"), "label update API should persist reviewed state");
assert(updateApi.includes("approved"), "label update API should persist approved state");

const imageApi = read("app/api/admin/ai/dataset-image/route.ts");
assert(imageApi.includes("datasetImageDir"), "dataset image API should read dataset image directory");
assert(imageApi.includes("Content-Type"), "dataset image API should return an image response");

const pkg = JSON.parse(read("package.json"));
assert(pkg.scripts["verify:ai-review-center"] === "node scripts/verify-ai-review-center.mjs", "package script verify:ai-review-center is missing");
assert(pkg.scripts["score:review-center"] === "node scripts/score-review-center.mjs", "package script score:review-center is missing");

const datasetFolders = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];
let labelCount = 0;
for (const folder of datasetFolders) {
  const labelPath = path.join(root, "datasets", folder, "labels", "fixtures.json");
  assert(fs.existsSync(labelPath), `${folder} fixture labels are missing`);
  labelCount += JSON.parse(fs.readFileSync(labelPath, "utf8")).length;
}
assert(labelCount >= 12, `expected at least 12 fixture labels, got ${labelCount}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      page: "/admin/ai/review",
      fixtureLabels: labelCount,
      checks: ["menu", "page", "engine", "real-dataset", "label-update-api", "image-api", "scripts", "docs"]
    },
    null,
    2
  )
);
