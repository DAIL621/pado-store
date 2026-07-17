import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

const loadTs = async (path) => {
  const output = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};
const pricing = await loadTs("lib/products/option-pricing.ts");

const inputs = [
  { name: "1kg", price: 20500, regular_price: 25000, coupang_price: 26000 },
  { name: "1.7kg", price: 28000, regular_price: null, coupang_price: null },
];
const detail = pricing.withOptionPriceMetadata({ heroImages: [] }, inputs);
assert.deepEqual(pricing.readOptionPriceMetadata(detail), [
  { name: "1kg", price: 20500, regularPrice: 25000, coupangPrice: 26000 },
  { name: "1.7kg", price: 28000, regularPrice: null, coupangPrice: null },
]);
assert.deepEqual(pricing.mapStoredOptionToPrices({ name: "1kg", price_delta: 0 }, 20500, detail, 0), { price: 20500, regularPrice: 25000, coupangPrice: 26000 });
assert.deepEqual(pricing.mapStoredOptionToPrices({ name: "1.7kg", price_delta: 7500 }, 20500, {}, 1), { price: 28000, regularPrice: null, coupangPrice: null });

const createRoute = fs.readFileSync("app/api/admin/products/route.ts", "utf8");
const updateRoute = fs.readFileSync("app/api/admin/products/[id]/route.ts", "utf8");
const manager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const customer = fs.readFileSync("lib/products.ts", "utf8");
assert(createRoute.includes("withOptionPriceMetadata") && updateRoute.includes("withOptionPriceMetadata"), "create/update APIs must persist fallback price metadata");
assert(manager.includes("mapStoredOptionToPrices"), "edit initial values must restore stored price metadata");
assert(customer.includes("mapStoredOptionToPrices"), "customer product mapping must restore stored comparison prices");

console.log(JSON.stringify({ ok: true, checks: ["form-to-storage", "storage-to-form", "legacy-sale-price", "regular-price-roundtrip", "coupang-price-roundtrip", "null-vs-zero", "create-api", "update-api", "customer-mapping"] }, null, 2));
