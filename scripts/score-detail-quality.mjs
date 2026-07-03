import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
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

  throw new Error("Playwright is required for detail quality scoring.");
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

async function visible(page, selector) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return false;
  return locator.isVisible().catch(() => false);
}

async function count(page, selector) {
  return page.locator(selector).count().catch(() => 0);
}

function add(results, key, label, points, passed, detail) {
  results.push({ key, label, points, passed, earned: passed ? points : 0, detail });
}

const baseUrl = process.env.PADO_BASE_URL || "http://127.0.0.1:3000";
const slug = readArg("slug") || process.env.PADO_DETAIL_SLUG || "pado-gift-set";
const url = `${baseUrl}/products/${encodeURIComponent(slug)}`;
const { chromium, devices } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });

try {
  const context = await browser.newContext({ ...devices["iPhone 15 Pro"], locale: "ko-KR" });
  const page = await context.newPage();
  const response = await page.goto(url, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Detail page did not return 200. status=${response?.status() ?? "unknown"} url=${url}`);
  }

  const results = [];
  const imageCount = await count(page, ".detail-master-gallery figure");
  const whyCount = await count(page, ".detail-master-reasons article");
  const layoutTypeCount = await page.evaluate(() => new Set([...document.querySelectorAll("[data-layout-type]")].map((item) => item.getAttribute("data-layout-type"))).size);
  const ctaCount = await count(page, 'a[href="#purchase-box"], .purchase-actions .button');
  const sectionCount = await count(page, ".detail-master > section, .detail-master > nav");
  const imageRatioOk = await page.evaluate(() => {
    const sections = [...document.querySelectorAll(".detail-master section")];
    const imageSections = sections.filter((section) => section.querySelector("img"));
    return sections.length > 0 && imageSections.length / sections.length >= 0.35;
  });
  const typographyOk = await page.evaluate(() => {
    const headings = [...document.querySelectorAll(".detail-master h1, .detail-master h2")];
    return headings.length >= 6 && headings.every((heading) => {
      const style = window.getComputedStyle(heading);
      return parseFloat(style.lineHeight) >= parseFloat(style.fontSize) * 1.05;
    });
  });
  const accessibilityOk = await page.evaluate(() => {
    const images = [...document.querySelectorAll(".detail-master img")];
    const buttons = [...document.querySelectorAll(".detail-master button, .detail-master a")];
    return images.every((image) => image.getAttribute("alt")) && buttons.every((button) => button.textContent?.trim() || button.getAttribute("aria-label"));
  });
  const storyFlowOk = await page.evaluate(() => {
    const selectors = [
      ".detail-master-hero",
      ".detail-brand-story",
      ".detail-layout-section",
      ".detail-master-gallery",
      ".detail-review-highlight",
      ".detail-footer-order"
    ];
    const positions = selectors.map((selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? null);
    return positions.every((position) => position !== null) && positions.every((position, index) => index === 0 || Number(position) >= Number(positions[index - 1]) - 2);
  });
  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  const title = await page.title();
  const description = await page.locator('meta[name="description"]').getAttribute("content").catch(() => "");

  add(results, "hero", "Hero value and product image", 8, await visible(page, ".detail-master-hero") && await visible(page, ".detail-master-hero-media"), "Hero and primary image are visible.");
  add(results, "purchase", "Purchase CTA", 9, await visible(page, "#purchase-box") && await visible(page, ".purchase-actions"), "Option and purchase actions are visible.");
  add(results, "brandHero", "Brand hero", 5, await visible(page, ".detail-brand-hero"), "PADO STORY brand hero is visible.");
  add(results, "story", "Brand story", 5, await visible(page, ".detail-brand-story"), "Brand story section is visible.");
  add(results, "why", "Why PADO STORY cards", 6, whyCount >= 6, `${whyCount} trust cards found.`);
  add(results, "gallery", "Photo gallery", 6, imageCount >= 1, `${imageCount} gallery images found.`);
  add(results, "galleryCaption", "Gallery captions and badges", 4, await visible(page, ".detail-master-gallery figcaption") && await visible(page, ".detail-master-gallery em"), "Captions and badges are visible.");
  add(results, "footerCta", "Footer purchase CTA", 5, await visible(page, ".detail-footer-order"), "Footer CTA is visible.");
  add(results, "mobile", "Mobile layout stability", 8, noHorizontalOverflow, `scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)}, innerWidth=${await page.evaluate(() => window.innerWidth)}`);
  add(results, "seo", "SEO basics", 8, Boolean(title && description), `title=${title}; description=${description || "missing"}`);
  add(results, "layoutDiversity", "Section layout diversity", 8, layoutTypeCount >= 5, `${layoutTypeCount} layout types found.`);
  add(results, "ctaDensity", "Conversion CTA count", 5, ctaCount >= 3, `${ctaCount} CTA elements found.`);
  add(results, "review", "Review highlight", 5, await visible(page, ".detail-review-highlight"), "Review highlight section is visible.");
  add(results, "storyFlow", "Story flow order", 5, storyFlowOk, "Hero, story, layout, gallery, review, final CTA order checked.");
  add(results, "sectionBalance", "Section balance", 4, sectionCount >= 12 && sectionCount <= 28, `${sectionCount} top-level detail sections found.`);
  add(results, "imageRatio", "Image-to-story ratio", 4, imageRatioOk, "Image sections cover at least 35% of story sections.");
  add(results, "typography", "Typography rhythm", 3, typographyOk, "Headings use readable line-height and enough hierarchy.");
  add(results, "accessibility", "Accessibility basics", 2, accessibilityOk, "Images and interactive controls have accessible text.");

  const score = results.reduce((sum, item) => sum + item.earned, 0);
  const report = {
    ok: score >= 90,
    slug,
    url,
    score,
    maxScore: results.reduce((sum, item) => sum + item.points, 0),
    checks: results
  };

  mkdirSync("reports", { recursive: true });
  const reportPath = `reports/detail-quality-${slug}.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "",
    `## ${new Date().toISOString()} 상세페이지 품질 점수`,
    "",
    `- 대상 slug: ${slug}`,
    `- 상세페이지 URL: ${url}`,
    `- 품질 점수: ${score}/100`,
    `- 결과 파일: ${reportPath}`,
    ...results.map((item) => `  - ${item.passed ? "PASS" : "FAIL"} ${item.label}: ${item.earned}/${item.points} (${item.detail})`),
    ""
  ].join("\n");
  appendFileSync("TEST_REPORT.md", lines, "utf8");
  appendFileSync("WORKLOG.md", lines, "utf8");

  console.log(JSON.stringify(report, null, 2));
  await context.close();
  if (!report.ok) process.exitCode = 1;
} finally {
  await browser.close();
}
