import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";

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
  throw new Error("Playwright is required for this diagnostic script.");
}

async function fillField(page, name, value) {
  const field = page.locator(`.admin-product-builder [name="${name}"]`).first();
  await field.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.press("Backspace");
  await field.pressSequentially(value, { delay: 1 });
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  headless: false,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
mkdirSync("screenshots", { recursive: true });

const network = [];
const consoleMessages = [];
page.on("request", (request) => {
  if (request.url().includes("/api/admin/products")) {
    network.push({ type: "request", method: request.method(), url: request.url() });
  }
});
page.on("response", async (response) => {
  if (response.url().includes("/api/admin/products")) {
    let body = "";
    try {
      body = await response.text();
    } catch {}
    network.push({ type: "response", status: response.status(), url: response.url(), body: body.slice(0, 500) });
  }
});
page.on("console", (message) => {
  consoleMessages.push({ type: message.type(), text: message.text() });
});

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const slug = `diagnose-admin-submit-${stamp}`;
let createdId = "";

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });

  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.removeItem("pado-admin-product-create-draft"));
  await page.reload({ waitUntil: "networkidle" });

  await fillField(page, "name", `Diagnose Admin Submit ${stamp}`);
  await fillField(page, "slug", slug);
  await fillField(page, "origin", "Tongyeong");
  await fillField(page, "category", "Diagnose");
  await fillField(page, "subtitle", "Submit diagnostic product.");
  await fillField(page, "description", "Checks actual browser click, submit handler, and network request.");
  await fillField(page, "options.0.name", "Diagnostic option");
  await fillField(page, "options.0.price", "444");
  await fillField(page, "options.0.stock", "5");

  await page.locator('[data-testid="admin-product-submit"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    window.__padoSubmitEvents = [];
    const button = document.querySelector('[data-testid="admin-product-submit"]');
    const form = document.querySelector(".admin-product-builder");
    const push = (name, event) => {
      window.__padoSubmitEvents.push({
        name,
        time: new Date().toISOString(),
        target: event.target?.tagName,
        currentTarget: event.currentTarget?.tagName,
        disabled: button?.disabled ?? null
      });
    };
    button?.addEventListener("pointerdown", (event) => push("button:pointerdown:capture", event), true);
    button?.addEventListener("click", (event) => push("button:click:capture", event), true);
    form?.addEventListener("submit", (event) => push("form:submit:capture", event), true);
  });

  const beforeClick = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="admin-product-submit"]');
    if (!(button instanceof HTMLElement)) return { exists: false };
    const rect = button.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const styles = window.getComputedStyle(button);
    return {
      exists: true,
      text: button.textContent?.trim(),
      disabled: button.hasAttribute("disabled"),
      ariaBusy: button.getAttribute("aria-busy"),
      saveState: button.getAttribute("data-save-state"),
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      topElement: top ? `${top.tagName.toLowerCase()}${top === button ? "[button]" : ""}${top.getAttribute("data-testid") ? `[data-testid=${top.getAttribute("data-testid")}]` : ""}` : "none",
      isTopElementButton: top === button || button.contains(top)
    };
  });
  await page.screenshot({ path: "screenshots/admin-submit-diagnose-before-click.png", fullPage: false });

  await page.mouse.click(beforeClick.rect.x + beforeClick.rect.width / 2, beforeClick.rect.y + beforeClick.rect.height / 2);
  await page.waitForTimeout(250);
  const afterClick = await page.evaluate(() => ({
    events: window.__padoSubmitEvents ?? [],
    debugText: document.querySelector('[data-testid="admin-submit-debug"]')?.textContent ?? "",
    buttonText: document.querySelector('[data-testid="admin-product-submit"]')?.textContent?.trim() ?? "",
    saveState: document.querySelector('[data-testid="admin-product-submit"]')?.getAttribute("data-save-state") ?? ""
  }));
  await page.screenshot({ path: "screenshots/admin-submit-diagnose-after-click.png", fullPage: false });

  await page.locator('[data-testid="admin-product-submit"][data-save-state="completed"]').waitFor({ timeout: 12000 });
  const completedState = await page.evaluate(() => ({
    debugText: document.querySelector('[data-testid="admin-submit-debug"]')?.textContent ?? "",
    buttonText: document.querySelector('[data-testid="admin-product-submit"]')?.textContent?.trim() ?? "",
    saveState: document.querySelector('[data-testid="admin-product-submit"]')?.getAttribute("data-save-state") ?? ""
  }));
  await page.screenshot({ path: "screenshots/admin-submit-diagnose-completed.png", fullPage: false });

  await page.waitForURL("**/admin/products", { timeout: 20000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const products = await page.request.get(`${baseUrl}/api/admin/products`);
  const payload = await products.json();
  const created = payload.products?.find((product) => product.slug === slug);
  createdId = created?.id ?? "";
  if (!createdId) throw new Error("Diagnostic product was not found in admin product list.");
  const detail = await page.request.get(`${baseUrl}/products/${slug}`);

  await page.screenshot({ path: "screenshots/admin-submit-diagnose-products.png", fullPage: false });

  console.log(
    JSON.stringify(
      {
        ok: true,
        beforeClick,
        afterClick,
        completedState,
        network,
        consoleMessages,
        productListed: Boolean(createdId),
        createdId,
        slug,
        detailStatus: detail.status()
      },
      null,
      2
    )
  );
} finally {
  if (createdId) {
    await page.request.delete(`${baseUrl}/api/admin/products/${createdId}`).catch(() => {});
  }
  await browser.close();
}
