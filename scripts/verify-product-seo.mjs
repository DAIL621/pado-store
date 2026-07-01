import fs from "node:fs";

const source = fs.readFileSync("app/products/[slug]/page.tsx", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(source.includes("buildSeoDescription"), "product SEO description builder is missing");
assert(source.includes("alternates"), "canonical metadata is missing");
assert(source.includes('"@type": "Product"'), "Product JSON-LD schema is missing");
assert(source.includes('"@type": "BreadcrumbList"'), "Breadcrumb JSON-LD schema is missing");
assert(source.includes("availability"), "Product offer availability schema is missing");
assert(source.includes("application/ld+json"), "JSON-LD script renderer is missing");

console.log(JSON.stringify({ ok: true, checks: ["metadata", "canonical", "product-json-ld", "breadcrumb-json-ld"] }, null, 2));
