import { appendFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
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

  throw new Error("Playwright is required for detail screenshots.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

function readArg(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function safeSlugFromUrl(url) {
  return decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "detail");
}

async function loginDevAdmin(page, baseUrl) {
  const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
  await page.goto(`${baseUrl}/dev-admin-login?next=/admin/products`, { waitUntil: "networkidle" });
  if (page.url().includes("/dev-admin-login")) {
    await page.locator('input[name="password"]').fill(password);
    await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
    await page.waitForURL("**/admin/products", { timeout: 12000 });
  }
}

async function findFirstProductUrl(page, baseUrl) {
  await page.goto(`${baseUrl}/products`, { waitUntil: "networkidle" });
  const href = await page.locator('a[href^="/products/"]').first().getAttribute("href").catch(() => null);
  if (!href) throw new Error("No product link found on /products. Capture target slug is required.");
  return new URL(href, baseUrl).toString();
}

async function gotoDetailWithPolicy(page, adminPage, targetUrl, baseUrl) {
  const customerResponse = await page.goto(targetUrl, { waitUntil: "networkidle" });
  if (customerResponse?.ok()) {
    await page.waitForSelector("[data-template-id='pado-master-v2']", { timeout: 12000 });
    return { page, status: customerResponse.status(), mode: "customer", reason: "public product" };
  }

  const customerStatus = customerResponse?.status() ?? 0;
  await loginDevAdmin(adminPage, baseUrl);
  const adminResponse = await adminPage.goto(targetUrl, { waitUntil: "networkidle" });
  if (adminResponse?.ok()) {
    await adminPage.waitForSelector("[data-template-id='pado-master-v2']", { timeout: 12000 });
    return {
      page: adminPage,
      status: adminResponse.status(),
      mode: "admin",
      reason: `customer status ${customerStatus}; admin preview allowed for hidden/verification/private product`
    };
  }

  const adminStatus = adminResponse?.status() ?? 0;
  throw new Error(
    `Detail page is not capturable. slug=${safeSlugFromUrl(targetUrl)} customerStatus=${customerStatus} adminStatus=${adminStatus}. Possible causes: slug missing, hidden product without admin permission, DB lookup failure, or route issue.`
  );
}

async function screenshotLocatorOrFallback(page, selector, fallbackSelector, path) {
  const locator = page.locator(selector).first();
  const count = await locator.count();
  if (count > 0 && await locator.isVisible().catch(() => false)) {
    await locator.scrollIntoViewIfNeeded();
    await locator.screenshot({ path });
    return { path, selector, captured: true };
  }

  const fallback = page.locator(fallbackSelector).first();
  await fallback.scrollIntoViewIfNeeded().catch(() => {});
  await fallback.screenshot({ path }).catch(async () => {
    await page.screenshot({ path, fullPage: false });
  });
  return { path, selector, captured: false, fallback: fallbackSelector };
}

async function captureAdminPreview(browser, baseUrl, slug, path) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "ko-KR" });
  const page = await context.newPage();
  await loginDevAdmin(page, baseUrl);
  await page.goto(`${baseUrl}/admin/products`, { waitUntil: "networkidle" });
  const row = page.locator(".product-admin-table tbody tr", { hasText: slug }).first();
  const rowFound = await row.waitFor({ timeout: 12000 }).then(() => true).catch(() => false);
  if (rowFound) {
    await row.locator(".admin-actions button").nth(1).click();
  } else {
    await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  }
  const preview = page.locator(".admin-live-preview").first();
  await preview.waitFor({ timeout: 15000 });
  await preview.screenshot({ path });
  await context.close();
  return { path, captured: rowFound, fallback: rowFound ? undefined : "/admin/new" };
}

function appendCaptureDocs({ slug, targetUrl, status, mode, reason, captures, phase }) {
  const now = new Date().toISOString();
  const lines = [
    "",
    `## ${now} 상세페이지 자동 캡처`,
    "",
    `- 대상 slug: ${slug}`,
    `- 상세페이지 URL: ${targetUrl}`,
    `- 응답 상태: ${status}`,
    `- 캡처 모드: ${mode}`,
    `- 사유: ${reason}`,
    phase ? `- Before/After 단계: ${phase}` : null,
    "- 캡처 파일:",
    ...Object.entries(captures).map(([key, value]) => `  - ${key}: ${value.path}${value.captured === false ? " (fallback)" : ""}`),
    ""
  ].filter(Boolean).join("\n");

  appendFileSync("TEST_REPORT.md", lines, "utf8");
  appendFileSync("WORKLOG.md", lines, "utf8");
}

