import type { ProductDetail } from "@/lib/products/detail";

export type ProductOption = {
  id: string;
  label: string;
  price?: number;
  regularPrice?: number;
  priceDelta: number;
  stock?: number;
};

export type ProductInfoBlock = {
  title: string;
  body: string;
};

export type Product = {
  id?: string;
  slug: string;
  origin: string;
  category: string;
  name: string;
  subtitle: string;
  price: number;
  normalPrice: number;
  discountRate: number;
  image: string;
  badge?: string;
  description: string;
  detailImages: string[];
  options: ProductOption[];
  highlights: string[];
  shippingInfo: ProductInfoBlock;
  exchangeInfo: ProductInfoBlock;
  originInfo: ProductInfoBlock;
  producerInfo: ProductInfoBlock;
  isActive?: boolean;
  detail?: ProductDetail;
};

const defaultShipping: ProductInfoBlock = {
  title: "평일 오후 1시 이전 주문 당일 출고",
  body: "상품 특성에 맞춰 아이스팩, 보냉재, 냉장 포장으로 신선하게 발송합니다."
};

const defaultExchange: ProductInfoBlock = {
  title: "신선식품 특성상 단순 변심 교환/반품 제한",
  body: "상품 이상이나 오배송은 수령 즉시 사진과 함께 고객센터로 문의해 주세요."
};

const product = (item: Omit<Product, "shippingInfo" | "exchangeInfo" | "detailImages"> & Partial<Pick<Product, "shippingInfo" | "exchangeInfo" | "detailImages">>): Product => ({
  shippingInfo: defaultShipping,
  exchangeInfo: defaultExchange,
  detailImages: [item.image],
  ...item
});

