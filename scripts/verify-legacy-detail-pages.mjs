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
const slug = `legacy-detail-verification-${stamp}`;
const legacyDetailImages = [
  {
    label: "기존 상세페이지 1",
    url: "/images/products/wando-abalone.webp",
    description: "대표 제작 상세페이지 첫 번째 이미지"
  },
  {
    label: "기존 상세페이지 2",
    url: "/images/products/tongyeong-eel.webp",
    description: "대표 제작 상세페이지 두 번째 이미지"
  }
];

const detailJson = {
  schemaVersion: 1,
  detailDisplayMode: "legacy",
  legacyDetailImages,
  heroImages: [{ label: "대표사진", url: "/images/products/wando-abalone.webp", description: "대표 이미지" }],
  benefits: ["기존 상세페이지 우선 출력", "AI 자동생성 fallback 유지", "모바일 비율 유지"],
  journey: [],
  packaging: ["냉장 포장"],
  recipes: [],
  components: ["검증 상품"],
  faq: [{ question: "기존 상세페이지가 먼저 보이나요?", answer: "등록된 기존 상세페이지 이미지가 우선 출력됩니다." }]
};

const loginPage = await request("/dev-admin-login");
assert(loginPage.status === 200, `/dev-admin-login failed: ${loginPage.status}`);

const login = await request("/api/dev-admin-login", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ password }).toString()
});
assert(login.status === 303, `dev admin login should redirect with 303, got: ${login.status}`);

const create = await request("/api/admin/products", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: `Legacy Detail Verification Product ${stamp}`,
    slug,
    origin: "Wando",
    category: "Verification",
    subtitle: "Existing detail page verification product",
    description: "Checks whether uploaded existing detail page images render before the AI generated detail template.",
    basePrice: "12300",
    imageUrl: "/images/products/wando-abalone.webp",
    badge: "TEST",
    highlights: "Legacy detail, Launch priority, Mobile responsive",
    options: [{ name: "Verification option 1kg", priceDelta: "0", stock: "3" }],
    detailJson
  })
});
const createResult = await readJson(create);
if (!create.ok) {
  console.error(JSON.stringify(createResult, null, 2));
  throw new Error(`product create failed: ${create.status}`);
}

assert(createResult.product?.detail_json?.detailDisplayMode === "legacy", "detailDisplayMode was not saved as legacy");
assert(createResult.product?.detail_json?.legacyDetailImages?.length === 2, "legacy detail images were not saved");

const detail = await request(`/products/${slug}`);
const detailHtml = await detail.text();
assert(detail.status === 200, `detail page failed: ${detail.status}`);
assert(detailHtml.includes('data-template-kind="legacy"'), "legacy template marker was not rendered");
assert(detailHtml.includes("legacy-detail-pages"), "legacy detail section was not rendered");
assert(detailHtml.includes("기존 상세페이지 1"), "legacy image label was not rendered");
assert(!detailHtml.includes("detail-master-gallery-"), "AI gallery layout should not render before legacy pages when legacy mode is active");

const productId = createResult.product?.id;
if (productId) {
  const remove = await request(`/api/admin/products/${productId}`, { method: "DELETE" });
  assert(remove.ok, `test product soft delete failed: ${remove.status}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      slug,
      detailDisplayMode: "legacy",
      legacyDetailImages: legacyDetailImages.length,
      detailPageRendered: true,
      testProductSoftDeleted: Boolean(productId)
    },
    null,
    2
  )
);
