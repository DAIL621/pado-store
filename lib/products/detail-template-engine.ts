import type { Product } from "@/data/products";
import { getVisibleProductDetailSections } from "@/lib/products/detail-sections";

export const PRODUCT_DETAIL_TEMPLATE_ID = "pado-master-v2";

export type DetailTemplateKind = "abalone" | "eel" | "fish" | "shellfish" | "meal-kit" | "gift" | "default";

export type DetailTemplateInfoCard = {
  label: string;
  title: string;
  body?: string;
};

export type DetailTemplateTrustSignal = {
  label: string;
  title: string;
  body: string;
};

export type DetailTemplateCopy = {
  eyebrow: string;
  promise: string;
  originProof: string;
  usage: string;
};

export function buildProductDetailTemplateModel(product: Product) {
  const sections = getVisibleProductDetailSections(product.detail);
  const kind = inferTemplateKind(product);
  const copy = buildTemplateCopy(kind, product);
  const heroImages = sections.heroImages.length
    ? sections.heroImages
    : [{ label: "대표사진", url: product.image, description: product.subtitle }];
  const featureItems = sections.benefits.length ? sections.benefits.slice(0, 5) : product.highlights.slice(0, 5);
  const overviewItems = buildOverviewItems(product, sections.components);
  const trustSignals = buildTrustSignals(product, kind, copy);
  const packagingImage = heroImages.find((image) => /포장|박스|package/i.test(image.label))?.url;

  return {
    template: {
      id: PRODUCT_DETAIL_TEMPLATE_ID,
      schemaVersion: product.detail?.schemaVersion ?? 1,
      kind,
      copy
    },
    sections,
    heroImages,
    featureItems,
    overviewItems,
    trustSignals,
    packagingImage
  };
}

function buildOverviewItems(product: Product, components: string[]): DetailTemplateInfoCard[] {
  const firstOption = product.options[0]?.label;
  return [
    { label: "산지", title: product.origin, body: product.originInfo.body },
    { label: "원산지", title: product.originInfo.title, body: product.originInfo.body },
    { label: "배송", title: product.shippingInfo.title, body: product.shippingInfo.body },
    {
      label: "보관",
      title: "수령 즉시 냉장 보관",
      body: "가능한 빠르게 섭취하고, 장기 보관 시 상품별 안내에 맞춰 보관해주세요."
    },
    firstOption ? { label: "대표 옵션", title: firstOption, body: "옵션별 가격과 재고는 구매 영역에서 확인할 수 있습니다." } : null,
    components.length ? { label: "구성", title: components.slice(0, 2).join(" · "), body: components.length > 2 ? `외 ${components.length - 2}개 구성` : undefined } : null
  ].filter(Boolean) as DetailTemplateInfoCard[];
}

function buildTrustSignals(product: Product, kind: DetailTemplateKind, copy: DetailTemplateCopy): DetailTemplateTrustSignal[] {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const optionCount = product.options.length;
  const discountCopy = product.discountRate > 0 ? `${product.discountRate}% 할인 적용` : "정직한 판매가";
  const handlingByKind: Record<DetailTemplateKind, string> = {
    abalone: "산소포장",
    eel: "손질 후 포장",
    fish: "선도 확인",
    shellfish: "크기/상태 선별",
    "meal-kit": "간편 조리 구성",
    gift: "선물 포장",
    default: "신선 포장"
  };

  return [
    {
      label: "산지",
      title: product.origin,
      body: copy.originProof
    },
    {
      label: "출고",
      title: product.shippingInfo.title,
      body: product.shippingInfo.body
    },
    {
      label: "상품상태",
      title: handlingByKind[kind],
      body: copy.promise
    },
    {
      label: "옵션",
      title: `${optionCount}개 선택 가능`,
      body: totalStock > 0 ? `현재 총 ${totalStock}개 구매 가능` : "현재 품절 상태"
    },
    {
      label: "가격",
      title: discountCopy,
      body: "정상가와 판매가를 함께 표시합니다."
    }
  ];
}

function inferTemplateKind(product: Product): DetailTemplateKind {
  const text = `${product.slug} ${product.name} ${product.category}`.toLowerCase();
  if (/gift|선물|세트/.test(text)) return "gift";
  if (/porridge|meal|kit|죽|미역국|밀키트/.test(text)) return "meal-kit";
  if (/abalone|전복/.test(text)) return "abalone";
  if (/eel|장어|아나고/.test(text)) return "eel";
  if (/conch|oyster|shell|소라|굴|조개/.test(text)) return "shellfish";
  if (/fish|galchi|godeungeo|갈치|고등어|홍어|새우/.test(text)) return "fish";
  return "default";
}

function buildTemplateCopy(kind: DetailTemplateKind, product: Product): DetailTemplateCopy {
  const byKind: Record<DetailTemplateKind, DetailTemplateCopy> = {
    abalone: {
      eyebrow: "LIVE ABALONE",
      promise: "살아있는 신선함을 산소포장으로 최대한 그대로 전합니다.",
      originProof: "산지와 선별 기준을 확인하고 활전복 상태에 맞춰 포장합니다.",
      usage: "버터구이, 전복죽, 찜 요리에 어울리는 상품입니다."
    },
    eel: {
      eyebrow: "READY TO COOK",
      promise: "손질 부담을 줄이고 집에서는 굽기만 쉽게 준비합니다.",
      originProof: "손질과 포장 상태를 확인해 바로 조리하기 좋은 상태로 보냅니다.",
      usage: "구이, 덮밥, 보양식으로 활용하기 좋습니다."
    },
    fish: {
      eyebrow: "SEAFOOD CUT",
      promise: "식탁에 올리기 좋은 선도와 손질 상태를 기준으로 선별합니다.",
      originProof: "어종별 산지와 선도 기준을 확인해 출고합니다.",
      usage: "구이, 조림, 찜 등 가정식 메인 요리에 적합합니다."
    },
    shellfish: {
      eyebrow: "SEASONAL SHELLFISH",
      promise: "쫄깃한 식감과 제철 풍미가 살아있는 상품을 고릅니다.",
      originProof: "산지별 입고 상태와 크기, 신선도를 확인합니다.",
      usage: "숙회, 찜, 탕 요리에 잘 어울립니다."
    },
    "meal-kit": {
      eyebrow: "EASY MEAL",
      promise: "바쁜 날에도 간편하게 해산물 한 끼를 완성할 수 있습니다.",
      originProof: "원재료와 구성품을 확인해 조리 편의성을 높입니다.",
      usage: "간편식, 아침식사, 선물용 식사 구성으로 좋습니다."
    },
    gift: {
      eyebrow: "PREMIUM GIFT",
      promise: "받는 분의 식탁까지 신선하고 단정하게 도착하도록 구성합니다.",
      originProof: "선물 구성과 포장 상태를 함께 확인해 출고합니다.",
      usage: "명절, 감사 인사, 가족 선물로 적합합니다."
    },
    default: {
      eyebrow: "PADO SELECT",
      promise: "산지의 오늘을 식탁까지 신선하게 연결합니다.",
      originProof: `${product.origin} 기준으로 상품 상태를 확인합니다.`,
      usage: "가정식과 선물용 모두 고려해 준비한 상품입니다."
    }
  };

  return byKind[kind];
}
