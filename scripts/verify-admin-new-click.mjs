import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";

function loadPlaywright() {
  const candidates = ["playwright-core", "playwright"];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error("Playwright is required for this verification. Run with NODE_PATH pointing to playwright-core.");
}

function edgeExecutablePath() {
  return (
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  );
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
const consoleErrors = [];
page.on("console", (message) => {
  const text = message.text();
  const isDevHmrNoise = text.includes("/_next/webpack-hmr") || text.includes("WebSocket connection");
  if (message.type() === "error" && !isDevHmrNoise) consoleErrors.push(text);
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const slug = `admin-click-verification-${stamp}`;

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.removeItem("pado-admin-product-create-draft"));
  await page.reload({ waitUntil: "networkidle" });

  await page.locator('.admin-save-panel button[type="submit"]').click();
  await page.locator(".admin-message").filter({ hasText: "등록 차단:" }).waitFor({ timeout: 7000 });
  const blockedMessage = await page.locator(".admin-message").first().textContent();

  await fillField(page, "name", `Admin Click Verification Product ${stamp}`);
  await fillField(page, "slug", slug);
  await fillField(page, "origin", "Tongyeong");
  await fillField(page, "category", "Verification");
  await fillField(page, "subtitle", "Button click verification product.");
  await fillField(page, "description", "This product verifies the real admin create button flow in the browser.");
  await fillField(page, "basePrice", "12300");
  await fillField(page, "options.0.name", "Verification option 1kg");
  await fillField(page, "options.0.priceDelta", "0");
  await fillField(page, "options.0.stock", "3");
  await page.locator('.admin-save-panel button[type="submit"]').click();
  await Promise.race([
    page.getByText("저장하는 중입니다").waitFor({ timeout: 7000 }),
    page.waitForURL("**/admin/products", { timeout: 7000 })
  ]).catch(() => {});
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
        productCreated: true,
        testProductSoftDeleted: true,
        consoleErrors: []
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
