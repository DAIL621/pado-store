import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const bundledNodeModules = "C:/Users/L/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
  const candidates = [
    "playwright-core",
    "playwright",
    existsSync(`${bundledNodeModules}/playwright`) ? `${bundledNodeModules}/playwright` : undefined,
    existsSync(`${bundledNodeModules}/.pnpm/node_modules/playwright-core`) ? `${bundledNodeModules}/.pnpm/node_modules/playwright-core` : undefined
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next runtime location.
    }
  }

  throw new Error("Playwright is required for responsive detail screenshots.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

async function assertOk(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (!response.ok && response.status < 300) {
    throw new Error(`${url} returned ${response.status}`);
  }
}

const baseUrl = process.env.PADO_BASE_URL || "http://127.0.0.1:3000";
let targetUrl = process.env.PADO_DETAIL_URL || "";
const { chromium, devices } = loadPlaywright();

mkdirSync("screenshots", { recursive: true });
await assertOk(`${baseUrl}/api/health`);

const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
if (!targetUrl) {
  const probe = await browser.newPage();
  await probe.goto(`${baseUrl}/products`, { waitUntil: "networkidle" });
  const firstProductHref = await probe
    .locator('a[href^="/products/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  await probe.close();
  targetUrl = firstProductHref ? new URL(firstProductHref, baseUrl).toString() : `${baseUrl}/products/wando-live-abalone`;
}

const targets = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
    isMobile: false
  },
  {
    name: "tablet",
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    isMobile: true
  },
  {
    name: "mobile",
    ...devices["iPhone 15 Pro"]
  }
];

const results = [];

try {
  for (const target of targets) {
    const context = await browser.newContext({
      ...target,
      locale: "ko-KR"
    });
    const page = await context.newPage();
    const response = await page.goto(targetUrl, { waitUntil: "networkidle" });
    if (!response?.ok()) {
      throw new Error(`${targetUrl} returned ${response?.status() ?? "unknown"}`);
    }
    await page.waitForSelector("[data-template-id='pado-master-v2']", { timeout: 10000 });
    await page.screenshot({
      path: `screenshots/detail-v2-${target.name}.png`,
      fullPage: true
    });
    results.push({
      target: target.name,
      url: page.url(),
      title: await page.title(),
      templateVisible: await page.locator("[data-template-id='pado-master-v2']").count()
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ ok: true, targetUrl, results }, null, 2));
