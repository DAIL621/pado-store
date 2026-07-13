const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

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

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookies = cookieHeader();
  if (cookies) headers.set("cookie", cookies);

  const response = await fetch(`${baseUrl}${path}`, {
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

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
let slug = `detail-auto-verification-${stamp}`;

const detailJson = {
  heroImages: [
    { label: "Main photo", url: "/images/products/wando-abalone.webp", description: "Primary verification image" },
    { label: "Size comparison", url: "/images/products/tongyeong-conch.webp", description: "Size comparison image" },
    { label: "Fresh texture", url: "/images/products/tongyeong-eel.webp", description: "Freshness verification image" },
    { label: "Components", url: "/images/products/tongyeong-oyster.webp", description: "Package components image" },
    { label: "Packaging", url: "/images/products/mokpo-hairtail.webp", description: "Packaging state image" },
    { label: "Cooked dish", url: "/images/products/tongyeong-octopus.webp", description: "Cooked dish image" }
  ],
  benefits: ["Wando origin", "Same-day sorting", "Oxygen packaging", "Ships before 1 PM", "Freshness guarantee"],
  journey: [
    { key: "origin", title: "Origin", image: "/images/story/tongyeong-sea.webp", description: "Prepared at the local fishery." },
    { key: "sorting", title: "Sorting", image: "/images/story/why-sorting.webp", description: "Only good products are selected." },
    { key: "packing", title: "Packing", image: "/images/story/why-packing.webp", description: "Packed cold before shipment." },
    { key: "delivery", title: "Delivery", image: "/images/story/hero-conch.webp", description: "Delivered through refrigerated shipping." },
    { key: "table", title: "Table", image: "/images/products/wando-abalone.webp", description: "Ready to enjoy at home." }
  ],
  packaging: ["Ice pack included", "Fresh refrigerated packaging", "Ships same day before 1 PM", "Packed to protect freshness"],
  recipes: [
    {
      title: "Butter grilled abalone",
      description: "Cook with butter and garlic until golden.",
      image: "/images/products/wando-abalone.webp"
    }
  ],
  components: ["Verification product 1kg", "Ice pack", "Storage guide"],
  faq: [{ question: "When does it ship?", answer: "Weekday orders before 1 PM ship the same day." }]
};

const loginPage = await request("/dev-admin-login");
assert(loginPage.status === 200, `/dev-admin-login failed: ${loginPage.status}`);

const login = await request("/api/dev-admin-login", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ password }).toString()
});
assert(login.status === 303, `dev admin login should redirect with 303, got: ${login.status}`);
assert(login.headers.get("location")?.endsWith("/admin/products"), "dev admin login did not redirect to /admin/products");

const adminNew = await request("/admin/new");
const adminNewHtml = await adminNew.text();
assert(adminNew.status === 200, `/admin/new failed: ${adminNew.status}`);
assert(adminNewHtml.includes("admin-detail-editor"), "detail editor markup not found on /admin/new");

const adminProducts = await request("/admin/products");
const adminProductsHtml = await adminProducts.text();
assert(adminProducts.status === 200, `/admin/products failed: ${adminProducts.status}`);
assert(!adminProductsHtml.includes("카카오로 3초 로그인"), "/admin/products fell back to the Kakao login page");

const uploadForm = new FormData();
uploadForm.append("file", new File([Buffer.from(tinyPngBase64, "base64")], "detail-test.png", { type: "image/png" }));
const upload = await request("/api/admin/uploads", {
  method: "POST",
  body: uploadForm
});
const uploadResult = await readJson(upload);
assert(upload.ok, `image upload failed: ${upload.status}`);
assert(uploadResult.url?.startsWith("/uploads/products/"), "uploaded image url was not returned");

let create;
let createResult;
for (let attempt = 0; attempt < 3; attempt += 1) {
  const attemptSlug = attempt === 0 ? slug : `${slug}-retry-${attempt}`;
  create = await request("/api/admin/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `Detail Auto Verification Product ${stamp}${attempt ? ` Retry ${attempt}` : ""}`,
      slug: attemptSlug,
      origin: "Wando",
      category: "Verification",
      subtitle: "Automatic detail page verification product",
      description: "Checks whether admin detail_json data renders through the master product detail template.",
      basePrice: "12300",
      imageUrl: "/images/products/wando-abalone.webp",
      badge: "TEST",
      highlights: "Automatic detail, Admin input, Save verification",
      options: [{ name: "Verification option 1kg", priceDelta: "0", stock: "3" }],
      isActive: false,
      detailJson
    })
  });
  createResult = await readJson(create);
  if (create.ok) {
    slug = attemptSlug;
    break;
  }
  if (!String(createResult?.message ?? "").includes("fetch failed")) break;
  await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
}

if (!create.ok) {
  console.error(JSON.stringify(createResult, null, 2));
  throw new Error(`product create failed: ${create.status}`);
}

assert(createResult.product?.detail_json?.schemaVersion === 1, "detail_json schemaVersion was not saved");
assert(createResult.product?.detail_json?.heroImages?.length === 6, "heroImages were not saved");

const detail = await request(`/products/${slug}`);
const detailHtml = await detail.text();
assert(detail.status === 200, `detail page failed: ${detail.status}`);
assert(detailHtml.includes('data-template-id="pado-master-v2"'), "master template metadata was not rendered");
assert(detailHtml.includes("detail-master-hero"), "master detail hero was not rendered");
assert(detailHtml.includes("detail-master-trust"), "trust signal section was not rendered");
assert(detailHtml.includes("detail-master-features"), "feature section was not rendered");
assert(detailHtml.includes("detail-master-overview"), "overview section was not rendered");
assert(detailHtml.includes("detail-master-timeline"), "timeline section was not rendered");
assert(detailHtml.includes("detail-master-advantages"), "advantage section was not rendered");
assert(detailHtml.includes("detail-master-gallery"), "gallery section was not rendered");
assert(detailHtml.includes("detail-master-cooking"), "cooking section was not rendered");
assert(detailHtml.includes("detail-master-shipping"), "packaging section was not rendered");
assert(detailHtml.includes("detail-master-components"), "components section was not rendered");
assert(detailHtml.includes("detail-master-faq"), "FAQ section was not rendered");
assert(detailHtml.includes("Wando origin"), "benefit was not rendered on detail page");
assert(detailHtml.includes("When does it ship?"), "FAQ content was not rendered on detail page");

const productId = createResult.product?.id;
if (productId) {
  const remove = await request(`/api/admin/products/${productId}`, { method: "DELETE" });
  assert(remove.ok, `test product soft delete failed: ${remove.status}`);
}

if (uploadResult.url) {
  const { unlink } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const target = join(process.cwd(), "public", uploadResult.url.replace(/^\//, ""));
  await unlink(target).catch(() => {});
}

console.log(
  JSON.stringify(
    {
      ok: true,
      slug,
      adminNew: true,
      adminProducts: true,
      detailJsonSaved: true,
      imageUpload: true,
      masterTemplateSections: true,
      detailPageRendered: true,
      testProductSoftDeleted: Boolean(productId)
    },
    null,
    2
  )
);
