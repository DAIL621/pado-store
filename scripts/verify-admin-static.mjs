import fs from "node:fs";

const productsManager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const productEditor = fs.readFileSync("components/admin/ProductDetailEditor.tsx", "utf8");
const productBuilder = fs.readFileSync("components/admin/AdminProductBuilder.tsx", "utf8");
const productForm = fs.readFileSync("components/admin/AdminProductForm.tsx", "utf8");
const productPreview = fs.readFileSync("components/admin/ProductDetailPreview.tsx", "utf8");
const productsApi = fs.readFileSync("app/api/admin/products/route.ts", "utf8");
const slugHelper = fs.readFileSync("lib/products/slug.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(productsManager.includes("QualityFilter"), "admin product quality filter is missing");
assert(productsManager.includes("SortMode"), "admin product sort mode is missing");
assert(productsManager.includes("quality-low"), "admin product low-quality sort is missing");
assert(productsManager.includes("stock-low"), "admin product stock sort is missing");
assert(productsManager.includes("copyDetailUrl"), "admin product detail URL copy action is missing");
assert(productsManager.includes("URL 복사"), "admin product detail URL copy button is missing");
assert(productEditor.includes("handlePaste"), "admin pasted image upload handler is missing");
assert(productEditor.includes("clipboardData.files"), "admin pasted image upload does not read clipboard files");
assert(productBuilder.includes("가격/재고"), "admin quality score does not include price/stock readiness");
assert(productBuilder.includes("SEO"), "admin quality score does not include SEO readiness");
assert(productBuilder.includes("상품 등록완료"), "admin submit button should show completed state after save");
assert(productBuilder.includes("productSlug"), "admin submit result should expose created product slug");
assert(productPreview.includes("ProductDetailTemplate"), "admin preview should render the real product detail template");
assert(productPreview.includes("PreviewPurchaseSlot"), "admin preview should use a safe preview purchase slot");
assert(productForm.includes("pado-admin-last-created-product"), "admin create flow should remember last created product");
assert(productsApi.includes("createProductSlug"), "admin product create API should normalize slugs");
assert(productsApi.includes("DUPLICATE_SLUG"), "admin product create API should return duplicate slug errors");
assert(slugHelper.includes("wando-live-abalone"), "slug helper should generate known English product slugs");

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
        "detail-url-copy"
      ]
    },
    null,
    2
  )
);
