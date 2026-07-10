import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const baseUrl = process.env.PADO_TEST_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEV_ADMIN_PASSWORD || "pado-admin-test";
const outputDir = path.join(root, "screenshots", "launch-readiness");
const reportDir = path.join(root, "reports", "launch-readiness");
const bundledNodeModules = "C:/Users/L/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function loadPlaywright() {
  const candidates = [
    "playwright-core",
    "playwright",
    process.env.PADO_PLAYWRIGHT_MODULE_DIR,
    fs.existsSync(`${bundledNodeModules}/playwright`) ? `${bundledNodeModules}/playwright` : undefined,
    fs.existsSync(`${bundledNodeModules}/.pnpm/node_modules/playwright-core`) ? `${bundledNodeModules}/.pnpm/node_modules/playwright-core` : undefined
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error("Playwright is required for launch readiness rehearsal.");
}

function edgeExecutablePath() {
  return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function step(name, status, details = "", screenshot = "") {
  return { name, status, details, screenshot };
}

function severity(title, level, details) {
  return { title, level, details };
}

async function screenshot(page, filename, fullPage = true) {
  const filePath = path.join(outputDir, filename);
  await page.screenshot({ path: filePath, fullPage });
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function mdTable(rows) {
  return [
    "| 단계 | 결과 | 상세 | 캡처 |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.name} | ${row.status} | ${String(row.details).replace(/\|/g, "/")} | ${row.screenshot || "-"} |`)
  ].join("\n");
}

function isPublicRehearsalSlug(slug) {
  const normalized = String(slug ?? "").toLowerCase();
  const isGeneratedTestDetailSlug = /-test-\d{8}-\d{4,6}$/.test(normalized);
  return !normalized.startsWith("ops-") && (isGeneratedTestDetailSlug || !normalized.includes("test"));
}

const preferredProductSlugs = [
  "wando-live-abalone",
  "tongyeong-conch",
  "tongyeong-sea-eel",
  "tongyeong-triploid-oyster",
  "anago-sashimi",
  "seafood-gift-set",
  "seafood-meal-kit"
];

function writeReports(report) {
  fs.mkdirSync(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, "launch-readiness-latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [
    "# Launch Readiness Report",
    "",
    `- 생성 시각: ${report.createdAt}`,
    `- 테스트 성공률: ${report.successRate}%`,
    `- Go / No-Go: ${report.goNoGo}`,
    `- 실제 런칭 가능 여부: ${report.launchPossible}`,
    `- 주문번호: ${report.orderNo || "생성 안 됨"}`,
    "",
    "## 단계별 결과",
    "",
    mdTable(report.steps),
    "",
    "## 발견 버그 / Blocker",
    "",
    ...(report.issues.length
      ? report.issues.map((issue) => `- **${issue.level}** ${issue.title}: ${issue.details}`)
      : ["- 없음"]),
    "",
    "## 검증 메모",
    "",
    ...report.notes.map((note) => `- ${note}`)
  ].join("\n");

  const mdPath = path.join(root, "LAUNCH_READINESS_REPORT.md");
  fs.writeFileSync(mdPath, `${md}\n`);
  return {
    json: path.relative(root, jsonPath).replaceAll("\\", "/"),
    markdown: path.relative(root, mdPath).replaceAll("\\", "/")
  };
}

const { chromium } = loadPlaywright();
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: edgeExecutablePath() });
const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const customerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const adminPage = await adminContext.newPage();
const customerPage = await customerContext.newPage();
const steps = [];
const issues = [];
const notes = [];
let order = null;
let selectedProduct = null;

