import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadProjectEnv } from "./lib/load-next-env.mjs";

const require = createRequire(import.meta.url);
const root = process.cwd();
const envLoadResult = loadProjectEnv(root);
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

const fixtureImagePath = join(root, "datasets", "abalone", "images", "018.png");
const allowedVisionRoles = new Set(["hero", "freshness", "detail", "package", "process", "cooking", "components"]);
const imageUrl = existsSync(fixtureImagePath)
  ? `data:image/png;base64,${readFileSync(fixtureImagePath).toString("base64")}`
  : "data:image/svg+xml;utf8," +
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
  if (!apiResult.body.resultProvider) throw new Error("AI analyze API did not return resultProvider.");
  if (typeof apiResult.body.fallbackUsed !== "boolean") throw new Error("AI analyze API did not return fallbackUsed boolean.");
  if (!apiResult.body.envStatus) throw new Error("AI analyze API did not return envStatus.");

  const result = apiResult.body.results[0];
  const requiredKeys = ["imageUrl", "originalName", "suggestedRole", "confidence", "qualityScore", "title", "description", "caption", "recommendedSection", "warningMessage", "reasoningSummary", "qualityFactors"];
  for (const key of requiredKeys) {
    if (!(key in result)) throw new Error(`AI analyze result missing ${key}`);
  }

  const scriptEnvStatus = {
    envLocalLoaded: envLoadResult.loadedEnvFiles.some((file) => file === ".env.local"),
    loadedEnvFiles: envLoadResult.loadedEnvFiles,
    padoAiImageProvider: process.env.PADO_AI_IMAGE_PROVIDER || "",
    hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
    padoAiImageModel: process.env.PADO_AI_IMAGE_MODEL || ""
  };
  const expectsOpenAi = scriptEnvStatus.padoAiImageProvider === "openai" && scriptEnvStatus.hasOpenAiApiKey;

  if (expectsOpenAi && apiResult.body.envStatus.padoAiImageProvider !== "openai") {
    throw new Error(
      `API server did not load PADO_AI_IMAGE_PROVIDER=openai. Script env=${JSON.stringify(scriptEnvStatus)}, API env=${JSON.stringify(apiResult.body.envStatus)}. Restart dev server after changing .env.local.`
    );
  }
  if (expectsOpenAi && !apiResult.body.envStatus.hasOpenAiApiKey) {
    throw new Error(
      `API server does not see OPENAI_API_KEY. Script env has key=${scriptEnvStatus.hasOpenAiApiKey}, API env has key=${apiResult.body.envStatus.hasOpenAiApiKey}. Restart dev server or check .env.local.`
    );
  }
  if (expectsOpenAi && apiResult.body.provider !== "openai") {
    throw new Error(`Expected selected provider=openai from .env.local, got ${apiResult.body.provider}. fallbackUsed=${apiResult.body.fallbackUsed}. fallbackReason=${apiResult.body.fallbackReason || ""}`);
  }
  if (expectsOpenAi && apiResult.body.resultProvider !== "openai") {
    throw new Error(`Expected resultProvider=openai for live Vision verification, got ${apiResult.body.resultProvider}. fallbackUsed=${apiResult.body.fallbackUsed}. fallbackReason=${apiResult.body.fallbackReason || ""}`);
  }
  if (expectsOpenAi && apiResult.body.fallbackUsed) {
    throw new Error(`Expected fallbackUsed=false for live Vision verification. fallbackReason=${apiResult.body.fallbackReason || ""}`);
  }
  if (!expectsOpenAi && apiResult.body.provider !== "mock") {
    throw new Error(`Expected mock provider without openai env, got ${apiResult.body.provider}`);
  }
  if (!allowedVisionRoles.has(result.suggestedRole)) {
    throw new Error(`Unexpected suggestedRole from Vision provider: ${result.suggestedRole}`);
  }
  if (result.qualityScore < 75) throw new Error(`Expected usable quality score, got ${result.qualityScore}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: apiResult.body.provider,
        resultProvider: apiResult.body.resultProvider,
        fallbackUsed: apiResult.body.fallbackUsed,
        fallbackReason: apiResult.body.fallbackReason || "",
        scriptEnvStatus,
        apiEnvStatus: apiResult.body.envStatus,
        checks: [
          ".env.local-loaded",
          "script-env-status-safe",
          "api-env-status-safe",
          "admin-authenticated-api-call",
          "ai-analyze-api-200",
          "provider-returned",
          "fallback-flag-returned",
          "analysis-result-shape",
          "quality-factor-shape",
          "allowed-role-returned",
          expectsOpenAi ? "openai-live-result-provider" : "mock-result-provider",
          expectsOpenAi ? "openai-no-fallback" : "mock-fallback-not-required",
          expectsOpenAi ? "openai-provider-selected" : "mock-provider-default"
        ]
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
