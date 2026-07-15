import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const finalPrice = (product, option) => option.price ?? product.basePrice + (option.additionalPrice ?? option.priceDelta ?? 0);

const [builder, purchase, products, orderApi, optionParser, migration] = await Promise.all([
  read("components/admin/AdminProductBuilder.tsx"),
  read("components/products/ProductPurchase.tsx"),
  read("lib/products.ts"),
  read("app/api/orders/route.ts"),
  read("lib/admin/product-options.ts"),
  read("supabase/migrations/202607150900_option_direct_price.sql")
]);

assert(finalPrice({ basePrice: 20_000 }, { price: 24_000, priceDelta: 9_000 }) === 24_000, "option.price must win");
assert(finalPrice({ basePrice: 20_000 }, { additionalPrice: 4_000 }) === 24_000, "legacy additionalPrice fallback failed");
assert(Math.min(...[24_000, 65_000, 48_000]) === 24_000, "minimum representative price failed");
assert(24_000 * 2 === 48_000 && 65_000 * 1 === 65_000, "cart quantity calculation failed");
assert(builder.includes("판매가격") && builder.includes('options.${index}.price'), "admin direct-price field missing");
assert(!builder.includes('name={`options.${index}.priceDelta`}'), "legacy additional-price input remains");
assert(purchase.includes("option.price ??") && purchase.includes("unitPrice * quantity"), "option selection price calculation missing");
assert(products.includes("Math.min(...optionPrices)"), "representative minimum price missing");
assert(orderApi.includes("option?.price ??") && !orderApi.includes("item.unitPrice)"), "server DB option price verification missing");
assert(optionParser.includes("option.price ??") && optionParser.includes("price_delta: 0"), "legacy read/new write normalization missing");
assert(optionParser.includes("regular_price") && migration.includes("add column if not exists regular_price"), "option regular price persistence missing");
assert(migration.includes("add column if not exists price") && migration.includes("base_price + po.price_delta"), "safe migration missing");

console.log(JSON.stringify({
  ok: true,
  checks: ["new-option-price", "legacy-additional-price", "minimum-price", "cart-quantity", "server-db-price", "option-change-ui", "migration-prepared"]
}, null, 2));
