import fs from "node:fs";

const productsManager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const productEditor = fs.readFileSync("components/admin/ProductDetailEditor.tsx", "utf8");
const productBuilder = fs.readFileSync("components/admin/AdminProductBuilder.tsx", "utf8");
const productForm = fs.readFileSync("components/admin/AdminProductForm.tsx", "utf8");
const productPreview = fs.readFileSync("components/admin/ProductDetailPreview.tsx", "utf8");
const ordersManager = fs.readFileSync("components/admin/AdminOrdersManager.tsx", "utf8");
const productsApi = fs.readFileSync("app/api/admin/products/route.ts", "utf8");
const slugHelper = fs.readFileSync("lib/products/slug.ts", "utf8");
const adminDashboard = fs.readFileSync("app/admin/page.tsx", "utf8");
const adminLayout = fs.readFileSync("components/admin/AdminLayout.tsx", "utf8");
const opsPlaceholder = fs.readFileSync("components/admin/AdminOperationsPlaceholder.tsx", "utf8");
const opsPages = [
  "app/admin/members/page.tsx",
  "app/admin/reviews/page.tsx",
  "app/admin/marketing/page.tsx",
  "app/admin/content/page.tsx",
  "app/admin/stats/page.tsx",
  "app/admin/automation/page.tsx"
].map((file) => fs.readFileSync(file, "utf8")).join("\n");
const statsPage = fs.readFileSync("app/admin/stats/page.tsx", "utf8");
const membersPage = fs.readFileSync("app/admin/members/page.tsx", "utf8");
const reviewsPage = fs.readFileSync("app/admin/reviews/page.tsx", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(productsManager.includes("QualityFilter"), "admin product quality filter is missing");
assert(productsManager.includes("SortMode"), "admin product sort mode is missing");
assert(productsManager.includes("quality-low"), "admin product low-quality sort is missing");
assert(productsManager.includes("stock-low"), "admin product stock sort is missing");
assert(productsManager.includes("copyDetailUrl"), "admin product detail URL copy action is missing");
assert(productsManager.includes("URL 복사"), "admin product detail URL copy button is missing");
assert(productsManager.includes("duplicateProduct"), "admin product duplicate action is missing");
assert(productsManager.includes("createCopySlug"), "admin product copy slug generator is missing");
assert(productsManager.includes("복사"), "admin product duplicate button is missing");
assert(productsManager.includes("recoverVerificationProducts"), "admin hidden verification product recovery action is missing");
assert(productsManager.includes("숨김 검증 복구"), "admin hidden verification product recovery button is missing");
assert(productEditor.includes("handlePaste"), "admin pasted image upload handler is missing");
assert(productEditor.includes("clipboardData.files"), "admin pasted image upload does not read clipboard files");
assert(productBuilder.includes("가격/재고"), "admin quality score does not include price/stock readiness");
assert(productBuilder.includes("SEO"), "admin quality score does not include SEO readiness");
assert(productBuilder.includes("상품 등록완료"), "admin submit button should show completed state after save");
assert(productBuilder.includes("productSlug"), "admin submit result should expose created product slug");
assert(productPreview.includes("ProductDetailTemplate"), "admin preview should render the real product detail template");
assert(productPreview.includes("PreviewPurchaseSlot"), "admin preview should use a safe preview purchase slot");
assert(ordersManager.includes("downloadFilteredOrders"), "admin order CSV download action is missing");
assert(ordersManager.includes("엑셀다운로드"), "admin order Excel download button is missing");
assert(ordersManager.includes("text/csv"), "admin order download should generate CSV");
assert(productForm.includes("pado-admin-last-created-product"), "admin create flow should remember last created product");
assert(productsApi.includes("createProductSlug"), "admin product create API should normalize slugs");
assert(productsApi.includes("DUPLICATE_SLUG"), "admin product create API should return duplicate slug errors");
assert(slugHelper.includes("wando-live-abalone"), "slug helper should generate known English product slugs");
assert(adminDashboard.includes("admin-kpi-grid"), "admin dashboard KPI grid is missing");
assert(adminDashboard.includes("오늘 주문"), "admin dashboard today order metric is missing");
assert(adminDashboard.includes("오늘 매출"), "admin dashboard today revenue metric is missing");
assert(adminDashboard.includes("이번달 매출"), "admin dashboard monthly revenue metric is missing");
assert(adminDashboard.includes("배송 준비"), "admin dashboard delivery-ready metric is missing");
assert(adminDashboard.includes("재고 부족"), "admin dashboard low-stock metric is missing");
assert(adminDashboard.includes("인기상품 / 판매순위"), "admin dashboard top product ranking is missing");
assert(adminDashboard.includes("profiles"), "admin dashboard member count check is missing");
["/admin/members", "/admin/reviews", "/admin/marketing", "/admin/content", "/admin/stats", "/admin/automation"].forEach((href) => {
  assert(adminLayout.includes(href), `admin sidebar route is missing: ${href}`);
});
assert(adminLayout.includes("admin-mobile-nav"), "admin mobile navigation is missing");
assert(opsPlaceholder.includes("admin-ops-grid"), "admin operation placeholder grid is missing");
assert(opsPages.includes("회원 관리"), "admin members page is missing");
assert(opsPages.includes("리뷰 관리"), "admin reviews page is missing");
assert(opsPages.includes("쿠폰·배너 관리"), "admin marketing page is missing");
assert(opsPages.includes("공지·FAQ 관리"), "admin content page is missing");
assert(opsPages.includes("통계"), "admin stats page is missing");
assert(statsPage.includes("rankProducts"), "admin stats product ranking is missing");
assert(statsPage.includes("rankCategories"), "admin stats category ranking is missing");
assert(statsPage.includes("일매출"), "admin stats daily revenue metric is missing");
assert(statsPage.includes("월매출"), "admin stats monthly revenue metric is missing");
assert(membersPage.includes("profiles"), "admin members page should read profiles");
assert(membersPage.includes("구매횟수"), "admin members purchase count is missing");
assert(membersPage.includes("누적구매"), "admin members revenue table is missing");
assert(reviewsPage.includes("getReviewReadiness"), "admin reviews readiness check is missing");
assert(reviewsPage.includes("상품별 리뷰 준비도"), "admin reviews product readiness table is missing");
assert(reviewsPage.includes("구매 인증 기준"), "admin reviews operation policy note is missing");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "product-list-filter",
        "product-list-sort",
        "pasted-image-upload",
        "quality-score-readiness",
        "create-success-ux",
        "english-slug",
        "duplicate-slug",
        "real-detail-template-preview",
        "order-csv-download",
        "detail-url-copy",
        "product-duplicate",
        "verification-product-recover",
        "operation-dashboard-kpis",
        "operation-dashboard-ranking",
        "operation-module-routes",
        "mobile-admin-navigation",
        "admin-sales-statistics",
        "admin-member-purchase-summary",
        "admin-review-readiness",
        "admin-operation-automation-route"
      ]
    },
    null,
    2
  )
);
