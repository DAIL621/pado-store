import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const bundledNodeModules = "C:/Users/L/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
function loadPlaywright() {
  for (const candidate of ["playwright-core", "playwright", process.env.PADO_PLAYWRIGHT_MODULE_DIR, existsSync(`${bundledNodeModules}/playwright`) ? `${bundledNodeModules}/playwright` : undefined, existsSync(`${bundledNodeModules}/.pnpm/node_modules/playwright-core`) ? `${bundledNodeModules}/.pnpm/node_modules/playwright-core` : undefined].filter(Boolean)) {
    try { return require(candidate); } catch {}
  }
  throw new Error("Playwright is required for large detail upload verification.");
}
const { chromium } = loadPlaywright();
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const workDir = await mkdtemp(path.join(tmpdir(), "pado-large-detail-"));
const tenMbPath = path.join(workDir, "001-detail-10mb.png");
const twentyMbPath = path.join(workDir, "002-detail-20mb.png");
const pngHeader = Buffer.from("89504e470d0a1a0a", "hex");

await writeFile(tenMbPath, Buffer.concat([pngHeader, Buffer.alloc(10 * 1024 * 1024 - pngHeader.length)]));
await writeFile(twentyMbPath, Buffer.concat([pngHeader, Buffer.alloc(20 * 1024 * 1024 - pngHeader.length)]));

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const uploadedPaths = [];

try {
  await page.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await page.waitForURL("**/admin/products", { timeout: 15000 });
  await page.goto(`${baseUrl}/admin/new`, { waitUntil: "networkidle" });

  const uploadInput = page.getByLabel("기존 상세페이지 이미지 업로드");
  await uploadInput.setInputFiles([tenMbPath, twentyMbPath]);
  await page.locator(".admin-upload-file-item.success").filter({ hasText: "001-detail-10mb.png" }).waitFor({ timeout: 30000 });
  await page.locator(".admin-upload-file-item.success").filter({ hasText: "002-detail-20mb.png" }).waitFor({ timeout: 30000 });

  const names = await page.locator(".admin-upload-file-item b").allTextContents();
  if (names.join("|") !== "001-detail-10mb.png|002-detail-20mb.png") throw new Error(`upload order changed: ${names.join("|")}`);
  const sizes = await page.locator(".admin-upload-file-item small").allTextContents();
  if (!sizes.includes("10.0MB") || !sizes.includes("20.0MB")) throw new Error(`upload sizes missing: ${sizes.join(", ")}`);
  const imageInputs = await page.locator('.admin-legacy-detail-card input[placeholder="/uploads/detail/sample.webp"]').all();
  for (const input of imageInputs) {
    const url = await input.inputValue();
    if (url.startsWith("/uploads/products/")) uploadedPaths.push(path.resolve("public", url.replace(/^\//, "")));
  }
  if (uploadedPaths.length !== 2) throw new Error(`expected 2 uploaded legacy images, got ${uploadedPaths.length}`);

  console.log(JSON.stringify({ ok: true, names, sizes, orderPreserved: true, uploadCount: uploadedPaths.length }, null, 2));
} finally {
  await browser.close();
  for (const target of uploadedPaths) await rm(target, { force: true });
  await rm(workDir, { recursive: true, force: true });
}
