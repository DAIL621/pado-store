import { DEFAULT_PACKAGING, JOURNEY_STEPS, type ProductDetail } from "@/lib/products/detail";

export type ProductPresetId = "live-seafood" | "shellfish" | "mealkit" | "gift";

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
  { id: "live-seafood", label: "활수산물", description: "전복, 장어, 홍어 등 신선 출고 상품" },
  { id: "shellfish", label: "조개/굴", description: "참소라, 굴, 제철 조개류" },
  { id: "mealkit", label: "밀키트", description: "전복죽, 미역국 등 간편 조리 상품" },
  { id: "gift", label: "선물세트", description: "명절/감사 선물 구성 상품" }
];

const journey = (origin: string, productName: string, tone: string) =>
  JOURNEY_STEPS.map((step) => ({
    key: step.key,
    title: step.title,
    image: "",
    description:
      step.key === "origin"
        ? `${origin} 산지에서 ${productName}을 준비합니다.`
        : step.key === "sorting"
          ? `${tone} 기준으로 상태를 확인하고 좋은 상품만 선별합니다.`
          : step.key === "packing"
            ? "상품 특성에 맞춰 냉장 포장과 아이스팩을 함께 준비합니다."
            : step.key === "delivery"
              ? "평일 오후 1시 이전 주문은 당일 출고를 기준으로 운영합니다."
              : "도착 후 바로 확인하고 신선할 때 맛있게 즐겨주세요."
  }));

export function buildProductDetailPreset(id: ProductPresetId, seed: ProductPresetSeed): ProductDetailPreset {
  const name = seed.name || "상품";
  const origin = seed.origin || "산지";

  if (id === "mealkit") {
    return {
      id,
      label: "밀키트",
      description: "간편 조리 상품 등록용",
      form: {
        category: "밀키트",
        badge: "간편식",
        subtitle: `집에서 간편하게 즐기는 ${name}`,
        description: `${origin} 원물을 활용해 집에서도 간편하게 즐길 수 있도록 준비한 ${name}입니다.`,
        highlights: "간편 조리, 신선 원물, 냉장 배송"
      },
      options: [
        { name: "1팩", priceDelta: "0", stock: "30" },
        { name: "2팩 묶음", priceDelta: "12000", stock: "20" }
      ],
      detail: {
        benefits: ["간편 조리", `${origin} 원물 사용`, "냉장 신선 배송", "가정식 구성", "빠른 출고"],
        journey: journey(origin, name, "원물과 조리 편의성"),
        packaging: [...DEFAULT_PACKAGING, "조리 안내 동봉"],
        recipes: [
          { title: "기본 조리", description: "동봉된 안내에 따라 데우거나 끓여 간편하게 완성하세요.", image: "" },
          { title: "풍미 더하기", description: "기호에 맞춰 대파, 마늘, 참기름 등을 더하면 더 깊은 맛을 즐길 수 있습니다.", image: "" }
        ],
        components: [`${name} 1팩`, "아이스팩", "보관/조리 안내문"],
        faq: [
          { question: "조리가 어렵지 않나요?", answer: "기본 손질과 구성을 마친 상품으로 안내에 따라 간편하게 조리할 수 있습니다." },
          { question: "어떻게 보관하나요?", answer: "수령 후 바로 냉장 보관하고 표시된 소비기한 내에 드시는 것을 권장합니다." }
        ]
      }
    };
  }

  if (id === "gift") {
    return {
      id,
      label: "선물세트",
      description: "선물 상품 등록용",
      form: {
        category: "선물세트",
        badge: "선물",
        subtitle: `감사의 마음을 전하는 ${origin} ${name}`,
        description: `받는 분이 신뢰할 수 있도록 산지 선별과 포장 완성도를 챙긴 ${name} 선물 구성입니다.`,
        highlights: "선물 구성, 산지 선별, 안전 포장"
      },
      options: [
        { name: "실속형", priceDelta: "0", stock: "20" },
        { name: "프리미엄형", priceDelta: "30000", stock: "15" }
      ],
      detail: {
        benefits: ["선물용 구성", "깔끔한 포장", `${origin} 산지 선별`, "받는 분 배려", "안전 배송"],
        journey: journey(origin, name, "선물 품질"),
        packaging: [...DEFAULT_PACKAGING, "선물용 포장 구성"],
        recipes: [{ title: "추천 활용", description: "받는 분의 취향에 맞춰 구이, 찜, 탕 등으로 다양하게 즐길 수 있습니다.", image: "" }],
        components: [`${name} 선물 구성`, "아이스팩", "보관 안내문", "선물 포장"],
        faq: [
          { question: "선물로 바로 보내도 되나요?", answer: "상품 특성에 맞춰 안전하게 포장해 발송합니다." },
          { question: "출고일을 맞출 수 있나요?", answer: "운영 일정에 따라 가능 여부가 달라질 수 있어 주문 전 고객센터로 문의해주세요." }
        ]
      }
    };
  }

  const shellfish = id === "shellfish";

  return {
    id,
    label: shellfish ? "조개/굴" : "활수산물",
    description: shellfish ? "제철 조개류 등록용" : "신선 수산물 등록용",
    form: {
      category: shellfish ? "조개·굴" : "수산물",
      badge: shellfish ? "제철" : "추천",
      subtitle: `${origin}에서 바로 보내는 ${name}`,
      description: `${origin}에서 선별한 ${name}입니다. 신선도와 포장 상태를 확인한 뒤 고객 식탁까지 보내드립니다.`,
      highlights: `${origin} 선별, 신선 포장, 당일 출고`
    },
    options: [
      { name: shellfish ? "1kg" : "기본 구성", priceDelta: "0", stock: "30" },
      { name: shellfish ? "2kg" : "넉넉한 구성", priceDelta: "20000", stock: "20" }
    ],
    detail: {
      benefits: [`${origin} 산지 선별`, "당일 포장", "냉장 신선 배송", "오후 1시 이전 주문 당일 출고", "상태 확인 후 발송"],
      journey: journey(origin, name, shellfish ? "제철 신선도" : "신선도"),
      packaging: [...DEFAULT_PACKAGING],
      recipes: [
        { title: shellfish ? "찜으로 즐기기" : "기본 조리", description: "가볍게 세척한 뒤 상품에 맞는 방식으로 조리해 드세요.", image: "" },
        { title: "국물 요리", description: "탕이나 국물 요리에 넣으면 깊고 시원한 맛을 더할 수 있습니다.", image: "" }
      ],
      components: [`${name} 본품`, "아이스팩", "보관 안내문"],
      faq: [
        { question: "언제 출고되나요?", answer: "평일 오후 1시 이전 주문 건은 당일 출고를 기준으로 운영합니다." },
        { question: "수령 후 어떻게 보관하나요?", answer: "수령 즉시 상태를 확인하고 냉장 보관 후 가능한 빠르게 드세요." }
      ]
    }
  };
}
