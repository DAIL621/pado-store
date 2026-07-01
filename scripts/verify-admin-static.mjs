import fs from "node:fs";

const productsManager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const productEditor = fs.readFileSync("components/admin/ProductDetailEditor.tsx", "utf8");
const productBuilder = fs.readFileSync("components/admin/AdminProductBuilder.tsx", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(productsManager.includes("QualityFilter"), "admin product quality filter is missing");
assert(productsManager.includes("SortMode"), "admin product sort mode is missing");
assert(productsManager.includes("quality-low"), "admin product low-quality sort is missing");
assert(productsManager.includes("stock-low"), "admin product stock sort is missing");
assert(productEditor.includes("handlePaste"), "admin pasted image upload handler is missing");
assert(productEditor.includes("clipboardData.files"), "admin pasted image upload does not read clipboard files");
assert(productBuilder.includes("가격/재고"), "admin quality score does not include price/stock readiness");
assert(productBuilder.includes("SEO"), "admin quality score does not include SEO readiness");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: ["product-list-filter", "product-list-sort", "pasted-image-upload", "quality-score-readiness"]
    },
    null,
    2
  )
);
