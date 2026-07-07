import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const bundledNodeModules = "C:/Users/L/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function loadPlaywright() {
  const candidates = [
    "playwright-core",
    "playwright",
    process.env.PADO_PLAYWRIGHT_MODULE_DIR,
    existsSync(`${bundledNodeModules}/playwright`) ? `${bundledNodeModules}/playwright` : undefined,
    existsSync(`${bundledNodeModules}/.pnpm/node_modules/playwright-core`) ? `${bundledNodeModules}/.pnpm/node_modules/playwright-core` : undefined
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error("Playwright is required for AI Vision provider verification.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

const imageUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#0a7f83"/><circle cx="320" cy="210" r="110" fill="#ffffff"/><text x="148" y="390" fill="white" font-size="38" font-family="Arial">PADO AI TEST</text></svg>`
  );

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  const apiResult = await page.evaluate(async ({ imageUrl }) => {
    const response = await fetch("/api/admin/ai/images/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "abalone",
        images: [
          {
            imageUrl,
            originalName: "wando-abalone-hero.jpg",
            index: 0,
            category: "abalone"
          }
        ]
      })
    });
    return { status: response.status, body: await response.json() };
  }, { imageUrl });

  if (apiResult.status !== 200) throw new Error(`AI analyze API returned ${apiResult.status}: ${JSON.stringify(apiResult.body)}`);
  if (!apiResult.body?.ok) throw new Error(`AI analyze API did not return ok: ${JSON.stringify(apiResult.body)}`);
  if (!Array.isArray(apiResult.body.results) || apiResult.body.results.length !== 1) throw new Error("AI analyze API result shape is invalid.");
  if (!apiResult.body.provider) throw new Error("AI analyze API did not return provider.");
  if (typeof apiResult.body.fallbackUsed !== "boolean") throw new Error("AI analyze API did not return fallbackUsed boolean.");

  const result = apiResult.body.results[0];
  const requiredKeys = ["imageUrl", "originalName", "suggestedRole", "confidence", "qualityScore", "title", "description", "recommendedSection", "warningMessage"];
  for (const key of requiredKeys) {
    if (!(key in result)) throw new Error(`AI analyze result missing ${key}`);
  }

  if (process.env.PADO_AI_IMAGE_PROVIDER !== "openai" && apiResult.body.provider !== "mock") {
    throw new Error(`Expected mock provider without openai env, got ${apiResult.body.provider}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: apiResult.body.provider,
        fallbackUsed: apiResult.body.fallbackUsed,
        checks: [
          "admin-authenticated-api-call",
          "ai-analyze-api-200",
          "provider-returned",
          "fallback-flag-returned",
          "analysis-result-shape",
          "mock-provider-default"
        ]
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
