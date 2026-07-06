import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const productsManager = read("components/admin/AdminProductsManager.tsx");
const productEditor = read("components/admin/ProductDetailEditor.tsx");
const productBuilder = read("components/admin/AdminProductBuilder.tsx");
const productForm = read("components/admin/AdminProductForm.tsx");
const productPreview = read("components/admin/ProductDetailPreview.tsx");
const ordersManager = read("components/admin/AdminOrdersManager.tsx");
const productsApi = read("app/api/admin/products/route.ts");
const slugHelper = read("lib/products/slug.ts");
const adminDashboard = read("app/admin/page.tsx");
const adminLayout = read("components/admin/AdminLayout.tsx");
const opsPlaceholder = read("components/admin/AdminOperationsPlaceholder.tsx");
const statsPage = read("app/admin/stats/page.tsx");
const membersPage = read("app/admin/members/page.tsx");
const reviewsPage = read("app/admin/reviews/page.tsx");
const opsPages = [
  "app/admin/members/page.tsx",
  "app/admin/reviews/page.tsx",
  "app/admin/marketing/page.tsx",
  "app/admin/content/page.tsx",
  "app/admin/stats/page.tsx",
  "app/admin/automation/page.tsx"
].map(read).join("\n");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(productsManager.includes("QualityFilter"), "admin product quality filter is missing");
assert(productsManager.includes("SortMode"), "admin product sort mode is missing");
assert(productsManager.includes("quality-low"), "admin product low-quality sort is missing");
assert(productsManager.includes("stock-low"), "admin product stock sort is missing");
assert(productsManager.includes("copyDetailUrl"), "admin product detail URL copy action is missing");
assert(productsManager.includes("duplicateProduct"), "admin product duplicate action is missing");
assert(productsManager.includes("createCopySlug"), "admin product copy slug generator is missing");
assert(productsManager.includes("recoverVerificationProducts"), "admin hidden verification product recovery action is missing");
assert(productEditor.includes("handlePaste"), "admin pasted image upload handler is missing");
assert(productEditor.includes("clipboardData.files"), "admin pasted image upload does not read clipboard files");
assert(productBuilder.includes("SEO"), "admin quality score does not include SEO readiness");
assert(productBuilder.includes("productSlug"), "admin submit result should expose created product slug");
assert(productPreview.includes("ProductDetailTemplate"), "admin preview should render the real product detail template");
assert(productPreview.includes("PreviewPurchaseSlot"), "admin preview should use a safe preview purchase slot");
assert(ordersManager.includes("downloadFilteredOrders"), "admin order CSV download action is missing");
assert(ordersManager.includes("text/csv"), "admin order download should generate CSV");
assert(productForm.includes("pado-admin-last-created-product"), "admin create flow should remember last created product");
assert(productsApi.includes("createProductSlug"), "admin product create API should normalize slugs");
assert(productsApi.includes("DUPLICATE_SLUG"), "admin product create API should return duplicate slug errors");
assert(slugHelper.includes("wando-live-abalone"), "slug helper should generate known English product slugs");

assert(adminDashboard.includes("admin-kpi-grid"), "admin dashboard KPI grid is missing");
assert(adminDashboard.includes("오늘 주문"), "admin dashboard today order metric is missing");
assert(adminDashboard.includes("오늘 매출"), "admin dashboard today revenue metric is missing");
assert(adminDashboard.includes("이번달 매출"), "admin dashboard monthly revenue metric is missing");
assert(adminDashboard.includes("취소"), "admin dashboard cancellation metric is missing");
assert(adminDashboard.includes("환불"), "admin dashboard refund metric is missing");
assert(adminDashboard.includes("배송 준비"), "admin dashboard delivery-ready metric is missing");
assert(adminDashboard.includes("배송 중"), "admin dashboard shipped metric is missing");
assert(adminDashboard.includes("배송 완료"), "admin dashboard delivered metric is missing");
assert(adminDashboard.includes("품절 임박"), "admin dashboard low-stock metric is missing");
assert(adminDashboard.includes("최근 7일 주문·매출 추이"), "admin dashboard 7-day trend is missing");
assert(adminDashboard.includes("재고 예측"), "admin dashboard stock forecast is missing");
assert(adminDashboard.includes("상품별 판매량"), "admin dashboard product sales ranking is missing");
assert(adminDashboard.includes("profiles"), "admin dashboard member count check is missing");

["/admin/members", "/admin/reviews", "/admin/marketing", "/admin/content", "/admin/stats", "/admin/automation"].forEach((href) => {
  assert(adminLayout.includes(href), `admin sidebar route is missing: ${href}`);
});
assert(adminLayout.includes("admin-mobile-nav"), "admin mobile navigation is missing");
assert(opsPlaceholder.includes("admin-ops-grid"), "admin operation placeholder grid is missing");
assert(opsPages.includes("회원 관리"), "admin members page is missing");
assert(opsPages.includes("리뷰 관리"), "admin reviews page is missing");
assert(opsPages.includes("쿠폰") || opsPages.includes("배너"), "admin marketing page is missing");
assert(opsPages.includes("FAQ"), "admin content page is missing");
assert(opsPages.includes("통계") || statsPage.includes("rankProducts"), "admin stats page is missing");
assert(statsPage.includes("rankProducts"), "admin stats product ranking is missing");
assert(statsPage.includes("rankCategories"), "admin stats category ranking is missing");
assert(membersPage.includes("profiles"), "admin members page should read profiles");
assert(reviewsPage.includes("getReviewReadiness"), "admin reviews readiness check is missing");

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
        "operation-dashboard-trends",
        "operation-dashboard-stock-forecast",
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
