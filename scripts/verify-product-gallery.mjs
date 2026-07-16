import fs from "node:fs";

const gallery = fs.readFileSync("components/products/ProductHeroGallery.tsx", "utf8");
const template = fs.readFileSync("components/products/ProductDetailTemplate.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");
const checks = {
  "click-selection": /onClick=.*setSelectedIndex/s.test(gallery),
  "hover-preview": /pointerType === "mouse".*setPreviewIndex/s.test(gallery),
  "hover-restore": /onPointerLeave=.*setPreviewIndex\(null\)/s.test(gallery),
  "selected-border": /button\.active.*border:2px solid/s.test(css),
  "mobile-touch": /@media\(max-width:640px\).*min-height:78px/s.test(css),
  accessibility: /aria-pressed=/.test(gallery) && /aria-label=/.test(gallery) && /focus-visible/.test(css),
  "deduplicated-images": /seen\.has\(image\.url\)/.test(gallery),
  "empty-image-fallback": /gallery\.length \? gallery :/.test(gallery),
  integrated: /<ProductHeroGallery/.test(template)
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) { console.error(JSON.stringify({ ok: false, failed }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, checks: Object.keys(checks) }, null, 2));
