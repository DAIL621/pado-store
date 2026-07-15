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
const slug = `admin-edit-verification-${stamp}`;
const editedSlug = `${slug}-edited`;
let productId = "";

const baseDetailJson = {
  heroImages: [
    { label: "대표사진", url: "/images/products/wando-abalone.webp", description: "수정 전 대표 사진" }
  ],
  benefits: ["수정 전 장점"],
  journey: [{ key: "origin", title: "산지", image: "/images/story/tongyeong-sea.webp", description: "수정 전 산지 설명" }],
  packaging: ["수정 전 포장"],
  recipes: [{ title: "수정 전 조리법", description: "수정 전 설명", image: "/images/products/wando-abalone.webp" }],
  components: ["수정 전 구성품"],
  faq: [{ question: "수정 전 질문인가요?", answer: "수정 전 답변입니다." }]
};

try {
  const loginPage = await request("/dev-admin-login");
  assert(loginPage.status === 200, `/dev-admin-login failed: ${loginPage.status}`);

  const login = await request("/api/dev-admin-login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ password }).toString()
  });
  assert(login.status === 307 || login.status === 303, `dev admin login failed: ${login.status}`);

  const create = await request("/api/admin/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `관리자 수정 검증 상품 ${stamp}`,
      slug,
      origin: "통영",
      category: "검증상품",
      subtitle: "수정 저장 검증용 상품",
      description: "상품 수정 저장 자동화 테스트를 위한 상품입니다.",
      basePrice: "15000",
      imageUrl: "/images/products/wando-abalone.webp",
      badge: "검증",
      highlights: "수정 전, 자동화, 검증",
      options: [
        { name: "수정 전 옵션", price: "16600", stock: "5" },
        { name: "삭제될 옵션", price: "17600", stock: "2" }
      ],
      isActive: false,
      detailJson: baseDetailJson
    })
  });
  const createResult = await readJson(create);
  if (!create.ok) {
    console.error(JSON.stringify(createResult, null, 2));
    throw new Error(`product create failed: ${create.status}`);
  }

  productId = createResult.product?.id;
  assert(productId, "created product id missing");

  const editedDetailJson = {
    heroImages: [
      { label: "대표사진", url: "/images/products/tongyeong-conch.webp", description: "수정 후 대표 사진" },
      { label: "포장 사진", url: "/images/products/tongyeong-oyster.webp", description: "수정 후 포장 사진" }
    ],
    benefits: ["수정 후 장점 1", "수정 후 장점 2", "수정 후 장점 3"],
    journey: [
      { key: "origin", title: "산지", image: "/images/story/tongyeong-sea.webp", description: "수정 후 산지 설명" },
      { key: "packing", title: "포장", image: "/images/story/why-packing.webp", description: "수정 후 포장 설명" }
    ],
    packaging: ["수정 후 냉장 포장", "수정 후 당일 출고"],
    recipes: [{ title: "수정 후 조리법", description: "수정 후 맛있게 먹는 방법입니다.", image: "/images/products/tongyeong-conch.webp" }],
    components: ["수정 후 구성품 1", "수정 후 구성품 2"],
    faq: [{ question: "수정 후 질문인가요?", answer: "수정 후 답변입니다." }]
  };

  const update = await request(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `관리자 수정 검증 상품 ${stamp} 수정`,
      slug: editedSlug,
      origin: "완도",
      category: "수정검증",
      subtitle: "수정 저장 후 상세페이지 반영 검증",
      description: "수정 저장된 설명입니다.",
      basePrice: "17700",
      imageUrl: "/images/products/tongyeong-conch.webp",
      badge: "수정",
      highlights: "수정 후, 옵션 교체, 상세 반영",
      options: [{ name: "수정 후 옵션", price: "17700", stock: "7" }],
      detailJson: editedDetailJson
    })
  });
  const updateResult = await readJson(update);
  if (!update.ok) {
    console.error(JSON.stringify(updateResult, null, 2));
    throw new Error(`product update failed: ${update.status}`);
  }

  assert(updateResult.product?.slug === editedSlug, "product slug was not updated");
  assert(updateResult.product?.base_price === 17700, "base price was not updated");

  const list = await request("/api/admin/products");
  const listResult = await readJson(list);
  const edited = listResult.products?.find((product) => product.id === productId);
  assert(edited, "edited product was not found in admin list");
  assert(edited.product_options?.length === 1, "removed option was not deleted");
  assert(edited.product_options?.[0]?.name === "수정 후 옵션", "option update was not saved");
  assert(edited.detail_json?.benefits?.includes("수정 후 장점 2"), "detail_json benefits were not updated");

  const detail = await request(`/products/${editedSlug}`);
  const detailHtml = await detail.text();
  assert(detail.status === 200, `edited detail page failed: ${detail.status}`);
  assert(detailHtml.includes("수정 후 장점 2"), "edited benefit was not rendered on detail page");
  assert(detailHtml.includes("수정 후 질문인가요?"), "edited FAQ was not rendered on detail page");

  const remove = await request(`/api/admin/products/${productId}`, { method: "DELETE" });
  assert(remove.ok, `test product soft delete failed: ${remove.status}`);

  console.log(JSON.stringify({
    ok: true,
    slug,
    editedSlug,
    productCreated: true,
    productUpdated: true,
    optionReplaced: true,
    detailJsonUpdated: true,
    detailPageRendered: true,
    testProductSoftDeleted: true
  }, null, 2));
} catch (error) {
  if (productId) {
    await request(`/api/admin/products/${productId}`, { method: "DELETE" }).catch(() => {});
  }
  throw error;
}
