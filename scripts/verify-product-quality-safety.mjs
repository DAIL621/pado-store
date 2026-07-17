import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

const source = fs.readFileSync("lib/products/quality.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const quality = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const malformedDetails = [
  undefined,
  null,
  "invalid-json-shape",
  {},
  { heroImages: null, benefits: {}, journey: "bad", packaging: null, recipes: {}, components: null, faq: undefined, videos: null },
  { detailDisplayMode: "legacy", legacyDetailImages: [{ url: "/legacy.jpg" }] },
  { heroImages: [{ url: "/hero.jpg" }], benefits: ["a", "b", "c"], journey: [{ description: "a" }, { image: "b" }, { description: "c" }], packaging: ["a", "b", "c"], recipes: [{ title: "조리" }], components: ["상품"], faq: [{ question: "Q" }], videos: [] },
];

for (const detail of malformedDetails) {
  const result = quality.calculateDetailPageQuality(detail);
  assert(Number.isFinite(result.score) && result.score >= 0 && result.score <= 100);
  assert(Array.isArray(result.missing));
}
assert.equal(quality.calculateDetailPageQuality({ detailDisplayMode: "legacy", legacyDetailImages: [{ url: "/legacy.jpg" }] }).score, 100);

const productShapes = [
  undefined,
  null,
  {},
  { options: null, detail: null },
  { options: "bad", detail: { heroImages: {}, packaging: "bad" } },
  { name: "숨김 테스트", isActive: false, detail: { operationState: "hidden" } },
  { name: "삭제 상품", isActive: false, detail: { operationState: "deleted" } },
  { name: "운영상품", slug: "live", origin: "목포", category: "갈치", subtitle: "설명", basePrice: 20000, imageUrl: "/a.jpg", isActive: true, options: [{ name: "기본", price: 20000, regularPrice: 25000, stock: 1 }], detail: malformedDetails[6] },
];
for (const product of productShapes) {
  const result = quality.calculateProductCompleteness(product);
  assert(Number.isFinite(result.score) && result.score >= 0 && result.score <= 100);
  assert(Array.isArray(result.missing));
}

console.log(JSON.stringify({ ok: true, checks: ["missing-detail", "null-detail", "malformed-arrays", "missing-faq", "missing-video", "missing-image", "legacy-only", "new-detail", "hidden-product", "deleted-product", "live-product"] }, null, 2));
