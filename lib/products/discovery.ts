import type { Product } from "@/data/products";

export type ProductShelf = {
  key: string;
  title: string;
  description: string;
  products: Product[];
};

export function getTotalStock(product: Product) {
  return product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
}

export function normalizeProductCategory(value: string) {
  const text = value.toLowerCase();
  if (/전복|abalone/.test(text)) return "abalone";
  if (/장어|아나고|eel/.test(text)) return "eel";
  if (/소라|굴|조개|conch|oyster|shell/.test(text)) return "shellfish";
  if (/새우|shrimp/.test(text)) return "shrimp";
  if (/선물|gift|세트/.test(text)) return "gift";
  if (/밀키트|죽|미역국|meal|kit|porridge|soup/.test(text)) return "meal-kit";
  if (/생선|갈치|고등어|홍어|fish|hairtail|mackerel/.test(text)) return "fish";
  return "all";
}

export function matchesProductSearch(product: Product, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;
  return [product.name, product.origin, product.category, product.subtitle, product.badge, product.slug]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword));
}

export function getBestProducts(products: Product[], limit = 4) {
  return [...products]
    .sort((a, b) => {
      const stockDiff = Number(getTotalStock(b) > 0) - Number(getTotalStock(a) > 0);
      if (stockDiff) return stockDiff;
      const badgeDiff = Number(Boolean(b.badge)) - Number(Boolean(a.badge));
      if (badgeDiff) return badgeDiff;
      return b.discountRate - a.discountRate;
    })
    .slice(0, limit);
}

export function getMdPickProducts(products: Product[], limit = 4) {
  const priority = ["wando-live-abalone", "tongyeong-conch", "tongyeong-sea-eel", "pado-gift-set"];
  return [
    ...priority.map((slug) => products.find((product) => product.slug === slug)).filter(Boolean),
    ...products
  ]
    .filter((product, index, list): product is Product => Boolean(product) && list.findIndex((item) => item?.slug === product?.slug) === index)
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, products: Product[], limit = 3) {
  const currentKind = normalizeProductCategory(`${product.category} ${product.name} ${product.slug}`);
  return products
    .filter((item) => item.slug !== product.slug)
    .map((item) => {
      const kind = normalizeProductCategory(`${item.category} ${item.name} ${item.slug}`);
      const score =
        (kind === currentKind ? 4 : 0) +
        (item.origin === product.origin ? 2 : 0) +
        (item.discountRate > 0 ? 1 : 0) +
        (getTotalStock(item) > 0 ? 1 : 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, limit);
}

export function buildHomeShelves(products: Product[]): ProductShelf[] {
  const best = getBestProducts(products, 4);
  const md = getMdPickProducts(products, 4);
  const gift = products.filter((product) => normalizeProductCategory(`${product.category} ${product.name}`) === "gift").slice(0, 4);
  const meal = products.filter((product) => normalizeProductCategory(`${product.category} ${product.name}`) === "meal-kit").slice(0, 4);

  return [
    {
      key: "best",
      title: "오늘 가장 많이 찾는 상품",
      description: "할인율, 재고, 인기 배지를 기준으로 먼저 보여드립니다.",
      products: best
    },
    {
      key: "md",
      title: "MD 추천 수산물",
      description: "처음 방문한 고객도 고르기 쉬운 대표 상품입니다.",
      products: md
    },
    {
      key: "gift",
      title: "선물하기 좋은 구성",
      description: "감사 인사와 명절 선물에 어울리는 상품입니다.",
      products: gift.length ? gift : md
    },
    {
      key: "meal",
      title: "간편하게 즐기는 한 끼",
      description: "조리 부담을 줄인 밀키트와 간편식 상품입니다.",
      products: meal.length ? meal : best
    }
  ];
}
