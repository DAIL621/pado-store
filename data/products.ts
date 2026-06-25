export type ProductOption = {
  id: string;
  label: string;
  priceDelta: number;
  stock?: number;
};

export type Product = {
  id?: string;
  slug: string;
  origin: string;
  category: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  badge?: string;
  description: string;
  options: ProductOption[];
  highlights: string[];
  isActive?: boolean;
};

export const products: Product[] = [
  {
    slug: "wando-live-abalone",
    origin: "전남 완도",
    category: "전복·조개",
    name: "완도 활전복",
    subtitle: "청정 완도 바다에서 기른 싱싱한 활전복",
    price: 39900,
    image: "/images/products/wando-abalone.webp",
    badge: "BEST",
    description:
      "완도 양식장에서 건강하게 자란 활전복을 선별해 신선 포장으로 보내드립니다. 회, 버터구이, 전복죽까지 다양하게 즐기기 좋습니다.",
    options: [
      { id: "abalone-1", label: "1kg 10~11미", priceDelta: 0, stock: 30 },
      { id: "abalone-2", label: "1kg 15~16미", priceDelta: -5000, stock: 30 }
    ],
    highlights: ["완도 산지 선별", "활전복 신선 포장", "당일 출고 예정"]
  },
  {
    slug: "tongyeong-conch",
    origin: "경남 통영",
    category: "전복·조개",
    name: "통영 참소라",
    subtitle: "쫄깃하고 향긋한 통영 바다의 참소라",
    price: 29900,
    image: "/images/products/tongyeong-conch.webp",
    badge: "제철",
    description:
      "통영 앞바다에서 만나는 참소라를 크기와 상태에 따라 선별합니다. 숙회와 소라무침으로 즐기기 좋은 산지 직송 수산물입니다.",
    options: [
      { id: "conch-1", label: "1kg", priceDelta: 0, stock: 50 },
      { id: "conch-2", label: "2kg", priceDelta: 27000, stock: 30 }
    ],
    highlights: ["통영 산지 직송", "선도 확인 후 선별", "아이스박스 냉장 포장"]
  },
  {
    slug: "tongyeong-triploid-oyster",
    origin: "경남 통영",
    category: "굴",
    name: "통영 삼배체굴",
    subtitle: "크기가 크고 맛이 진한 프리미엄 개체굴",
    price: 34900,
    image: "/images/products/tongyeong-oyster.webp",
    badge: "산지추천",
    description:
      "일반 굴보다 성장 에너지가 좋아 크고 통통한 살을 기대할 수 있는 삼배체굴입니다. 현장에서 선별하고 세척해 보내드립니다.",
    options: [
      { id: "oyster-1", label: "1kg", priceDelta: 0, stock: 25 },
      { id: "oyster-2", label: "2kg", priceDelta: 32000, stock: 20 }
    ],
    highlights: ["통영 양식장 직송", "크기 선별", "세척 후 냉장 포장"]
  },
  {
    slug: "tongyeong-sea-eel",
    origin: "경남 통영",
    category: "장어·갈치",
    name: "통영 바다장어",
    subtitle: "담백하고 부드러운 손질 바다장어",
    price: 32900,
    image: "/images/products/tongyeong-eel.webp",
    badge: "인기",
    description:
      "통영에서 조업한 바다장어를 먹기 좋게 손질해 보내드립니다. 구이용은 물론 아나고회 상품으로도 확장 가능한 대표 상품입니다.",
    options: [
      { id: "eel-1", label: "손질 500g", priceDelta: 0, stock: 40 },
      { id: "eel-2", label: "손질 1kg", priceDelta: 30000, stock: 25 }
    ],
    highlights: ["통영 조업", "손질 후 포장", "소스 동봉"]
  },
  {
    slug: "mokpo-hairtail",
    origin: "전남 목포",
    category: "생선",
    name: "목포 먹갈치",
    subtitle: "담백한 선도가 살아있는 목포 먹갈치",
    price: 44900,
    image: "/images/products/mokpo-hairtail.webp",
    badge: "추천",
    description:
      "목포 위판장에서 선별한 먹갈치를 먹기 좋은 크기로 손질하고 진공 포장합니다. 구이와 조림에 모두 잘 어울립니다.",
    options: [
      { id: "hairtail-1", label: "손질 1kg", priceDelta: 0, stock: 20 },
      { id: "hairtail-2", label: "손질 2kg", priceDelta: 42000, stock: 10 }
    ],
    highlights: ["목포 위판장 선별", "먹기 좋은 크기 손질", "진공 포장"]
  },
  {
    slug: "tongyeong-rock-octopus",
    origin: "경남 통영",
    category: "문어",
    name: "통영 돌문어",
    subtitle: "살 좋고 쫄깃한 통영 자연산 돌문어",
    price: 36900,
    image: "/images/products/tongyeong-octopus.webp",
    badge: "신선",
    description:
      "통영 연안에서 잡은 돌문어를 활력과 크기에 따라 선별합니다. 숙회, 문어볶음, 캠핑 요리에 사용하기 좋습니다.",
    options: [
      { id: "octopus-1", label: "1kg", priceDelta: 0, stock: 20 },
      { id: "octopus-2", label: "2kg", priceDelta: 34000, stock: 12 }
    ],
    highlights: ["통영 연안 조업", "활력 선별", "신선 냉장 포장"]
  }
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;
