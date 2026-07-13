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

async function fillField(page, name, value) {
  const field = page.locator(`.admin-product-builder [name="${name}"]`).first();
  await field.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.press("Backspace");
  await field.pressSequentially(value, { delay: 1 });
}

async function createProduct(page, slug, stamp) {
  const response = await page.request.post(`${baseUrl}/api/admin/products`, {
    data: {
      name: `Duplicate Base Product ${stamp}`,
      slug,
      origin: "Wando",
      category: "DuplicateTest",
      subtitle: "Duplicate base product for test slug recovery.",
      description: "This product exists only to verify duplicate slug recovery UI.",
      basePrice: "444",
      imageUrl: "/images/products/wando-abalone.webp",
      badge: "TEST",
      highlights: "duplicate test",
      options: [{ name: "Base option", priceDelta: "0", stock: "1" }],
      isActive: false,
      detailJson: {}
    }
  });
  const payload = await response.json();
  if (!response.ok()) throw new Error(`base product create failed: ${response.status()} ${JSON.stringify(payload)}`);
  return payload.product?.id;
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const duplicateSlug = `duplicate-slug-base-${stamp}`;
let baseProductId = "";
let testProductId = "";

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  baseProductId = await createProduct(page, duplicateSlug, stamp);

  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.removeItem("pado-admin-product-create-draft"));
  await page.reload({ waitUntil: "networkidle" });

  await fillField(page, "name", `Duplicate Recovery Product ${stamp}`);
  await fillField(page, "slug", duplicateSlug);
  await fillField(page, "origin", "Tongyeong");
  await fillField(page, "category", "DuplicateTest");
  await fillField(page, "subtitle", "Duplicate slug recovery product.");
  await fillField(page, "description", "Checks the test slug auto generation button after duplicate slug error.");
  await fillField(page, "basePrice", "444");
  await fillField(page, "options.0.name", "Test option");
  await fillField(page, "options.0.priceDelta", "0");
  await fillField(page, "options.0.stock", "5");
  await page.locator('input[name="publishMode"][value="private"]').check({ force: true });

  const submitButton = page.getByTestId("admin-product-submit");
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click();
  await page.getByTestId("admin-apply-test-slug").waitFor({ timeout: 12000 });
  await page.getByTestId("admin-apply-test-slug").click();

  const changedSlug = await page.locator('.admin-product-builder [name="slug"]').inputValue();
  if (!changedSlug.startsWith(`${duplicateSlug}-test-`)) {
    throw new Error(`test slug was not generated correctly: ${changedSlug}`);
  }

  await submitButton.click();
  await page.waitForFunction(() => document.body.innerText.includes("상품 등록완료"), null, { timeout: 12000 });
  await page.waitForURL("**/admin/products", { timeout: 20000 });

  const products = await page.request.get(`${baseUrl}/api/admin/products`);
  const payload = await products.json();
  const created = payload.products?.find((product) => product.slug === changedSlug);
  testProductId = created?.id ?? "";
  if (!testProductId) throw new Error("test slug product was not found in product list.");
  if (payload.products?.[0]?.slug !== changedSlug) throw new Error(`test slug product is not at top: ${payload.products?.[0]?.slug}`);

  const detail = await page.request.get(`${baseUrl}/products/${changedSlug}`);
  if (detail.status() !== 200) throw new Error(`test slug detail page failed: ${detail.status()}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        duplicateSlug,
        generatedTestSlug: changedSlug,
        productListedAtTop: true,
        detailStatus: 200
      },
      null,
      2
    )
  );
} finally {
  if (testProductId) await page.request.delete(`${baseUrl}/api/admin/products/${testProductId}`).catch(() => {});
  if (baseProductId) await page.request.delete(`${baseUrl}/api/admin/products/${baseProductId}`).catch(() => {});
  await browser.close();
}