const baseUrl = process.env.PADO_BASE_URL || "http://127.0.0.1:3000";
const requestedSlug = readArg("slug") || process.env.PADO_DETAIL_SLUG || "";
const requestedUrl = readArg("url") || process.env.PADO_DETAIL_URL || "";
const requestedPhase = (readArg("phase") || process.env.PADO_CAPTURE_PHASE || "").toLowerCase();
const capturePhase = ["before", "after"].includes(requestedPhase) ? requestedPhase : "";
const { chromium, devices } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const outputDir = "screenshots/detail";
mkdirSync(outputDir, { recursive: true });

let targetUrl = requestedUrl || (requestedSlug ? `${baseUrl}/products/${encodeURIComponent(requestedSlug)}` : "");
let capturePage;
let captureContext;
let policy;

try {
  const probeContext = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "ko-KR" });
  const probePage = await probeContext.newPage();
  if (!targetUrl) targetUrl = await findFirstProductUrl(probePage, baseUrl);
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "ko-KR" });
  const adminPage = await adminContext.newPage();
  policy = await gotoDetailWithPolicy(probePage, adminPage, targetUrl, baseUrl);
  capturePage = policy.page;
  captureContext = policy.mode === "admin" ? adminContext : probeContext;
  if (policy.mode === "customer") await adminContext.close();

  const slug = requestedSlug || safeSlugFromUrl(targetUrl);
  const fullTargets = [
    { key: "desktop", path: `${outputDir}/detail-${slug}-desktop-full.png`, context: { viewport: { width: 1440, height: 1100 }, locale: "ko-KR" } },
    { key: "tablet", path: `${outputDir}/detail-${slug}-tablet-full.png`, context: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, locale: "ko-KR" } },
    { key: "mobile", path: `${outputDir}/detail-${slug}-mobile-full.png`, context: { ...devices["iPhone 15 Pro"], locale: "ko-KR" } }
  ];

  const captures = {};
  for (const target of fullTargets) {
    const context = await browser.newContext(target.context);
    const page = await context.newPage();
    if (policy.mode === "admin") await loginDevAdmin(page, baseUrl);
    const response = await page.goto(targetUrl, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`${targetUrl} ${target.key} capture returned ${response?.status() ?? "unknown"}`);
    await page.waitForSelector("[data-template-id='pado-master-v2']", { timeout: 12000 });
    await page.screenshot({ path: target.path, fullPage: true });
    captures[target.key] = { path: target.path, captured: true };
    await context.close();
  }

  const sectionTargets = {
    hero: [".detail-master-hero", ".detail-master"],
    cta: ["#purchase-box, .detail-master-final-cta", ".detail-master"],
    gallery: ["#detail-master-gallery", ".detail-master"],
    shipping: ["#detail-master-shipping", ".detail-master"],
    faq: ["#detail-master-faq", ".detail-master"],
    recommend: [".recommended-section", ".detail-page, main, body"]
  };

  for (const [key, [selector, fallback]] of Object.entries(sectionTargets)) {
    captures[key] = await screenshotLocatorOrFallback(capturePage, selector, fallback, `${outputDir}/detail-${slug}-${key}.png`);
  }

  captures.adminPreview = await captureAdminPreview(browser, baseUrl, slug, `${outputDir}/admin-preview-${slug}.png`).catch(async (error) => ({
    path: `${outputDir}/admin-preview-${slug}.png`,
    captured: false,
    error: error.message
  }));

  if (capturePhase) {
    const beforeAfterDir = "screenshots/before-after";
    mkdirSync(beforeAfterDir, { recursive: true });
    for (const key of ["hero", "gallery", "cta"]) {
      const destination = `${beforeAfterDir}/${capturePhase}-${key}.png`;
      copyFileSync(captures[key].path, destination);
      captures[`${capturePhase}-${key}`] = {
        path: destination,
        captured: captures[key].captured,
        source: captures[key].path
      };
    }
  }

  appendCaptureDocs({
    slug,
    targetUrl,
    status: policy.status,
    mode: policy.mode,
    reason: policy.reason,
    captures,
    phase: capturePhase
  });

  console.log(JSON.stringify({ ok: true, slug, targetUrl, status: policy.status, mode: policy.mode, reason: policy.reason, phase: capturePhase, captures }, null, 2));
} finally {
  await captureContext?.close().catch(() => {});
  await browser.close();
}
