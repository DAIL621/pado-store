import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";

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

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

async function fillField(page, name, value) {
  const field = page.locator(`.admin-product-builder [name="${name}"]`).first();
  await field.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.press("Backspace");
  await field.pressSequentially(value, { delay: 1 });
  const currentValue = await field.inputValue();
  if (currentValue !== value) throw new Error(`Failed to fill ${name}. Expected ${value}, got ${currentValue}`);
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
mkdirSync("screenshots", { recursive: true });

const consoleErrors = [];
page.on("console", (message) => {
  const text = message.text();
  const isDevHmrNoise = text.includes("/_next/webpack-hmr") || text.includes("WebSocket connection");
  if (message.type() === "error" && !isDevHmrNoise) consoleErrors.push(text);
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const slug = `pado-e2e-product-${stamp}`;

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.removeItem("pado-admin-product-create-draft"));
  await page.reload({ waitUntil: "networkidle" });

  const submitButton = page.getByTestId("admin-product-submit");
  await submitButton.click();
  await page.locator(".admin-message").waitFor({ timeout: 7000 });
  const blockedMessage = await page.locator(".admin-message").first().textContent();

  await fillField(page, "name", `Pado E2E Product ${stamp}`);
  await fillField(page, "slug", slug);
  await fillField(page, "origin", "Tongyeong");
  await fillField(page, "category", "E2E");
  await fillField(page, "subtitle", "Public detail route create flow product.");
  await fillField(page, "description", "This product verifies admin create, product list visibility, and public detail page rendering.");
  await fillField(page, "basePrice", "12300");
  await fillField(page, "options.0.name", "E2E option 1kg");
  await fillField(page, "options.0.priceDelta", "0");
  await fillField(page, "options.0.stock", "3");
  await page.screenshot({ path: "screenshots/admin-create-before-click-real-edge.png", fullPage: true });

  let delayedCreateOnce = false;
  await page.route("**/api/admin/products", async (route) => {
    if (!delayedCreateOnce && route.request().method() === "POST") {
      delayedCreateOnce = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await route.continue();
  });

  const previewPagePromise = page.context().waitForEvent("page", { timeout: 15000 }).catch(() => null);
  await submitButton.click();
  await page.locator('[data-testid="admin-product-submit"][data-save-state="saving"]').waitFor({ timeout: 7000 });
  const savingButtonText = await submitButton.textContent();
  await page.screenshot({ path: "screenshots/admin-create-saving-real-edge.png", fullPage: false });

  await page.locator('[data-testid="admin-product-submit"][data-save-state="completed"]').waitFor({ timeout: 12000 });
  const completedButtonText = await submitButton.textContent();
  await page.screenshot({ path: "screenshots/admin-create-completed-real-edge.png", fullPage: false });

  const previewPage = await previewPagePromise;
  if (previewPage) {
    await previewPage.close().catch(() => {});
  }

  await page.waitForURL("**/admin/products", { timeout: 20000 }).catch(async (error) => {
    const currentMessage = await page.locator(".admin-message").first().textContent().catch(() => "");
    const validationText = await page.locator(".admin-validation-panel").first().innerText().catch(() => "");
    const toast = await page.locator(".admin-toast").textContent().catch(() => "");
    throw new Error(
      `Product create button did not redirect. url=${page.url()} message=${currentMessage} toast=${toast} validation=${validationText} original=${error.message}`
    );
  });

  const response = await page.request.get(`${baseUrl}/api/admin/products`);
  const payload = await response.json();
  const created = payload.products?.find((product) => product.slug === slug);
  if (!created?.id) throw new Error("Created product was not found after button click save.");
  if (created.base_price !== 12300) throw new Error(`Created product price mismatch: ${created.base_price}`);

  await page.locator(".product-admin-table").getByText(slug).waitFor({ timeout: 7000 });
  await page.screenshot({ path: "screenshots/admin-products-after-create-real-edge.png", fullPage: true });
  const firstSlug = await page.locator(".product-admin-table tbody tr").first().locator("small").first().textContent();
  if (firstSlug !== slug) throw new Error(`Created product should be visible at the top. first=${firstSlug} expected=${slug}`);

  const detail = await page.request.get(`${baseUrl}/products/${slug}`);
  if (detail.status() !== 200) throw new Error(`Created product detail page failed: ${detail.status()}`);
  await page.goto(`${baseUrl}/products/${slug}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/admin-detail-after-create-real-edge.png", fullPage: true });

  const duplicate = await page.request.post(`${baseUrl}/api/admin/products`, {
    data: {
      name: `Pado E2E Product Duplicate ${stamp}`,
      slug,
      origin: "Tongyeong",
      category: "E2E",
      subtitle: "Duplicate slug should be rejected clearly.",
      description: "This request verifies duplicate slug error handling.",
      basePrice: "12300",
      imageUrl: "/images/products/wando-abalone.webp",
      badge: "E2E",
      highlights: "duplicate slug check",
      options: [{ name: "E2E option 1kg", priceDelta: "0", stock: "1" }],
      detailJson: {}
    }
  });
  const duplicatePayload = await duplicate.json();
  if (duplicate.status() !== 409 || duplicatePayload.code !== "DUPLICATE_SLUG") {
    throw new Error(`Duplicate slug should fail with 409 DUPLICATE_SLUG. status=${duplicate.status()} body=${JSON.stringify(duplicatePayload)}`);
  }

  const remove = await page.request.delete(`${baseUrl}/api/admin/products/${created.id}`);
  if (!remove.ok()) throw new Error(`Created verification product cleanup failed: ${remove.status()}`);

  if (consoleErrors.length > 0) {
    throw new Error(`Browser console errors detected: ${consoleErrors.join(" | ")}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        blockedMessage,
        redirectedToProducts: true,
        savingButtonText,
        completedButtonText,
        productCreated: true,
        productListedAtTop: true,
        productDetailStatus: 200,
        productSlug: slug,
        productId: created.id,
        duplicateSlugRejected: true,
        testProductSoftDeleted: true,
        screenshots: [
          "screenshots/admin-create-before-click-real-edge.png",
          "screenshots/admin-create-saving-real-edge.png",
          "screenshots/admin-create-completed-real-edge.png",
          "screenshots/admin-products-after-create-real-edge.png",
          "screenshots/admin-detail-after-create-real-edge.png"
        ],
        consoleErrors: []
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