export const products: Product[] = [
  product({
    slug: "wando-live-abalone",
    origin: "전남 완도",
    category: "전복·조개",
    name: "완도 활전복",
    subtitle: "청정 완도 바다에서 기른 싱싱한 활전복",
    price: 39900,
    normalPrice: 44900,
    discountRate: 11,
    image: "/images/products/wando-abalone.webp",
    badge: "BEST",
    description: "완도 양식장에서 건강하게 자란 활전복을 선별해 신선 포장으로 보내드립니다. 회, 버터구이, 전복죽까지 다양하게 즐기기 좋습니다.",
    options: [
      { id: "abalone-1", label: "1kg 10~11미", priceDelta: 0, stock: 30 },
      { id: "abalone-2", label: "1kg 15~16미", priceDelta: -5000, stock: 30 }
    ],
    highlights: ["완도 산지 선별", "활전복 신선 포장", "당일 출고 가능"],
    originInfo: { title: "전남 완도", body: "청정 해역에서 자란 전복을 산지 기준으로 선별합니다." },
    producerInfo: { title: "완도 활전복 양식장", body: "수온과 먹이 상태를 확인하며 건강하게 키운 전복을 출고합니다." }
  }),
  product({
    slug: "tongyeong-conch",
    origin: "경남 통영",
    category: "전복·조개",
    name: "통영 참소라",
    subtitle: "쫄깃하고 담백한 통영 바다 참소라",
    price: 29900,
    normalPrice: 34900,
    discountRate: 14,
    image: "/images/products/tongyeong-conch.webp",
    badge: "제철",
    description: "통영 앞바다에서 만나는 참소라를 크기와 상태에 따라 선별합니다. 숙회와 소라무침으로 즐기기 좋은 산지 직송 수산물입니다.",
    options: [
      { id: "conch-1", label: "1kg", priceDelta: 0, stock: 50 },
      { id: "conch-2", label: "2kg", priceDelta: 27000, stock: 30 }
    ],
    highlights: ["통영 산지 직송", "선도 확인 후 선별", "아이스박스 냉장 포장"],
    originInfo: { title: "경남 통영", body: "남해안 통영 산지에서 선별한 참소라를 준비합니다." },
    producerInfo: { title: "통영 조개 선별 작업장", body: "입고 후 크기와 상태를 확인해 상품성이 좋은 개체를 고릅니다." }
  }),
  product({
    slug: "tongyeong-sea-eel",
    origin: "경남 통영",
    category: "장어·갈치",
    name: "통영 바다장어",
    subtitle: "담백하고 부드러운 손질 바다장어",
    price: 32900,
    normalPrice: 37900,
    discountRate: 13,
    image: "/images/products/tongyeong-eel.webp",
    badge: "인기",
    description: "통영에서 조업한 바다장어를 먹기 좋게 손질해 보내드립니다. 구이와 조림은 물론 아나고회 상품으로도 확장 가능한 대표 상품입니다.",
    options: [
      { id: "eel-1", label: "손질 500g", priceDelta: 0, stock: 40 },
      { id: "eel-2", label: "손질 1kg", priceDelta: 30000, stock: 25 }
    ],
    highlights: ["통영 조업", "손질 후 포장", "소스 동봉 가능"],
    originInfo: { title: "경남 통영", body: "통영 앞바다 조업 물량을 기준으로 선도 좋은 장어를 준비합니다." },
    producerInfo: { title: "통영 바다장어 조업팀", body: "조업과 손질 과정을 확인해 안정적인 품질을 목표로 합니다." }
  }),
  product({
    slug: "tongyeong-triploid-oyster",
    origin: "경남 통영",
    category: "굴",
    name: "통영 삼배체굴",
    subtitle: "크기가 크고 맛이 진한 프리미엄 개체굴",
    price: 34900,
    normalPrice: 39900,
    discountRate: 13,
    image: "/images/products/tongyeong-oyster.webp",
    badge: "산지추천",
    description: "일반 굴보다 성장 에너지가 좋아 크고 통통한 맛을 기대할 수 있는 삼배체굴입니다. 현장에서 선별하고 세척해 보내드립니다.",
    options: [
      { id: "oyster-1", label: "1kg", priceDelta: 0, stock: 25 },
      { id: "oyster-2", label: "2kg", priceDelta: 32000, stock: 20 }
    ],
    highlights: ["통영 양식장 직송", "크기 선별", "세척 후 냉장 포장"],
    originInfo: { title: "경남 통영", body: "통영 청정 해역의 굴 양식장에서 선별합니다." },
    producerInfo: { title: "통영 굴 생산자", body: "입고와 세척 상태를 확인한 뒤 신선 포장합니다." }
  }),
  product({
    slug: "skate-fermented-hongeo",
    origin: "전남 목포",
    category: "홍어",
    name: "홍어",
    subtitle: "삭힘 정도를 선택해 즐기는 남도 별미",
    price: 45900,
    normalPrice: 52900,
    discountRate: 13,
    image: "/images/products/mokpo-hairtail.webp",
    badge: "신상품",
    description: "홍어 사진과 상세 정보가 준비되기 전까지 기본 상품 구조로 등록한 판매 예정 상품입니다. 옵션별 삭힘 정도와 중량을 확장할 수 있습니다.",
    options: [
      { id: "hongeo-1", label: "약한 삭힘 500g", priceDelta: 0, stock: 10 },
      { id: "hongeo-2", label: "중간 삭힘 500g", priceDelta: 2000, stock: 10 }
    ],
    highlights: ["남도 별미", "삭힘 선택", "냉장 포장"],
    originInfo: { title: "전남 목포", body: "목포권 산지와 유통 기준으로 상품 정보를 보완할 예정입니다." },
    producerInfo: { title: "홍어 전문 작업장", body: "삭힘 정도와 포장 기준을 확정해 상세 정보를 업데이트할 예정입니다." }
  }),
  product({
    slug: "fresh-shrimp",
    origin: "국내산",
    category: "새우",
    name: "새우",
    subtitle: "구이와 찜에 좋은 신선 새우",
    price: 28900,
    normalPrice: 33900,
    discountRate: 15,
    image: "/images/products/tongyeong-octopus.webp",
    badge: "추천",
    description: "새우 사진과 규격이 확정되기 전까지 기본 데이터로 등록한 상품입니다. 산지와 시즌에 따라 옵션을 추가할 수 있습니다.",
    options: [
      { id: "shrimp-1", label: "1kg", priceDelta: 0, stock: 20 },
      { id: "shrimp-2", label: "2kg", priceDelta: 26000, stock: 10 }
    ],
    highlights: ["구이용 추천", "냉장·냉동 선택 가능", "시즌 상품"],
    originInfo: { title: "국내산", body: "입고 산지 확정 후 원산지 정보를 상세 반영합니다." },
    producerInfo: { title: "새우 선별 작업장", body: "크기와 선도 기준을 정리해 상세 정보를 업데이트할 예정입니다." }
  }),
  product({
    slug: "domestic-mackerel",
    origin: "국내산",
    category: "생선",
    name: "고등어",
    subtitle: "구이용으로 손질하기 좋은 국민 생선",
    price: 24900,
    normalPrice: 29900,
    discountRate: 17,
    image: "/images/products/mokpo-hairtail.webp",
    badge: "추천",
    description: "고등어 상품 사진과 손질 규격이 제공되면 바로 교체할 수 있도록 기본 구조로 등록했습니다.",
    options: [
      { id: "mackerel-1", label: "손질 3미", priceDelta: 0, stock: 20 },
      { id: "mackerel-2", label: "손질 5미", priceDelta: 12000, stock: 15 }
    ],
    highlights: ["구이용 손질", "가정식 추천", "냉장 포장"],
    originInfo: { title: "국내산", body: "입고 산지와 가공 정보를 상세페이지에 추가할 예정입니다." },
    producerInfo: { title: "생선 손질 작업장", body: "손질 상태와 포장 기준을 검수해 출고합니다." }
  }),
  product({
    slug: "mokpo-hairtail",
    origin: "전남 목포",
    category: "생선",
    name: "갈치",
    subtitle: "담백한 선도가 살아있는 목포 갈치",
    price: 44900,
    normalPrice: 50900,
    discountRate: 12,
    image: "/images/products/mokpo-hairtail.webp",
    badge: "추천",
    description: "목포 위판장에서 선별한 먹기 좋은 크기의 갈치를 손질하고 진공 포장합니다. 구이와 조림 모두 잘 어울립니다.",
    options: [
      { id: "hairtail-1", label: "손질 1kg", priceDelta: 0, stock: 20 },
      { id: "hairtail-2", label: "손질 2kg", priceDelta: 42000, stock: 10 }
    ],
    highlights: ["목포 위판장 선별", "먹기 좋은 크기 손질", "진공 포장"],
    originInfo: { title: "전남 목포", body: "목포 산지 물량을 기준으로 선도와 크기를 확인합니다." },
    producerInfo: { title: "목포 생선 손질 작업장", body: "손질 후 진공 포장해 가정에서 바로 조리하기 좋게 준비합니다." }
  }),
  product({
    slug: "abalone-porridge",
    origin: "전남 완도",
    category: "밀키트",
    name: "전복죽",
    subtitle: "전복의 깊은 맛을 간편하게 즐기는 밀키트",
    price: 15900,
    normalPrice: 18900,
    discountRate: 16,
    image: "/images/products/wando-abalone.webp",
    badge: "신상품",
    description: "전복죽 상세 이미지와 패키지 사진이 준비되기 전까지 밀키트 구조를 먼저 등록했습니다.",
    options: [
      { id: "abalone-porridge-1", label: "2인분", priceDelta: 0, stock: 20 },
      { id: "abalone-porridge-2", label: "4인분", priceDelta: 14000, stock: 10 }
    ],
    highlights: ["간편 조리", "완도 전복 활용", "밀키트 예정"],
    originInfo: { title: "전남 완도", body: "완도 전복 기반의 밀키트 상품으로 구성 예정입니다." },
    producerInfo: { title: "전복 밀키트 제조 협력처", body: "조리 편의성과 신선 포장 기준을 함께 검토합니다." }
  }),
  product({
    slug: "abalone-seaweed-soup",
    origin: "전남 완도",
    category: "밀키트",
    name: "전복미역국",
    subtitle: "전복과 미역을 담은 든든한 국물 밀키트",
    price: 16900,
    normalPrice: 19900,
    discountRate: 15,
    image: "/images/products/wando-abalone.webp",
    badge: "신상품",
    description: "전복미역국 사진과 상세 설명이 제공되면 바로 교체 가능한 밀키트 상품 구조입니다.",
    options: [
      { id: "abalone-soup-1", label: "2인분", priceDelta: 0, stock: 20 },
      { id: "abalone-soup-2", label: "4인분", priceDelta: 15000, stock: 10 }
    ],
    highlights: ["간편 국물요리", "전복 활용", "냉장 포장"],
    originInfo: { title: "전남 완도", body: "완도 전복을 활용한 국물 밀키트로 기획 중입니다." },
    producerInfo: { title: "전복 밀키트 제조 협력처", body: "원물과 부재료 기준을 정리해 상세페이지에 반영할 예정입니다." }
  }),
  product({
    slug: "pado-gift-set",
    origin: "산지 혼합",
    category: "선물세트",
    name: "선물세트",
    subtitle: "감사한 마음을 전하는 파도스토리 구성",
    price: 69900,
    normalPrice: 79000,
    discountRate: 12,
    image: "/images/products/wando-abalone.webp",
    badge: "추천",
    description: "명절과 감사 선물에 맞춰 구성할 수 있는 선물세트 기본 구조입니다. 실제 구성품과 패키지 사진이 준비되면 교체합니다.",
    options: [
      { id: "gift-1", label: "기본 세트", priceDelta: 0, stock: 10 },
      { id: "gift-2", label: "프리미엄 세트", priceDelta: 40000, stock: 5 }
    ],
    highlights: ["선물 추천", "구성 변경 가능", "보냉 포장"],
    originInfo: { title: "산지 혼합", body: "전복, 굴, 생선 등 시즌별 좋은 상품으로 구성 예정입니다." },
    producerInfo: { title: "파도스토리 선물 포장팀", body: "선물용 포장과 배송 안정성을 기준으로 구성합니다." }
  }),
  product({
    slug: "tongyeong-anago-sashimi",
    origin: "경남 통영",
    category: "장어·갈치",
    name: "아나고회",
    subtitle: "통영 바다장어를 회로 즐기는 산지 별미",
    price: 39900,
    normalPrice: 45900,
    discountRate: 13,
    image: "/images/products/tongyeong-eel.webp",
    badge: "인기",
    description: "아나고회 전용 사진과 상세 설명이 제공되면 바로 교체할 수 있도록 바다장어 계열 상품으로 먼저 등록했습니다.",
    options: [
      { id: "anago-1", label: "아나고회 500g", priceDelta: 0, stock: 15 },
      { id: "anago-2", label: "아나고회 1kg", priceDelta: 36000, stock: 8 }
    ],
    highlights: ["통영 산지", "회용 손질", "냉장 포장"],
    originInfo: { title: "경남 통영", body: "통영 바다장어 물량을 기준으로 회용 상품을 구성합니다." },
    producerInfo: { title: "통영 바다장어 조업팀", body: "회용 손질 기준과 포장 방식을 상세페이지에 계속 보완합니다." }
  })
];

export const getProduct = (slug: string) => products.find((item) => item.slug === slug);

export const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;
