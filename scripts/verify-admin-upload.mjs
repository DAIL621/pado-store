import { rm } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const cookieJar = new Map();

function storeCookies(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return;

  for (const cookie of setCookie.split(/,(?=\s*[^;=]+=[^;]+)/)) {
    const [pair] = cookie.trim().split(";");
    const [name, value] = pair.split("=");
    if (name && value) cookieJar.set(name, value);
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(pathname, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookies = cookieHeader();
  if (cookies) headers.set("cookie", cookies);

  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    ...init,
    headers
  });
  storeCookies(response);
  return response;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function uploadFile(blob, filename) {
  const form = new FormData();
  form.append("file", blob, filename);
  const response = await request("/api/admin/uploads", {
    method: "POST",
    body: form
  });
  return { response, body: await readJson(response) };
}

async function cleanupLocalUpload(url) {
  if (!url?.startsWith("/uploads/products/")) return false;

  const root = path.resolve(".");
  const uploadRoot = path.join(root, "public", "uploads", "products");
  const target = path.resolve(root, "public", url.replace(/^\//, ""));
  if (!target.startsWith(uploadRoot)) return false;

  await rm(target, { force: true });
  return true;
}

try {
  const loginPage = await request("/dev-admin-login");
  assert(loginPage.status === 200, `/dev-admin-login failed: ${loginPage.status}`);

  const login = await request("/api/dev-admin-login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ password }).toString()
  });
  assert(login.status === 307 || login.status === 303, `dev admin login failed: ${login.status}`);

  const invalid = await uploadFile(new Blob(["not an image"], { type: "text/plain" }), "not-image.txt");
  assert(invalid.response.status === 400, `invalid upload should fail with 400, got ${invalid.response.status}`);

  const pixelGif = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  const valid = await uploadFile(new Blob([pixelGif], { type: "image/gif" }), "pixel.gif");
  assert(valid.response.status === 200, `valid upload failed: ${valid.response.status} ${JSON.stringify(valid.body)}`);
  assert(valid.body.ok && valid.body.url, "valid upload did not return a URL");
  assert(["local", "supabase"].includes(valid.body.storage), "upload storage mode is missing");

  const cleanedLocalFile = await cleanupLocalUpload(valid.body.url);

  console.log(
    JSON.stringify(
      {
        ok: true,
        invalidUploadRejected: true,
        validUploadAccepted: true,
        storage: valid.body.storage,
        cleanedLocalFile
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}
