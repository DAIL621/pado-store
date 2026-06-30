import type { Product } from "@/data/products";
import { getVisibleProductDetailSections } from "@/lib/products/detail-sections";

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

export function buildProductDetailTemplateModel(product: Product) {
  const sections = getVisibleProductDetailSections(product.detail);
  const heroImages = sections.heroImages.length
    ? sections.heroImages
    : [{ label: "대표사진", url: product.image, description: product.subtitle }];
  const featureItems = sections.benefits.length ? sections.benefits.slice(0, 5) : product.highlights.slice(0, 5);
  const overviewItems = buildOverviewItems(product, sections.components);
  const trustSignals = buildTrustSignals(product);
  const packagingImage = heroImages.find((image) => /포장|박스|package/i.test(image.label))?.url;

  return {
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

function buildTrustSignals(product: Product): DetailTemplateTrustSignal[] {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const optionCount = product.options.length;
  const discountCopy = product.discountRate > 0 ? `${product.discountRate}% 할인 적용` : "정직한 판매가";

  return [
    {
      label: "산지",
      title: product.origin,
      body: "상품별 산지 정보를 구매 전 확인"
    },
    {
      label: "배송",
      title: product.shippingInfo.title,
      body: product.shippingInfo.body
    },
    {
      label: "옵션",
      title: `${optionCount}개 선택 가능`,
      body: totalStock > 0 ? `현재 총 ${totalStock}개 구매 가능` : "현재 품절 상태"
    },
    {
      label: "가격",
      title: discountCopy,
      body: "정상가와 판매가를 함께 표시"
    }
  ];
}
