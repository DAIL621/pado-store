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
  throw new Error("Playwright is required for AI draft flow verification.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

const imageUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#0a7f83"/><text x="40" y="250" fill="white" font-size="42" font-family="Arial">AI HERO</text></svg>`
  );

const aiDraft = {
  source: "ai-image-analysis",
  category: "abalone",
  savedAt: new Date().toISOString(),
  results: [
    {
      imageUrl,
      originalName: "wando-abalone-hero.jpg",
      suggestedRole: "hero",
      confidence: 91,
      title: "AI 대표사진",
      description: "AI 사진분석으로 추천된 대표사진입니다.",
      recommendedSection: "heroImages",
      qualityScore: 96,
      warningMessage: ""
    },
    {
      imageUrl,
      originalName: "fresh-package-box.jpg",
      suggestedRole: "package",
      confidence: 83,
      title: "AI 포장사진",
      description: "아이스팩과 포장 상태를 보여주는 사진입니다.",
      recommendedSection: "packaging",
      qualityScore: 89,
      warningMessage: ""
    },
    {
      imageUrl,
      originalName: "abalone-cooking.jpg",
      suggestedRole: "cooking",
      confidence: 80,
      title: "AI 조리사진",
      description: "조리 예시로 활용할 수 있는 사진입니다.",
      recommendedSection: "recipes",
      qualityScore: 88,
      warningMessage: ""
    }
  ],
  detailJson: {
    heroImages: [{ label: "AI 대표사진", url: imageUrl, description: "AI 사진분석으로 추천된 대표사진입니다." }],
    packaging: ["아이스팩과 포장 상태를 보여주는 사진입니다."],
    recipes: [{ title: "AI 조리사진", description: "조리 예시로 활용할 수 있는 사진입니다.", image: imageUrl }],
    components: ["AI 구성품 사진"],
    extraSections: [
      {
        type: "ai-gallery",
        title: "AI 추천 갤러리",
        items: [{ imageUrl, title: "AI 대표사진", caption: "AI 대표사진 · 신뢰도 91%" }]
      }
    ]
  }
};

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/ai/images`, { waitUntil: "networkidle" });
  const aiPageStatus = page.url().includes("/admin/ai/images");
  if (!aiPageStatus) throw new Error(`AI image page did not open. url=${page.url()}`);

  await page.evaluate((draft) => {
    window.localStorage.removeItem("pado-admin-product-create-draft");
    window.localStorage.setItem("pado-ai-image-analysis-draft", JSON.stringify(draft));
  }, aiDraft);

  await page.goto(`${baseUrl}/admin/new?source=ai-images`, { waitUntil: "networkidle" });
  const initialName = await page.locator('input[name="name"]').inputValue();
  const autoLoadedNotice = await page.getByTestId("admin-ai-draft-notice").count();
  if (initialName !== "") throw new Error(`Admin new form auto-loaded a draft name: ${initialName}`);
  if (autoLoadedNotice !== 0) throw new Error("AI draft was automatically loaded on admin new entry");

  await page.getByTestId("admin-draft-load").click();
  await page.getByTestId("admin-ai-draft-notice").waitFor({ timeout: 10000 });

  const notice = await page.getByTestId("admin-ai-draft-notice").innerText();
  const heroUrl = await page.locator('.admin-detail-card input[placeholder="/images/products/sample.webp"]').first().inputValue();
  const packagingText = await page.locator('input[value="아이스팩과 포장 상태를 보여주는 사진입니다."]').count();
  await page.waitForTimeout(1200);
  const savedProductDraft = await page.evaluate(() => {
    const raw = window.localStorage.getItem("pado-admin-product-create-draft");
    return raw ? JSON.parse(raw) : null;
  });

  if (!notice.includes("AI")) throw new Error(`AI draft notice not visible: ${notice}`);
  if (!heroUrl.startsWith("data:image/svg+xml")) throw new Error("AI hero image was not applied to detail_json heroImages");
  if (!packagingText) throw new Error("AI packaging text was not applied to detail_json packaging");
  if (!savedProductDraft?.detailJson?.extraSections?.some((section) => section.type === "ai-gallery")) {
    throw new Error("AI gallery extra section was not saved into product registration draft");
  }

  await page.getByTestId("admin-ai-draft-clear").click();
  const storedAfterClear = await page.evaluate(() => window.localStorage.getItem("pado-ai-image-analysis-draft"));
  if (storedAfterClear !== null) throw new Error("AI draft clear button did not remove localStorage draft");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("admin-new-reset").click();
  const resetState = await page.evaluate(() => ({
    createDraft: window.localStorage.getItem("pado-admin-product-create-draft"),
    aiDraft: window.localStorage.getItem("pado-ai-image-analysis-draft")
  }));
  if (resetState.createDraft !== null || resetState.aiDraft !== null) throw new Error("New product reset did not delete draft keys");
  if (await page.locator('input[name="name"]').inputValue()) throw new Error("New product reset did not clear the form");
  await page.reload({ waitUntil: "networkidle" });
  if (await page.locator('input[name="name"]').inputValue()) throw new Error("Deleted draft returned after reload");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "ai-image-page-access",
          "ai-draft-local-storage",
          "admin-new-empty-by-default",
          "admin-new-explicit-draft-load",
          "admin-new-ai-draft-notice",
          "admin-new-hero-image-prefill",
          "admin-new-packaging-prefill",
          "admin-new-extra-section-prefill",
          "ai-draft-clear",
          "admin-new-reset-clears-all-drafts",
          "admin-new-remains-empty-after-reload"
        ]
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
