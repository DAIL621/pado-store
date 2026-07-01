import { DEFAULT_PACKAGING, JOURNEY_STEPS, type ProductDetail } from "@/lib/products/detail";

export type ProductPresetId =
  | "abalone"
  | "sea-eel"
  | "conch"
  | "hairtail"
  | "mackerel"
  | "mealkit"
  | "gift";

type ProductPresetSeed = {
  name: string;
  origin: string;
};

export type ProductDetailPreset = {
  id: ProductPresetId;
  label: string;
  description: string;
  form: {
    category: string;
    badge: string;
    subtitle: string;
    description: string;
    highlights: string;
  };
  options: { name: string; priceDelta: string; stock: string }[];
  detail: Pick<ProductDetail, "benefits" | "journey" | "packaging" | "recipes" | "components" | "faq">;
};

export const PRODUCT_DETAIL_PRESET_OPTIONS: Array<Pick<ProductDetailPreset, "id" | "label" | "description">> = [
  { id: "abalone", label: "완도 활전복", description: "활전복, 산소포장, 신선 출고" },
  { id: "sea-eel", label: "통영 바다장어", description: "손질 장어, 구이용, 당일 출고" },
  { id: "conch", label: "통영 참소라", description: "제철 소라, 삶음/숙회 추천" },
  { id: "hairtail", label: "먹갈치", description: "선물/구이용 갈치 구성" },
  { id: "mackerel", label: "간고등어", description: "손질 생선, 간편 구이" },
  { id: "mealkit", label: "밀키트", description: "전복죽, 미역국 등 간편 조리" },
  { id: "gift", label: "선물세트", description: "명절/감사 선물 구성" }
];

const defaultOriginByPreset: Record<ProductPresetId, string> = {
  abalone: "완도",
  "sea-eel": "통영",
  conch: "통영",
  hairtail: "목포",
  mackerel: "부산",
  mealkit: "통영",
  gift: "통영"
};

const defaultNameByPreset: Record<ProductPresetId, string> = {
  abalone: "완도 활전복",
  "sea-eel": "통영 바다장어",
  conch: "통영 참소라",
  hairtail: "먹갈치",
  mackerel: "간고등어",
  mealkit: "전복 밀키트",
  gift: "파도스토리 선물세트"
};

function buildJourney(origin: string, productName: string, sortingTone: string) {
  return JOURNEY_STEPS.map((step) => ({
    key: step.key,
    title: step.title,
    image: "",
    description:
      step.key === "origin"
        ? `${origin} 산지에서 ${productName}을 준비합니다.`
        : step.key === "sorting"
          ? `${sortingTone} 기준으로 상태를 확인하고 좋은 상품만 선별합니다.`
          : step.key === "packing"
            ? "상품 특성에 맞춰 아이스팩과 신선 포장으로 준비합니다."
            : step.key === "delivery"
              ? "평일 오후 1시 이전 주문은 당일 출고를 기준으로 운영합니다."
              : "도착 후 바로 상태를 확인하고 가장 맛있을 때 즐겨주세요."
  }));
}

function commonFaq(name: string) {
  return [
    { question: "언제 출고되나요?", answer: "평일 오후 1시 이전 주문 건은 당일 출고를 기준으로 운영합니다." },
    { question: `${name}은 어떻게 보관하나요?`, answer: "수령 즉시 상태를 확인하고 냉장 보관 후 가능한 빠르게 드시는 것을 권장합니다." },
    { question: "배송 중 신선도는 괜찮나요?", answer: "상품 특성에 맞춰 아이스팩과 보냉 포장으로 신선도를 최대한 지켜 발송합니다." }
  ];
}

