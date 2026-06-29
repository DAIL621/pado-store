import { DEFAULT_PACKAGING, JOURNEY_STEPS, type ProductDetail } from "@/lib/products/detail";

type ProductDraftSeed = {
  name: string;
  origin: string;
  category?: string;
};

export function generateProductDescription(seed: ProductDraftSeed) {
  const name = seed.name || "상품";
  const origin = seed.origin || "산지";
  return `${origin}에서 준비한 ${name}입니다. 산지 선별과 신선 포장을 거쳐 고객 식탁까지 안정적으로 보내드립니다.`;
}

export function generateAdvantages(seed: ProductDraftSeed) {
  const origin = seed.origin || "산지";
  return [`${origin} 산지 선별`, "당일 포장", "냉장 신선 배송", "오후 1시 이전 주문 당일 출고", "신선도 확인 후 발송"];
}

export function generateFAQ(seed: ProductDraftSeed) {
  const name = seed.name || "상품";
  return [
    {
      question: "언제 출고되나요?",
      answer: "평일 오후 1시 이전 주문 건은 당일 출고됩니다."
    },
    {
      question: `${name}은 어떻게 보관하나요?`,
      answer: "수령 후 바로 냉장 보관하고 가능한 빠르게 드시는 것을 권장합니다."
    }
  ];
}

export function generateCookingGuide(seed: ProductDraftSeed) {
  const name = seed.name || "상품";
  return [
    {
      title: `${name} 기본 조리`,
      description: "가볍게 세척한 뒤 구이, 찜, 탕 등 상품에 맞는 방식으로 조리해 드세요.",
      image: ""
    }
  ];
}

export function generateOriginStory(seed: ProductDraftSeed) {
  const origin = seed.origin || "산지";
  return JOURNEY_STEPS.map((step) => ({
    key: step.key,
    title: step.title,
    image: "",
    description: step.key === "origin" ? `${origin}에서 상품을 준비합니다.` : `${step.title} 과정을 거쳐 신선하게 전달합니다.`
  }));
}

export function generateShippingText() {
  return [...DEFAULT_PACKAGING];
}

export function generateProductDetailDraft(seed: ProductDraftSeed): Pick<ProductDetail, "benefits" | "journey" | "packaging" | "recipes" | "faq"> {
  return {
    benefits: generateAdvantages(seed),
    journey: generateOriginStory(seed),
    packaging: generateShippingText(),
    recipes: generateCookingGuide(seed),
    faq: generateFAQ(seed)
  };
}
