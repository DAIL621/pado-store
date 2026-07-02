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
  throw new Error("Playwright is required for this verification. Run with NODE_PATH pointing to playwright-core.");
}

const expectedPresets = ["완도 활전복", "통영 바다장어", "통영 참소라", "먹갈치", "간고등어", "밀키트", "선물세트"];
const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
});
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  const labels = await page.locator(".admin-preset-grid button b").allTextContents();
  const missing = expectedPresets.filter((label) => !labels.includes(label));
  if (missing.length) throw new Error(`Missing admin presets: ${missing.join(", ")}`);

  for (const label of expectedPresets) {
    await page.locator(".admin-preset-grid button").filter({ hasText: label }).click();
    await page.locator(".admin-toast").waitFor({ timeout: 5000 });
  }

  const category = await page.locator('.admin-product-builder [name="category"]').inputValue();
  const subtitle = await page.locator('.admin-product-builder [name="subtitle"]').inputValue();
  const description = await page.locator('.admin-product-builder [name="description"]').inputValue();
  if (!category || !subtitle || !description) {
    throw new Error("Preset click did not fill required product draft fields.");
  }

  console.log(JSON.stringify({ ok: true, presetCount: labels.length, labels }, null, 2));
} finally {
  await browser.close();
}
