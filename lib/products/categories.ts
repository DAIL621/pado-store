import type { Product } from "@/data/products";
import { normalizeProductCategory } from "@/lib/products/discovery";

export type CategoryPageDefinition = {
  slug: string;
  label: string;
  headline: string;
  description: string;
  keywords: string[];
};

export const CATEGORY_PAGES: CategoryPageDefinition[] = [
  {
    slug: "abalone",
    label: "전복",
    headline: "완도 활전복을 가장 먼저 확인하세요",
    description: "활도, 크기, 포장 상태를 기준으로 고르기 쉬운 전복 상품을 모았습니다.",
    keywords: ["전복", "활전복", "abalone"]
  },
  {
    slug: "eel",
    label: "장어",
    headline: "손질 부담을 줄인 장어 상품",
    description: "구이와 보양식으로 활용하기 좋은 바다장어와 아나고 상품을 확인하세요.",
    keywords: ["장어", "아나고", "eel"]
  },
  {
    slug: "octopus",
    label: "문어",
    headline: "문어 상품 준비중",
    description: "문어 상품은 준비되는 즉시 이 카테고리에 자동으로 노출됩니다.",
    keywords: ["문어", "octopus"]
  },
  {
    slug: "oyster",
    label: "굴·조개",
    headline: "통영의 제철 조개류",
    description: "굴, 참소라 등 식감과 신선도가 중요한 조개류 상품을 모았습니다.",
    keywords: ["굴", "소라", "조개", "oyster", "conch", "shell"]
  },
  {
    slug: "fish",
    label: "생선",
    headline: "구이와 조림에 좋은 생선",
    description: "갈치, 고등어, 홍어 등 가정식에 어울리는 생선 상품을 확인하세요.",
    keywords: ["생선", "갈치", "고등어", "홍어", "fish"]
  },
  {
    slug: "shrimp",
    label: "새우",
    headline: "구이와 찜에 좋은 새우",
    description: "식감과 크기감을 기준으로 고르기 좋은 새우 상품을 준비합니다.",
    keywords: ["새우", "shrimp"]
  },
  {
    slug: "gift-set",
    label: "선물세트",
    headline: "감사의 마음을 전하는 선물세트",
    description: "포장과 구성 완성도를 기준으로 선물하기 좋은 상품을 모았습니다.",
    keywords: ["선물", "세트", "gift"]
  },
  {
    slug: "meal-kit",
    label: "밀키트",
    headline: "간편하게 즐기는 수산 밀키트",
    description: "전복죽, 전복미역국처럼 조리 부담을 줄인 간편식 상품입니다.",
    keywords: ["밀키트", "죽", "미역국", "meal", "kit"]
  }
];

export function getCategoryPage(slug: string) {
  return CATEGORY_PAGES.find((category) => category.slug === slug);
}

export function getProductsForCategoryPage(products: Product[], categorySlug: string) {
  const target = categorySlug === "gift-set" ? "gift" : categorySlug;
  if (categorySlug === "octopus") {
    return products.filter((product) => /문어|octopus/i.test(`${product.name} ${product.category} ${product.slug}`));
  }
  if (categorySlug === "oyster") {
    return products.filter((product) => normalizeProductCategory(`${product.name} ${product.category} ${product.slug}`) === "shellfish");
  }
  return products.filter((product) => normalizeProductCategory(`${product.name} ${product.category} ${product.slug}`) === target);
}
