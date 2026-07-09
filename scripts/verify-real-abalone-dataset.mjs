import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const bundledNodeModules = "C:/Users/L/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function loadPlaywright() {
  const candidates = [
    "playwright-core",
    "playwright",
    process.env.PADO_PLAYWRIGHT_MODULE_DIR,
    fs.existsSync(`${bundledNodeModules}/playwright`) ? `${bundledNodeModules}/playwright` : undefined,
    fs.existsSync(`${bundledNodeModules}/.pnpm/node_modules/playwright-core`) ? `${bundledNodeModules}/.pnpm/node_modules/playwright-core` : undefined
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error("Playwright is required for real abalone dataset verification.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function listImages() {
  const dir = path.join(root, "datasets", "abalone", "images");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== ".gitkeep" && /\.(jpg|jpeg|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "ko"));
}

function safeBaseName(fileName) {
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const imageNames = listImages();
assert(imageNames.length > 0, "datasets/abalone/images does not contain real images.");

const metadataDir = path.join(root, "datasets", "abalone", "metadata");
const labelsDir = path.join(root, "datasets", "abalone", "labels");
const metadataFiles = imageNames.map((name) => path.join(metadataDir, `${safeBaseName(name)}.json`));
const labelFiles = imageNames.map((name) => path.join(labelsDir, `${safeBaseName(name)}.json`));
const missingMetadata = imageNames.filter((_, index) => !fs.existsSync(metadataFiles[index]));
const missingLabels = imageNames.filter((_, index) => !fs.existsSync(labelFiles[index]));
assert(!missingMetadata.length, `Missing metadata files: ${missingMetadata.join(", ")}`);
assert(!missingLabels.length, `Missing label files: ${missingLabels.join(", ")}`);

const latestReportPath = path.join(root, "reports", "ai-analysis", "abalone-latest.json");
assert(fs.existsSync(latestReportPath), "reports/ai-analysis/abalone-latest.json is missing.");

const routeSource = fs.readFileSync(path.join(root, "app", "api", "admin", "ai", "review", "update-label", "route.ts"), "utf8");
assert(routeSource.includes("appendReviewHistory"), "label update API should append review history.");

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
fs.mkdirSync(path.join(root, "screenshots"), { recursive: true });

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("/_next/webpack-hmr")) consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/ai/review`, { waitUntil: "networkidle" });
  await page.locator("text=AI Review Queue").waitFor({ timeout: 15000 });
  await page.screenshot({ path: "screenshots/ai-review-abalone-real.png", fullPage: true });

  const firstLabel = readJson(labelFiles[0]);
  const note = `verify-real-abalone-dataset ${new Date().toISOString()}`;
  const apiResult = await page.evaluate(
    async ({ fileName, label, note }) => {
      const response = await fetch("/api/admin/ai/review/update-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "abalone",
          fileName,
          expectedRole: label.expectedRole,
          expectedSection: label.expectedSection,
          expectedHeroRank: label.expectedHeroRank ?? "",
          expectedQualityScore: label.expectedQualityScore,
          expectedTitle: label.expectedTitle,
          expectedCaption: label.expectedCaption,
          expectedDescription: label.expectedDescription,
          reviewed: true,
          approved: false,
          reviewerNotes: note
        })
      });
      return { status: response.status, body: await response.json() };
    },
    { fileName: imageNames[0], label: firstLabel, note }
  );
  assert(apiResult.status === 200 && apiResult.body.ok, `label update API failed: ${JSON.stringify(apiResult)}`);
  const updatedLabel = readJson(labelFiles[0]);
  assert(updatedLabel.reviewed === true, "label update did not set reviewed=true");
  assert(updatedLabel.reviewerNotes === note, "label update did not persist reviewerNotes");

  await page.goto(`${baseUrl}/admin/ai/dataset`, { waitUntil: "networkidle" });
  await page.locator("text=Real Abalone Dataset Status").waitFor({ timeout: 15000 });
  await page.screenshot({ path: "screenshots/ai-dataset-abalone-real.png", fullPage: true });
} finally {
  await browser.close();
}

assert(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join("\n")}`);

const labels = labelFiles.map(readJson);
const report = readJson(latestReportPath);

console.log(
  JSON.stringify(
    {
      ok: true,
      imageCount: imageNames.length,
      metadataCount: metadataFiles.length,
      labelCount: labelFiles.length,
      reviewedCount: labels.filter((label) => label.reviewed).length,
      approvedCount: labels.filter((label) => label.approved).length,
      latestReport: latestReportPath,
      roleCounts: report.roleCounts,
      averageConfidence: report.averageConfidence,
      averageQualityScore: report.averageQualityScore,
      heroTop5: report.heroTop5,
      screenshots: ["screenshots/ai-review-abalone-real.png", "screenshots/ai-dataset-abalone-real.png"]
    },
    null,
    2
  )
);
