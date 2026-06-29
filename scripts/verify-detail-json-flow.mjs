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
const slug = `detail-auto-verification-${stamp}`;

const detailJson = {
  heroImages: [
    { label: "대표사진", url: "/images/products/wando-abalone.webp", description: "대표 사진 검증" },
    { label: "크기 비교 사진", url: "/images/products/tongyeong-conch.webp", description: "크기 비교 검증" },
    { label: "신선도/질감 사진", url: "/images/products/tongyeong-eel.webp", description: "신선도 검증" },
    { label: "구성품 사진", url: "/images/products/tongyeong-oyster.webp", description: "구성품 검증" },
    { label: "포장 상태 사진", url: "/images/products/mokpo-hairtail.webp", description: "포장 검증" },
    { label: "조리 후 모습 사진", url: "/images/products/tongyeong-octopus.webp", description: "조리 후 검증" }
  ],
  benefits: ["완도산 활전복", "당일 선별", "산소포장", "오후 1시 이전 당일 출고", "신선도 보장"],
  journey: [
    { key: "origin", title: "산지", image: "/images/story/tongyeong-sea.webp", description: "통영 산지에서 준비합니다." },
    { key: "sorting", title: "선별", image: "/images/story/why-sorting.webp", description: "상태 좋은 상품만 선별합니다." },
    { key: "packing", title: "포장", image: "/images/story/why-packing.webp", description: "신선 포장 후 출고합니다." },
    { key: "delivery", title: "배송", image: "/images/story/hero-conch.webp", description: "냉장 배송으로 이동합니다." },
    { key: "table", title: "식탁", image: "/images/products/wando-abalone.webp", description: "식탁에서 바로 즐길 수 있습니다." }
  ],
  packaging: ["아이스팩 동봉", "냉장 신선 포장", "평일 오후 1시 이전 주문 당일 출고", "안전한 포장으로 신선도 유지"],
  recipes: [{ title: "전복버터구이", description: "버터와 마늘을 넣고 구워 드세요.", image: "/images/products/wando-abalone.webp" }],
  components: ["검증 상품 1kg", "아이스팩", "보관 안내문"],
  faq: [{ question: "언제 출고되나요?", answer: "평일 오후 1시 이전 주문 건은 당일 출고됩니다." }]
};

const loginPage = await request("/dev-admin-login");
assert(loginPage.status === 200, `/dev-admin-login failed: ${loginPage.status}`);

const login = await request("/api/dev-admin-login", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ password }).toString()
});
assert(login.status === 307 || login.status === 303, `dev admin login failed: ${login.status}`);

const adminNew = await request("/admin/new");
const adminNewHtml = await adminNew.text();
assert(adminNew.status === 200, `/admin/new failed: ${adminNew.status}`);
assert(adminNewHtml.includes("admin-detail-editor"), "detail editor markup not found on /admin/new");

const adminProducts = await request("/admin/products");
assert(adminProducts.status === 200, `/admin/products failed: ${adminProducts.status}`);

const uploadForm = new FormData();
uploadForm.append("file", new File([Buffer.from(tinyPngBase64, "base64")], "detail-test.png", { type: "image/png" }));
const upload = await request("/api/admin/uploads", {
  method: "POST",
  body: uploadForm
});
const uploadResult = await readJson(upload);
assert(upload.ok, `image upload failed: ${upload.status}`);
assert(uploadResult.url?.startsWith("/uploads/products/"), "uploaded image url was not returned");

const create = await request("/api/admin/products", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: `상세 자동화 검증 상품 ${stamp}`,
    slug,
    origin: "통영",
    category: "검증상품",
    subtitle: "상세페이지 자동 생성 검증용 상품",
    description: "관리자 입력 데이터가 상품 상세페이지에 자동 표시되는지 확인합니다.",
    basePrice: "12300",
    imageUrl: "/images/products/wando-abalone.webp",
    badge: "검증",
    highlights: "자동 상세, 관리자 입력, 저장 검증",
    options: [{ name: "검증 옵션 1kg", priceDelta: "0", stock: "3" }],
    detailJson: {
      ...detailJson,
      heroImages: detailJson.heroImages.map((image, index) => (index === 0 ? { ...image, url: uploadResult.url } : image))
    }
  })
});
const createResult = await readJson(create);

if (!create.ok) {
  console.error(JSON.stringify(createResult, null, 2));
  throw new Error(`product create failed: ${create.status}`);
}

assert(createResult.product?.detail_json?.schemaVersion === 1, "detail_json schemaVersion was not saved");
assert(createResult.product?.detail_json?.heroImages?.length === 6, "heroImages were not saved");

const detail = await request(`/products/${slug}`);
const detailHtml = await detail.text();
assert(detail.status === 200, `detail page failed: ${detail.status}`);
assert(detailHtml.includes("완도산 활전복"), "benefit was not rendered on detail page");
assert(detailHtml.includes("언제 출고되나요?"), "FAQ was not rendered on detail page");

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

console.log(JSON.stringify({
  ok: true,
  slug,
  adminNew: true,
  adminProducts: true,
  detailJsonSaved: true,
  imageUpload: true,
  detailPageRendered: true,
  testProductSoftDeleted: Boolean(productId)
}, null, 2));
