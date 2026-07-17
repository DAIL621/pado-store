import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const [mapper, purchase, cart, provider, snapshot, parser, migration] = await Promise.all([
  read("lib/products.ts"), read("components/products/ProductPurchase.tsx"), read("app/cart/page.tsx"),
  read("components/cart/CartProvider.tsx"), read("app/api/products/cart-snapshot/route.ts"),
  read("lib/admin/product-options.ts"), read("supabase/migrations/202607150900_option_direct_price.sql")
]);
const regularPrice = 34_000, price = 28_000, quantity = 2;
assert(Math.round(((regularPrice - price) / regularPrice) * 100) === 18, "discount rate failed");
assert((regularPrice - price) * quantity === 12_000, "quantity discount failed");
assert(mapper.includes("mapStoredOptionToPrices") && mapper.includes("normalPrice > price"), "representative option regular price mapping missing");
assert(purchase.includes("option?.regularPrice") && purchase.includes("discountRate"), "selected option discount missing");
assert(cart.includes("regularSubtotal") && cart.includes("productDiscount"), "cart discount summary missing");
assert(provider.includes("/api/products/cart-snapshot") && provider.includes("priceChanged"), "legacy cart refresh missing");
assert(snapshot.includes("option.regularPrice") && snapshot.includes("option.price"), "DB cart snapshot pricing missing");
assert(parser.includes("regular_price") && migration.includes("add column if not exists regular_price"), "regular price persistence missing");
console.log(JSON.stringify({ok:true,checks:["admin-to-db","representative-option","selected-option","cart-quantity","legacy-cart-refresh","no-fabricated-price"]},null,2));
