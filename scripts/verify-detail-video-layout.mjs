import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const [css, template, detail] = await Promise.all([read("app/globals.css"), read("components/products/ProductDetailTemplate.tsx"), read("lib/products/detail.ts")]);
assert(css.includes(".detail-video-section{width:min(100%,1040px)") && css.includes("aspect-ratio:16/9"), "video wrapper ratio/width missing");
assert(css.includes(".detail-video-section.embedded{width:100%;margin:0;padding:0}"), "embedded video alignment missing");
assert(template.includes("videosAt(index + 1)") && template.includes("embedded"), "video/image interleaving missing");
assert(detail.includes('placement?: "top" | "between" | "bottom"') && detail.includes("legacyImageIndex"), "video position persistence missing");
console.log(JSON.stringify({ok:true,checks:["content-width","16:9","embedded-alignment","responsive","position-persistence"]},null,2));