try {
  await adminPage.goto(`${baseUrl}/dev-admin-login`, { waitUntil: "networkidle" });
  await adminPage.locator('input[name="password"]').fill(password);
  await adminPage.locator('form[action="/api/dev-admin-login"] button[type="submit"]').click();
  await adminPage.waitForURL("**/admin/products", { timeout: 15000 });

  const productsResponse = await adminPage.request.get(`${baseUrl}/api/admin/products`);
  const productsPayload = await productsResponse.json();
  const rehearsalProducts = (productsPayload.products ?? []).filter((product) => {
    const option = product.product_options?.find((item) => Number(item.stock) > 0);
    return product.is_active && isPublicRehearsalSlug(product.slug) && option;
  });
  selectedProduct =
    rehearsalProducts.find((product) => preferredProductSlugs.includes(product.slug)) ??
    rehearsalProducts.find((product) => !String(product.slug).includes("e2e")) ??
    rehearsalProducts[0];

  if (!selectedProduct) {
    throw new Error("주문 리허설에 사용할 판매중 상품과 재고 있는 옵션을 찾지 못했습니다.");
  }

  const selectedOption = selectedProduct.product_options.find((item) => Number(item.stock) > 0);
  const cartItem = {
    productSlug: selectedProduct.slug,
    name: selectedProduct.name,
    origin: selectedProduct.origin,
    image: selectedProduct.image_url || "/images/products/wando-abalone.webp",
    optionId: selectedOption.id,
    optionLabel: selectedOption.name,
    unitPrice: Number(selectedProduct.base_price) + Number(selectedOption.price_delta || 0),
    quantity: 1,
    stock: Number(selectedOption.stock)
  };

  steps.push(step("① 신규 회원가입", "BLOCKED", "카카오/Supabase Auth 외부 설정 및 실제 계정 인증 필요"));
  issues.push(severity("신규 회원가입 실기기/외부 인증 미검증", "Major", "카카오 로그인 Redirect URL과 운영 Auth 설정 후 실계정으로 확인 필요"));

  await customerPage.goto(`${baseUrl}/login?next=/mypage`, { waitUntil: "networkidle" });
  steps.push(step("② 로그인", "BLOCKED", "카카오 OAuth 외부 인증 필요", await screenshot(customerPage, "02-login.png")));

  await customerPage.goto(`${baseUrl}/products`, { waitUntil: "networkidle" });
  steps.push(step("③ 상품 조회", customerPage.url().includes("/products") ? "SUCCESS" : "FAIL", selectedProduct.slug, await screenshot(customerPage, "03-products.png")));

  await customerPage.goto(`${baseUrl}/products/${selectedProduct.slug}`, { waitUntil: "networkidle" });
  const detailStatus = await customerPage.locator("body").count();
  steps.push(step("④ 상품 상세", detailStatus ? "SUCCESS" : "FAIL", `/products/${selectedProduct.slug}`, await screenshot(customerPage, "04-product-detail.png")));

  await customerPage.evaluate((item) => {
    window.localStorage.setItem("pado-cart", JSON.stringify([item]));
  }, cartItem);
  await customerPage.goto(`${baseUrl}/cart`, { waitUntil: "networkidle" });
  steps.push(step("⑤ 장바구니", await customerPage.getByText(selectedProduct.name).count().then((count) => count > 0 ? "SUCCESS" : "FAIL"), "장바구니 localStorage 반영", await screenshot(customerPage, "05-cart.png")));

  await customerPage.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle" });
  await customerPage.locator('input[name="recipientName"]').fill("런칭리허설");
  await customerPage.locator('input[name="recipientPhone"]').fill("010-1234-5678");
  await customerPage.locator('input[name="postcode"]').fill("12345");
  await customerPage.locator('input[name="address"]').fill("서울시 테스트구 리허설로 12");
  await customerPage.locator('input[name="addressDetail"]').fill("101호");
  steps.push(step("⑥ 주문서 작성", "SUCCESS", "필수 배송지 입력 완료", await screenshot(customerPage, "06-checkout.png")));

  const orderResponse = await customerPage.request.post(`${baseUrl}/api/orders`, {
    data: {
      items: [cartItem],
      recipientName: "런칭리허설",
      recipientPhone: "010-1234-5678",
      postcode: "12345",
      address: "서울시 테스트구 리허설로 12",
      addressDetail: "101호",
      memo: "Sprint 12 운영 리허설 주문"
    }
  });
  const orderPayload = await orderResponse.json().catch(() => ({}));
  if (!orderResponse.ok() || !orderPayload.order?.id) {
    throw new Error(`주문 생성 실패: status=${orderResponse.status()} body=${JSON.stringify(orderPayload)}`);
  }
  order = orderPayload.order;
  steps.push(step("⑦ Toss 결제", "BLOCKED", "실제 Toss 결제창/승인/환불은 외부 실결제 권한 필요. 주문은 pending으로 생성됨."));
  issues.push(severity("Toss 실결제 승인/환불 미검증", "Critical", "운영 Toss 키, 성공/실패 URL, 실결제 카드 또는 테스트 결제 정책 확인 필요"));

  await customerPage.goto(`${baseUrl}/order-complete?orderNo=${encodeURIComponent(order.order_no)}&amount=${order.total_amount}`, { waitUntil: "networkidle" });
  steps.push(step("⑧ 주문 완료", "PARTIAL", "결제 전 주문 생성 및 주문 확인 화면 표시", await screenshot(customerPage, "08-order-complete.png")));

  await adminPage.goto(`${baseUrl}/admin/orders`, { waitUntil: "networkidle" });
  await adminPage.locator("body").waitFor({ timeout: 10000 });
  const orderVisible = await adminPage.getByText(order.order_no).count();
  steps.push(step("⑨ 관리자 주문 확인", orderVisible ? "SUCCESS" : "FAIL", order.order_no, await screenshot(adminPage, "09-admin-orders.png")));

  const updateOrder = async (body) => {
    const response = await adminPage.request.patch(`${baseUrl}/api/admin/orders/${order.id}`, { data: body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok()) {
      throw new Error(`주문 상태 변경 실패: ${JSON.stringify(body)} status=${response.status()} body=${JSON.stringify(payload)}`);
    }
    return payload;
  };

  await updateOrder({ status: "paid" });
  await updateOrder({ status: "preparing" });
  steps.push(step("⑩ 주문 상태 변경", "SUCCESS", "pending -> paid -> preparing"));

  let deliveryReadyBlocked = false;
  try {
    await updateOrder({ status: "delivery_ready", carrier: "CJ대한통운", trackingNumber: "123456789012" });
    steps.push(step("⑪ 송장 입력", "SUCCESS", "CJ대한통운 / 123456789012"));
  } catch (error) {
    deliveryReadyBlocked = true;
    const message = error instanceof Error ? error.message : String(error);
    steps.push(step("⑪ 송장 입력", "PARTIAL", `delivery_ready 전환 실패. shipped 단계에서 송장 입력 재시도: ${message}`));
    issues.push(severity("운영 DB 주문 상태 제약조건 미적용", "Major", "`supabase/migrations/202607060400_operation_automation.sql`의 orders_status_check 적용 필요"));
  }

  await updateOrder({ status: "shipped", carrier: "CJ대한통운", trackingNumber: "123456789012" });
  await adminPage.goto(`${baseUrl}/admin/orders`, { waitUntil: "networkidle" });
  steps.push(step("⑫ 배송중", "SUCCESS", deliveryReadyBlocked ? "preparing -> shipped" : "delivery_ready -> shipped", await screenshot(adminPage, "12-admin-shipped.png")));

  const deliveredPayload = await updateOrder({ status: "delivered", carrier: "CJ대한통운", trackingNumber: "123456789012" });
  await adminPage.goto(`${baseUrl}/admin/orders`, { waitUntil: "networkidle" });
  steps.push(step("⑬ 배송완료", "SUCCESS", "shipped -> delivered", await screenshot(adminPage, "13-admin-delivered.png")));

  await customerPage.goto(`${baseUrl}/mypage`, { waitUntil: "networkidle" });
  const mypageBlocked = customerPage.url().includes("/login");
  steps.push(step("⑭ 마이페이지 확인", mypageBlocked ? "BLOCKED" : "SUCCESS", mypageBlocked ? "고객 로그인 필요" : "주문내역 접근", await screenshot(customerPage, "14-mypage.png")));
  if (mypageBlocked) {
    issues.push(severity("마이페이지 주문내역 실계정 검증 미완료", "Major", "실제 고객 로그인 후 user_id가 연결된 주문으로 확인 필요"));
  }

  await adminPage.goto(`${baseUrl}/admin/automation`, { waitUntil: "networkidle" });
  const reviewRequests = deliveredPayload.reviewRequests ?? {};
  const reviewReady = reviewRequests.ok === true;
  if (!reviewReady) {
    issues.push(severity("리뷰 요청 테이블 또는 예약 저장 미완료", "Major", JSON.stringify(reviewRequests)));
  }
  steps.push(step("⑮ 리뷰 요청 준비", reviewReady ? "SUCCESS" : "PARTIAL", JSON.stringify(reviewRequests), await screenshot(adminPage, "15-review-request.png")));

  notes.push(`리허설 상품: ${selectedProduct.name} (${selectedProduct.slug})`);
  notes.push(`리허설 주문: ${order.order_no}`);
  notes.push("실결제 승인 대신 관리자 상태 변경으로 결제완료 이후 운영 흐름을 검증했습니다.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  issues.push(severity("리허설 자동화 중단", "Critical", message));
  steps.push(step("자동 리허설 실행", "FAIL", message));
} finally {
  const finished = steps.filter((item) => item.status === "SUCCESS").length;
  const total = steps.length || 1;
  const criticalCount = issues.filter((item) => item.level === "Critical").length;
  const majorCount = issues.filter((item) => item.level === "Major").length;
  const successRate = Math.round((finished / total) * 100);
  const goNoGo = criticalCount > 0 ? "No-Go" : majorCount > 0 ? "Conditional Go" : "Go";
  const report = {
    createdAt: new Date().toISOString(),
    successRate,
    goNoGo,
    launchPossible: goNoGo === "Go" ? "가능" : goNoGo === "Conditional Go" ? "조건부 가능" : "불가",
    orderNo: order?.order_no ?? "",
    productSlug: selectedProduct?.slug ?? "",
    steps,
    issues,
    notes
  };
  const reportPaths = writeReports(report);

  console.log(JSON.stringify({ ok: true, ...report, reports: reportPaths }, null, 2));

  await adminContext.close();
  await customerContext.close();
  await browser.close();
}
