import { DEFAULT_PACKAGING, JOURNEY_STEPS, type ProductDetail } from "@/lib/products/detail";

type ProductDraftSeed = {
  name: string;
  origin: string;
  category?: string;
};

function productKind(seed: ProductDraftSeed) {
  const text = `${seed.name} ${seed.category ?? ""}`.toLowerCase();
  if (/전복|abalone/.test(text)) return "전복";
  if (/장어|아나고|eel/.test(text)) return "장어";
  if (/소라|굴|조개|conch|oyster/.test(text)) return "조개류";
  if (/갈치|고등어|홍어|새우|fish/.test(text)) return "생선";
  if (/죽|미역국|밀키트|kit/.test(text)) return "밀키트";
  if (/선물|세트|gift/.test(text)) return "선물세트";
  return "수산물";
}

export function generateProductDescription(seed: ProductDraftSeed) {
  const name = seed.name || "신규 상품";
  const origin = seed.origin || "산지";
  const kind = productKind(seed);
  return `${origin}에서 준비한 ${name}입니다. ${kind} 특성에 맞춰 산지 선별, 신선 포장, 빠른 출고 기준으로 관리해 고객 식탁까지 안정적으로 보내드립니다.`;
}

export function generateAdvantages(seed: ProductDraftSeed) {
  const origin = seed.origin || "산지";
  const kind = productKind(seed);
  const kindBenefit: Record<string, string> = {
    전복: "활전복 상태에 맞춘 산소포장",
    장어: "손질 부담을 줄인 조리 편의성",
    조개류: "크기와 신선도 기준 선별",
    생선: "구이와 조림에 좋은 손질 구성",
    밀키트: "집에서 간편하게 완성하는 구성",
    선물세트: "받는 분을 고려한 단정한 포장",
    수산물: "상품 특성에 맞춘 신선 포장"
  };

  return [
    `${origin} 산지 기준 선별`,
    kindBenefit[kind],
    "평일 오후 1시 이전 주문 당일 출고",
    "아이스팩 동봉 냉장 포장",
    "수령 후 바로 확인 가능한 구성"
  ];
}

export function generateFAQ(seed: ProductDraftSeed) {
  const name = seed.name || "상품";
  return [
    {
      question: "언제 출고되나요?",
      answer: "평일 오후 1시 이전 주문 건은 당일 출고를 기준으로 운영합니다. 산지 상황이나 택배사 사정에 따라 변동될 수 있습니다."
    },
    {
      question: `${name}는 어떻게 보관하나요?`,
      answer: "수령 후 바로 상태를 확인하고 냉장 보관해주세요. 가능한 빠른 섭취를 권장합니다."
    },
    {
      question: "배송 중 신선도는 괜찮나요?",
      answer: "상품 특성에 맞춰 아이스팩과 보냉 포장을 사용해 신선도를 유지하도록 준비합니다."
    }
  ];
}

export function generateCookingGuide(seed: ProductDraftSeed) {
  const name = seed.name || "상품";
  const kind = productKind(seed);
  const guideByKind: Record<string, Array<{ title: string; description: string; image: string }>> = {
    전복: [
      { title: "전복버터구이", description: "버터와 마늘을 넣고 노릇하게 구우면 전복의 풍미가 살아납니다.", image: "" },
      { title: "전복죽", description: "쌀과 함께 천천히 끓이면 고소하고 깊은 맛을 즐길 수 있습니다.", image: "" }
    ],
    장어: [
      { title: "장어구이", description: "중불에서 앞뒤로 구워 소스나 소금과 함께 즐기세요.", image: "" },
      { title: "장어덮밥", description: "따뜻한 밥 위에 구운 장어를 올리면 든든한 한 끼가 됩니다.", image: "" }
    ],
    조개류: [
      { title: "숙회", description: "살짝 데친 뒤 초장이나 간장 소스와 함께 드세요.", image: "" },
      { title: "찜/탕", description: "채소와 함께 끓이면 시원한 감칠맛을 즐길 수 있습니다.", image: "" }
    ],
    생선: [
      { title: "구이", description: "물기를 제거한 뒤 팬이나 에어프라이어에 노릇하게 구워 드세요.", image: "" },
      { title: "조림", description: "무와 양념을 넣고 졸이면 밥반찬으로 좋습니다.", image: "" }
    ],
    밀키트: [
      { title: "기본 조리", description: "동봉된 안내에 따라 끓이거나 데우면 간편하게 완성됩니다.", image: "" },
      { title: "풍미 더하기", description: "기호에 따라 마늘, 대파, 참기름을 더하면 좋습니다.", image: "" }
    ],
    선물세트: [
      { title: "수령 후 확인", description: "구성품과 포장 상태를 먼저 확인하고 냉장 보관해주세요.", image: "" },
      { title: "선물 활용", description: "받는 분께 보관법과 추천 조리법을 함께 안내하면 좋습니다.", image: "" }
    ],
    수산물: [{ title: `${name} 기본 조리`, description: "상품에 맞는 방식으로 가볍게 익히거나 손질해 즐겨주세요.", image: "" }]
  };

  return guideByKind[kind];
}

export function generateOriginStory(seed: ProductDraftSeed) {
  const origin = seed.origin || "산지";
  const name = seed.name || "상품";
  return JOURNEY_STEPS.map((step) => ({
    key: step.key,
    title: step.title,
    image: "",
    description:
      step.key === "origin"
        ? `${origin}에서 ${name}를 준비합니다.`
        : step.key === "sorting"
          ? "상태와 구성 기준을 확인해 좋은 상품만 선별합니다."
          : step.key === "packing"
            ? "상품 특성에 맞춰 아이스팩과 보냉 포장으로 준비합니다."
            : step.key === "delivery"
              ? "평일 오후 1시 이전 주문은 당일 출고를 기준으로 운영합니다."
              : "수령 후 바로 상태를 확인하고 가장 맛있는 때에 즐겨주세요."
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