const presetConfig: Record<ProductPresetId, Omit<ProductDetailPreset, "id">> = {
  abalone: {
    label: "완도 활전복",
    description: "활전복 상품 등록용",
    form: {
      category: "활수산물",
      badge: "추천",
      subtitle: "완도 바다에서 바로 보내는 활전복",
      description: "완도 산지에서 선별한 활전복을 산소포장과 보냉 포장으로 신선하게 보내드립니다.",
      highlights: "완도산, 산소포장, 당일 선별, 냉장배송"
    },
    options: [
      { name: "활전복 1kg", priceDelta: "0", stock: "30" },
      { name: "활전복 2kg", priceDelta: "35000", stock: "20" }
    ],
    detail: {
      benefits: ["완도산 활전복", "당일 선별", "산소포장", "평일 1시 이전 당일 출고", "선물용으로도 좋은 구성"],
      journey: buildJourney("완도", "활전복", "활력과 크기"),
      packaging: [...DEFAULT_PACKAGING, "활전복 산소포장"],
      recipes: [
        { title: "전복버터구이", description: "버터와 마늘을 넣고 노릇하게 구워 드세요.", image: "" },
        { title: "전복죽", description: "쌀과 함께 끓이면 깊은 풍미가 살아납니다.", image: "" }
      ],
      components: ["활전복", "아이스팩", "보관 안내문"],
      faq: commonFaq("활전복")
    }
  },
  "sea-eel": {
    label: "통영 바다장어",
    description: "손질 장어 상품 등록용",
    form: {
      category: "손질 수산물",
      badge: "인기",
      subtitle: "손질 완료, 구워 먹기 좋은 통영 바다장어",
      description: "통영 산지에서 손질한 바다장어를 구이와 덮밥으로 즐기기 좋게 준비합니다.",
      highlights: "통영산, 손질 완료, 구이 추천, 빠른 출고"
    },
    options: [
      { name: "손질 바다장어 1kg", priceDelta: "0", stock: "30" },
      { name: "손질 바다장어 2kg", priceDelta: "32000", stock: "20" }
    ],
    detail: {
      benefits: ["통영 산지 손질", "구이용 추천", "담백한 식감", "냉장 신선 포장", "당일 출고 기준"],
      journey: buildJourney("통영", "바다장어", "손질 상태와 신선도"),
      packaging: [...DEFAULT_PACKAGING, "손질 상품 밀봉 포장"],
      recipes: [
        { title: "장어구이", description: "중불에서 앞뒤로 노릇하게 구운 뒤 소스와 함께 드세요.", image: "" },
        { title: "장어덮밥", description: "따뜻한 밥 위에 구운 장어와 양념을 올려 즐기세요.", image: "" }
      ],
      components: ["손질 바다장어", "아이스팩", "보관 안내문"],
      faq: commonFaq("바다장어")
    }
  },
  conch: {
    label: "통영 참소라",
    description: "제철 참소라 상품 등록용",
    form: {
      category: "제철 수산물",
      badge: "제철",
      subtitle: "쫄깃한 식감이 좋은 통영 참소라",
      description: "통영 산지에서 준비한 참소라를 신선한 상태로 보내드립니다. 숙회와 초무침으로 즐기기 좋습니다.",
      highlights: "통영산, 제철상품, 숙회 추천, 냉장배송"
    },
    options: [
      { name: "참소라 1kg", priceDelta: "0", stock: "30" },
      { name: "참소라 2kg", priceDelta: "22000", stock: "20" }
    ],
    detail: {
      benefits: ["통영산 참소라", "쫄깃한 식감", "숙회 추천", "당일 선별", "냉장 신선 배송"],
      journey: buildJourney("통영", "참소라", "크기와 껍질 상태"),
      packaging: [...DEFAULT_PACKAGING],
      recipes: [
        { title: "참소라 숙회", description: "삶은 뒤 얇게 썰어 초장과 함께 드세요.", image: "" },
        { title: "참소라 무침", description: "채소와 양념을 더하면 매콤한 별미가 됩니다.", image: "" }
      ],
      components: ["참소라", "아이스팩", "보관 안내문"],
      faq: commonFaq("참소라")
    }
  },
  hairtail: {
    label: "먹갈치",
    description: "구이/조림용 갈치 상품 등록용",
    form: {
      category: "손질 수산물",
      badge: "추천",
      subtitle: "구이와 조림에 좋은 실속 먹갈치",
      description: "구이와 조림으로 활용하기 좋은 먹갈치를 손질 상태와 포장을 확인해 보내드립니다.",
      highlights: "구이용, 조림용, 손질상품, 냉장배송"
    },
    options: [
      { name: "먹갈치 실속 구성", priceDelta: "0", stock: "25" },
      { name: "먹갈치 넉넉 구성", priceDelta: "28000", stock: "15" }
    ],
    detail: {
      benefits: ["구이/조림 활용", "손질 상품", "실속 구성", "냉장 포장", "가정식 추천"],
      journey: buildJourney("목포", "먹갈치", "선도와 손질 상태"),
      packaging: [...DEFAULT_PACKAGING, "손질 생선 밀봉 포장"],
      recipes: [
        { title: "갈치구이", description: "물기를 제거한 뒤 노릇하게 구워 드세요.", image: "" },
        { title: "갈치조림", description: "무와 양념장을 넣어 자작하게 조리하면 좋습니다.", image: "" }
      ],
      components: ["먹갈치", "아이스팩", "보관 안내문"],
      faq: commonFaq("먹갈치")
    }
  },
  mackerel: {
    label: "간고등어",
    description: "간편 구이 생선 상품 등록용",
    form: {
      category: "손질 수산물",
      badge: "간편",
      subtitle: "바로 굽기 좋은 간고등어",
      description: "간편하게 굽기 좋은 간고등어를 가정식 반찬으로 활용하기 좋게 준비합니다.",
      highlights: "간편 조리, 손질 생선, 구이 추천, 냉장배송"
    },
    options: [
      { name: "간고등어 3팩", priceDelta: "0", stock: "30" },
      { name: "간고등어 6팩", priceDelta: "18000", stock: "20" }
    ],
    detail: {
      benefits: ["바로 굽기 좋은 손질", "가정식 반찬 추천", "간편 보관", "냉장 포장", "실속 구성"],
      journey: buildJourney("부산", "간고등어", "손질과 염도"),
      packaging: [...DEFAULT_PACKAGING, "개별 포장"],
      recipes: [
        { title: "고등어구이", description: "팬이나 에어프라이어에 노릇하게 구워 드세요.", image: "" },
        { title: "고등어조림", description: "무와 양파를 넣고 양념장과 함께 조리해도 좋습니다.", image: "" }
      ],
      components: ["간고등어", "아이스팩", "보관 안내문"],
      faq: commonFaq("간고등어")
    }
  },
  mealkit: {
    label: "밀키트",
    description: "간편 조리 상품 등록용",
    form: {
      category: "밀키트",
      badge: "간편",
      subtitle: "집에서도 간편하게 즐기는 수산 밀키트",
      description: "수산물 원재료를 집에서도 간편하게 즐길 수 있도록 구성한 밀키트 상품입니다.",
      highlights: "간편 조리, 가정식 구성, 빠른 출고, 냉장배송"
    },
    options: [
      { name: "1인 구성", priceDelta: "0", stock: "30" },
      { name: "2인 구성", priceDelta: "12000", stock: "20" }
    ],
    detail: {
      benefits: ["간편 조리", "수산 원재료 사용", "가정식 추천", "냉장 신선 배송", "조리 안내 포함"],
      journey: buildJourney("통영", "수산 밀키트", "원재료와 조리 편의성"),
      packaging: [...DEFAULT_PACKAGING, "조리 안내 동봉"],
      recipes: [
        { title: "기본 조리", description: "동봉된 안내에 따라 데우거나 끓여 간편하게 완성하세요.", image: "" },
        { title: "풍미 더하기", description: "기호에 맞춰 마늘, 대파, 참기름 등을 더하면 좋습니다.", image: "" }
      ],
      components: ["밀키트 본품", "아이스팩", "조리 안내문"],
      faq: commonFaq("밀키트")
    }
  },
  gift: {
    label: "선물세트",
    description: "선물 상품 등록용",
    form: {
      category: "선물세트",
      badge: "선물",
      subtitle: "감사의 마음을 전하는 파도스토리 선물세트",
      description: "받는 분이 신뢰할 수 있도록 산지 선별과 포장 완성도를 챙긴 선물세트입니다.",
      highlights: "선물 구성, 산지 선별, 안전 포장, 냉장배송"
    },
    options: [
      { name: "실속형", priceDelta: "0", stock: "20" },
      { name: "프리미엄형", priceDelta: "30000", stock: "15" }
    ],
    detail: {
      benefits: ["선물용 구성", "깔끔한 포장", "산지 선별", "받는 분 배려", "안전 배송"],
      journey: buildJourney("통영", "선물세트", "선물 포장 완성도"),
      packaging: [...DEFAULT_PACKAGING, "선물용 포장 구성"],
      recipes: [{ title: "추천 활용", description: "받는 분의 취향에 맞춰 구이, 찜, 탕 등으로 다양하게 즐길 수 있습니다.", image: "" }],
      components: ["선물세트 구성품", "아이스팩", "보관 안내문", "선물 포장"],
      faq: [
        { question: "선물로 바로 보내도 되나요?", answer: "상품 특성에 맞춰 안전하게 포장해 발송합니다." },
        { question: "출고일을 맞출 수 있나요?", answer: "운영 일정에 따라 가능 여부가 달라질 수 있어 주문 후 고객센터로 문의해주세요." }
      ]
    }
  }
};

export function buildProductDetailPreset(id: ProductPresetId, seed: ProductPresetSeed): ProductDetailPreset {
  const config = presetConfig[id];
  const name = seed.name || defaultNameByPreset[id];
  const origin = seed.origin || defaultOriginByPreset[id];

  return {
    id,
    label: config.label,
    description: config.description,
    form: {
      ...config.form,
      subtitle: config.form.subtitle.replace(defaultNameByPreset[id], name),
      description: config.form.description.replace(defaultNameByPreset[id], name).replace(defaultOriginByPreset[id], origin)
    },
    options: config.options,
    detail: {
      benefits: config.detail.benefits,
      journey: buildJourney(origin, name, config.detail.journey[1]?.description || "상품 상태"),
      packaging: config.detail.packaging,
      recipes: config.detail.recipes,
      components: config.detail.components.map((component) => component.replace(defaultNameByPreset[id], name)),
      faq: config.detail.faq
    }
  };
}
