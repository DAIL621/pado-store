const knownProductSlugs: Array<[RegExp, string]> = [
  [/완도.*활?전복|전복.*완도/, "wando-live-abalone"],
  [/통영.*참소라|참소라.*통영/, "tongyeong-conch"],
  [/통영.*바다장어|바다장어.*통영/, "tongyeong-sea-eel"],
  [/통영.*삼배체굴|삼배체굴.*통영/, "tongyeong-triploid-oyster"],
  [/아나고/, "anago-sashimi"],
  [/홍어/, "fermented-skate"],
  [/새우/, "fresh-shrimp"],
  [/고등어/, "mackerel"],
  [/갈치/, "hairtail"],
  [/전복죽/, "abalone-porridge"],
  [/전복미역국/, "abalone-seaweed-soup"],
  [/선물세트|선물/, "seafood-gift-set"],
  [/밀키트/, "seafood-meal-kit"]
];

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createProductSlug(input: { slug?: unknown; name?: unknown; origin?: unknown }) {
  const explicitSlug = normalizeSlug(String(input.slug ?? ""));
  if (explicitSlug) return explicitSlug;

  const name = String(input.name ?? "").trim();
  const origin = String(input.origin ?? "").trim();
  const source = `${origin} ${name}`.trim();
  const known = knownProductSlugs.find(([pattern]) => pattern.test(source));
  if (known) return known[1];

  const asciiFromName = normalizeSlug(name);
  if (asciiFromName) return asciiFromName;

  return `pado-product-${Date.now().toString(36)}`;
}
