import fs from "node:fs";
import assert from "node:assert/strict";

const products = fs.readFileSync("lib/products.ts", "utf8");
const publicSlug = fs.readFileSync("lib/products/public-slug.ts", "utf8");
const home = fs.readFileSync("app/page.tsx", "utf8");
const hero = fs.readFileSync("components/home/Hero.tsx", "utf8");
const sections = fs.readFileSync("components/home/HomeSections.tsx", "utf8");
const cart = fs.readFileSync("app/cart/page.tsx", "utf8");
const manager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const builder = fs.readFileSync("components/admin/AdminProductBuilder.tsx", "utf8");
const quality = fs.readFileSync("lib/products/quality.ts", "utf8");
const productRoute = fs.readFileSync("app/api/admin/products/[id]/route.ts", "utf8");

assert(products.includes('process.env.ENABLE_DEMO_PRODUCTS === "true"'), "demo products must be explicitly enabled");
assert(!products.includes("missingFallbackProducts"), "DB products must not be merged with sample products");
for (const state of ["deleted", "hidden", "ended"]) assert(products.includes(`state !== \"${state}\"`), `customer filter must exclude ${state}`);
for (const marker of ["test", "verification", "diagnose", "e2e", "duplicate"]) assert(publicSlug.includes(marker), `public slug filter is missing ${marker}`);
assert(home.includes("await getProducts()") && home.includes("<Hero products={products}") && home.includes("<HomeSections products={products}"), "home must use the shared DB product source");
assert(!hero.includes("import { products }") && !sections.includes("import { products }"), "home components must not import sample product values");
assert(!cart.includes("import { formatPrice, products }") && !cart.includes("recommendedProducts.map"), "cart must not expose sample recommendations");
assert(quality.includes("calculateProductCompleteness") && quality.includes("calculateDetailPageQuality"), "shared completeness calculators are missing");
assert(manager.includes("calculateProductCompleteness") && builder.includes("calculateProductCompleteness"), "list and editor must share product completeness calculation");
assert(manager.includes("미입력:") && manager.includes("상품 등록 완성도"), "admin list must explain incomplete fields");
assert(productRoute.includes('revalidatePath("/", "layout")'), "product mutations must invalidate customer pages");

console.log(JSON.stringify({ok:true,checks:["db-source-only","explicit-demo-flag","public-state-filter","test-filter","home-sync","shared-completeness","missing-items","cache-invalidation"]},null,2));
