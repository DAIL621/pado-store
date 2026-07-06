import fs from "node:fs";

const files = {
  hero: fs.readFileSync("components/home/Hero.tsx", "utf8"),
  header: fs.readFileSync("components/layout/Header.tsx", "utf8"),
  homeSections: fs.readFileSync("components/home/HomeSections.tsx", "utf8"),
  catalog: fs.readFileSync("components/products/ProductCatalog.tsx", "utf8"),
  categories: fs.readFileSync("lib/products/categories.ts", "utf8"),
  categoryPage: fs.readFileSync("app/categories/[category]/page.tsx", "utf8"),
  layout: fs.readFileSync("app/layout.tsx", "utf8"),
  bottomNav: fs.readFileSync("components/layout/MobileBottomNav.tsx", "utf8"),
  cartPage: fs.readFileSync("app/cart/page.tsx", "utf8"),
  sitemap: fs.readFileSync("app/sitemap.ts", "utf8"),
  recentViewed: fs.readFileSync("components/products/RecentViewedProducts.tsx", "utf8"),
  productDetail: fs.readFileSync("app/products/[slug]/page.tsx", "utf8")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredCategorySlugs = ["abalone", "eel", "octopus", "oyster", "fish", "shrimp", "gift-set", "meal-kit"];

for (const slug of requiredCategorySlugs) {
  assert(files.categories.includes(`slug: "${slug}"`), `category slug missing: ${slug}`);
  assert(files.categoryPage.includes("getProductsForCategoryPage"), "category page should use category product resolver");
}

assert(files.hero.includes("/categories/gift-set"), "home campaign gift-set should link to category page");
assert(files.hero.includes("/categories/meal-kit"), "home campaign meal-kit should link to category page");
assert(files.header.includes("/categories/gift-set"), "mobile menu gift-set should link to category page");
assert(files.header.includes("/categories/meal-kit"), "mobile menu meal-kit should link to category page");
assert(files.homeSections.includes("reviewHighlights"), "home review highlight section is missing");
assert(files.homeSections.includes("buildHomeShelves"), "home shopping shelves are missing");
assert(files.homeSections.includes("RecentViewedProducts"), "home recent viewed products section is missing");
assert(files.catalog.includes("useSearchParams"), "product catalog should support query param search");
assert(files.catalog.includes("pado_recent_searches"), "product catalog should store recent searches");
assert(files.catalog.includes("availableOnly"), "product catalog should support availability filtering");
assert(files.recentViewed.includes("pado_recent_products"), "recent viewed product storage key is missing");
assert(files.productDetail.includes("getRelatedProducts"), "product detail related recommendation is missing");
assert(files.productDetail.includes("RecentViewedTracker"), "product detail should track recently viewed products");
assert(files.sitemap.includes("CATEGORY_PAGES"), "sitemap should include category pages");
assert(files.layout.includes("MobileBottomNav"), "root layout should render mobile bottom navigation");
assert(files.bottomNav.includes("useCart"), "mobile bottom navigation should show real cart count");
assert(files.bottomNav.includes("/categories/gift-set"), "mobile bottom navigation should include a category shortcut");
assert(files.cartPage.includes("cart-empty-recommend"), "cart empty state should recommend products");
assert(files.cartPage.includes("getBestProducts"), "cart empty recommendations should use product discovery helper");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "category-pages",
        "category-sitemap",
        "home-campaign-category-links",
        "mobile-menu-category-links",
        "home-shopping-shelves",
        "home-review-highlights",
        "product-search",
        "availability-filter",
        "recent-viewed-products",
        "related-products",
        "mobile-bottom-navigation",
        "cart-empty-recommendations"
      ]
    },
    null,
    2
  )
);
