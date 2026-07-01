import fs from "node:fs";

const source = fs.readFileSync("app/products/[slug]/page.tsx", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const robots = fs.readFileSync("app/robots.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(source.includes("buildSeoDescription"), "product SEO description builder is missing");
assert(source.includes("alternates"), "canonical metadata is missing");
assert(source.includes('"@type": "Product"'), "Product JSON-LD schema is missing");
assert(source.includes('"@type": "BreadcrumbList"'), "Breadcrumb JSON-LD schema is missing");
assert(source.includes("availability"), "Product offer availability schema is missing");
assert(source.includes("application/ld+json"), "JSON-LD script renderer is missing");
assert(sitemap.includes("getProducts"), "sitemap should include product URLs");
assert(sitemap.includes("/products/"), "sitemap product detail URL builder is missing");
assert(robots.includes("/admin"), "robots should disallow admin pages");
assert(robots.includes("/api/"), "robots should disallow API routes");
assert(robots.includes("/dev-admin-login"), "robots should disallow dev admin login");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: ["metadata", "canonical", "product-json-ld", "breadcrumb-json-ld", "sitemap-products", "robots-private-routes"]
    },
    null,
    2
  )
);
