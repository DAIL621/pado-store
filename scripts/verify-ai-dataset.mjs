import fs from "node:fs";
import path from "node:path";

const categories = ["abalone", "eel", "octopus", "oyster", "shrimp", "fish", "meal-kit", "gift-set"];
const requiredLabelFields = [
  "imageId",
  "productCategory",
  "expectedRole",
  "expectedSection",
  "expectedHeroRank",
  "expectedQualityScore",
  "expectedWarnings",
  "expectedCaption",
  "expectedTitle",
  "expectedDescription",
  "notes"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let fixtureCount = 0;
for (const category of categories) {
  const base = path.join("datasets", category);
  assert(fs.existsSync(path.join(base, "images")), `${category} images folder missing`);
  assert(fs.existsSync(path.join(base, "labels")), `${category} labels folder missing`);
  assert(fs.existsSync(path.join(base, "metadata")), `${category} metadata folder missing`);
  const labelPath = path.join(base, "labels", "fixtures.json");
  assert(fs.existsSync(labelPath), `${category} fixture labels missing`);
  const labels = JSON.parse(fs.readFileSync(labelPath, "utf8"));
  fixtureCount += labels.length;
  for (const label of labels) {
    for (const field of requiredLabelFields) assert(field in label, `${category}/${label.imageId} missing ${field}`);
  }
}

const datasetPage = fs.readFileSync("app/admin/ai/dataset/page.tsx", "utf8");
const dashboardPage = fs.readFileSync("app/admin/ai/dashboard/page.tsx", "utf8");
const engine = fs.readFileSync("lib/admin/ai-dataset.ts", "utf8");
const evaluateScript = fs.readFileSync("scripts/evaluate-dataset.mjs", "utf8");

assert(fixtureCount >= 12, `Fixture count should be at least 12, got ${fixtureCount}`);
assert(engine.includes("scoreAiDataset"), "scoreAiDataset engine missing");
assert(engine.includes("Role Accuracy") || engine.includes("roleAccuracy"), "role accuracy calculation missing");
assert(engine.includes("captionAccuracy"), "caption accuracy calculation missing");
assert(engine.includes("errors"), "misclassification collection missing");
assert(evaluateScript.includes("reports") && evaluateScript.includes("ai-errors"), "AI error report writing missing");
assert(evaluateScript.includes("prompt-history"), "Prompt history writing missing");
assert(datasetPage.includes("데이터셋 목록"), "Dataset page label summary missing");
assert(datasetPage.includes("오분류 확인"), "Dataset page evaluation section missing");
assert(dashboardPage.includes("역할 정확도"), "AI dashboard role accuracy missing");
assert(dashboardPage.includes("오분류 Top 10"), "AI dashboard error section missing");

console.log(
  JSON.stringify(
    {
      ok: true,
      fixtureCount,
      checks: [
        "dataset-folder-structure",
        "label-schema",
        "fixture-labels",
        "score-ai-dataset-engine",
        "misclassification-report",
        "prompt-history-report",
        "admin-dataset-page",
        "admin-ai-dashboard"
      ]
    },
    null,
    2
  )
);
