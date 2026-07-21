import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://localhost:3000";
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
  throw new Error("Playwright is required for this verification.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

async function createVerificationProduct(page, slug, stamp) {
  const response = await page.request.post(`${baseUrl}/api/admin/products`, {
    data: {
      name: `Private Detail Preview ${stamp}`,
      slug,
      origin: "Wando",
      category: "Verification",
      subtitle: "Admin-only detail preview product.",
      description: "This product verifies that admins can preview verification and hidden products.",
      basePrice: "444",
      imageUrl: "/images/products/wando-abalone.webp",
      badge: "검증",
      highlights: "admin preview",
      options: [{ name: "Preview option", priceDelta: "0", stock: "1" }],
      isActive: false,
      detailJson: {
        benefits: ["관리자 미리보기", "검증 상품", "자동 상세페이지"],
        components: ["테스트 구성품"]
      }
    }
  });
  const payload = await response.json();
  if (!response.ok()) throw new Error(`product create failed: ${response.status()} ${JSON.stringify(payload)}`);
  return payload.product?.id;
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const adminPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const customerPage = await (await browser.newContext()).newPage();
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const privateSlug = `wando-live-abalone-test-0702-${stamp}`;
let productId = "";

try {
  await adminPage.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await adminPage.locator('input[name="password"]').fill(password);
  await adminPage.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await adminPage.waitForURL("**/admin/products", { timeout: 15000 });

  productId = await createVerificationProduct(adminPage, privateSlug, stamp);

  await adminPage.goto(`${baseUrl}/admin/products?q=${encodeURIComponent(privateSlug)}&kind=test&sort=created_desc`, { waitUntil: "networkidle" });
  const detailLinks = adminPage.locator(`a[href="/products/${privateSlug}"]`);
  if (await detailLinks.count() !== 1) throw new Error("verification product detail link should be unique");
  const detailLink = detailLinks;
  await detailLink.waitFor({ timeout: 10000 });

  const adminActiveDetail = await adminPage.request.get(`${baseUrl}/products/${privateSlug}`);
  if (adminActiveDetail.status() !== 200) {
    throw new Error(`admin active verification detail should be 200, got ${adminActiveDetail.status()}`);
  }

  const customerActiveDetail = await customerPage.request.get(`${baseUrl}/products/${privateSlug}`);
  if (customerActiveDetail.status() !== 404) {
    throw new Error(`customer verification detail should stay hidden as 404, got ${customerActiveDetail.status()}`);
  }

  const activePageResponse = await adminPage.goto(`${baseUrl}/products/${privateSlug}`, { waitUntil: "networkidle" });
  const activeNotice = await adminPage.locator(".admin-product-preview-notice").innerText({ timeout: 10000 }).catch(async (error) => {
    const bodyText = await adminPage.locator("body").innerText().catch(() => "");
    throw new Error(
      `admin preview notice missing after active goto. status=${activePageResponse?.status()} url=${adminPage.url()} body=${bodyText.slice(0, 500)} original=${error.message}`
    );
  });
  if (!activeNotice.includes("관리자 미리보기") || !activeNotice.includes("일반 고객 상품 목록에는 노출되지 않습니다")) {
    throw new Error(`admin preview notice missing for verification product: ${activeNotice}`);
  }

  const remove = await adminPage.request.delete(`${baseUrl}/api/admin/products/${productId}`);
  if (!remove.ok()) throw new Error(`soft delete failed: ${remove.status()}`);

  const adminProductsAfterHide = await adminPage.request.get(`${baseUrl}/api/admin/products?q=${encodeURIComponent(privateSlug)}&kind=all`);
  const adminProductsPayload = await adminProductsAfterHide.json();
  const hiddenRow = adminProductsPayload.products?.find((product) => product.slug === privateSlug);
  if (hiddenRow) throw new Error(`soft-deleted product should be excluded from the default admin list: ${privateSlug}`);

  const adminHiddenDetail = await adminPage.request.get(`${baseUrl}/products/${privateSlug}`);
  if (adminHiddenDetail.status() !== 200) {
    throw new Error(`admin hidden detail should be 200, got ${adminHiddenDetail.status()}`);
  }

  const customerHiddenDetail = await customerPage.request.get(`${baseUrl}/products/${privateSlug}`);
  if (customerHiddenDetail.status() !== 404) {
    throw new Error(`customer hidden detail should stay 404, got ${customerHiddenDetail.status()}`);
  }

  const hiddenPageResponse = await adminPage.goto(`${baseUrl}/products/${privateSlug}`, { waitUntil: "networkidle" });
  const hiddenNotice = await adminPage.locator(".admin-product-preview-notice").innerText({ timeout: 10000 }).catch(async (error) => {
    const bodyText = await adminPage.locator("body").innerText().catch(() => "");
    throw new Error(
      `admin preview notice missing after hidden goto. status=${hiddenPageResponse?.status()} url=${adminPage.url()} body=${bodyText.slice(0, 500)} original=${error.message}`
    );
  });
  if (!hiddenNotice.includes("숨김 상태")) {
    throw new Error(`admin preview notice missing for hidden product: ${hiddenNotice}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: privateSlug,
        adminVerificationDetailStatus: 200,
        customerVerificationDetailStatus: 404,
        adminHiddenDetailStatus: 200,
        customerHiddenDetailStatus: 404,
        adminListDetailLink: true
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
