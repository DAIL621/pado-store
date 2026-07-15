"use client";

import { useMemo, useState } from "react";
import { formatPrice, type Product, type ProductOption } from "@/data/products";
import { ProductDetailTemplate } from "@/components/products/ProductDetailTemplate";
import { getVisibleProductDetailSections } from "@/lib/products/detail-sections";
import type { ProductDetail } from "@/lib/products/detail";

type PreviewForm = {
  name: string;
  slug?: string;
  origin: string;
  category?: string;
  subtitle: string;
  description?: string;
  basePrice: string;
  imageUrl: string;
  badge: string;
};

type Props = {
  form: PreviewForm;
  options: Array<Pick<ProductOption, "label" | "price" | "regularPrice" | "priceDelta" | "stock">>;
  detail: ProductDetail;
};

function buildPreviewProduct(form: PreviewForm, options: Props["options"], detail: ProductDetail): Product {
  const price = Number(form.basePrice) || 0;
  const representativeOption = options.find((option) => Number(option.price ?? 0) === price);
  const normalPrice = Number(representativeOption?.regularPrice ?? price);
  const discountRate = price > 0 && normalPrice > 0 ? Math.max(0, Math.round((1 - price / normalPrice) * 100)) : 0;
  const image = form.imageUrl.trim()
    || detail.heroImages.find((item) => item.label === "대표사진" && item.url.trim())?.url
    || detail.heroImages.find((item) => item.url.trim())?.url
    || "/images/product-placeholder.svg";
  const visibleSections = getVisibleProductDetailSections(detail);
  const previewOptions = options
    .filter((option) => option.label)
    .map((option, index) => ({
      id: `preview-option-${index}`,
      label: option.label,
      priceDelta: Number(option.priceDelta ?? 0),
      price: Number(option.price ?? 0) || undefined,
      regularPrice: Number(option.regularPrice ?? 0) || undefined,
      stock: Number(option.stock ?? 0)
    }));

  return {
    id: "admin-preview",
    slug: form.slug || "admin-preview-product",
    origin: form.origin || "산지 미입력",
    category: form.category || "미분류",
    name: form.name || "상품명 미입력",
    subtitle: form.subtitle || "상품의 핵심 설명이 여기에 표시됩니다.",
    price,
    normalPrice,
    discountRate,
    image,
    badge: form.badge || undefined,
    description: form.description || form.subtitle || "관리자가 입력한 상세 설명이 실제 상품 상세페이지와 동일한 템플릿으로 표시됩니다.",
    detailImages: visibleSections.heroImages.length ? visibleSections.heroImages.map((item) => item.url) : [image],
    options: previewOptions.length ? previewOptions : [{ id: "preview-option-default", label: "기본 옵션", priceDelta: 0, stock: 0 }],
    highlights: visibleSections.benefits.length ? visibleSections.benefits.slice(0, 4) : ["산지 선별", "신선 포장", "빠른 출고"],
    shippingInfo: {
      title: "평일 오후 1시 이전 주문 당일 출고",
      body: "상품 특성에 맞춰 아이스팩, 보냉재, 냉장 포장으로 신선하게 배송합니다."
    },
    exchangeInfo: {
      title: "신선식품 특성상 단순 변심 교환/반품 제한",
      body: "상품 이상이나 오배송은 수령 즉시 사진과 함께 고객센터로 문의해주세요."
    },
    originInfo: {
      title: form.origin || "산지 미입력",
      body: "상품별 산지 기준으로 선별 후 출고합니다."
    },
    producerInfo: {
      title: `${form.origin || "산지"} 생산자`,
      body: "관리자가 입력한 생산자 정보가 상세페이지에 반영됩니다."
    },
    isActive: true,
    detail
  };
}

function PreviewPurchaseSlot({ product }: { product: Product }) {
  const firstOption = product.options[0];
  const optionPrice = firstOption?.price ?? product.price + Number(firstOption?.priceDelta ?? 0);

  return (
    <div className="purchase-box admin-preview-purchase-box" aria-label="구매 영역 미리보기">
      <label>옵션 선택</label>
      <select value={firstOption?.id ?? ""} disabled>
        {product.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} ({formatPrice(option.price ?? product.price + option.priceDelta)})
          </option>
        ))}
      </select>
      <div className="quantity-row">
        <span>수량</span>
        <div>
          <button type="button" disabled>-</button>
          <b>1</b>
          <button type="button" disabled>+</button>
        </div>
      </div>
      <div className="total-row">
        <span>예상 결제금액</span>
        <strong>{optionPrice > 0 ? formatPrice(optionPrice) : "가격 미입력"}</strong>
      </div>
      <div className="purchase-actions">
        <button type="button" className="button outline" disabled>장바구니</button>
        <button type="button" className="button teal" disabled>구매하기</button>
      </div>
      <small>미리보기에서는 실제 장바구니/결제 동작이 실행되지 않습니다.</small>
    </div>
  );
}

export function ProductDetailPreview({ form, options, detail }: Props) {
  const [viewMode, setViewMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const product = useMemo(() => buildPreviewProduct(form, options, detail), [form, options, detail]);
  const completedSections = [
    getVisibleProductDetailSections(detail).heroImages.length,
    getVisibleProductDetailSections(detail).benefits.length,
    getVisibleProductDetailSections(detail).journey.length,
    getVisibleProductDetailSections(detail).packaging.length,
    getVisibleProductDetailSections(detail).components.length,
    getVisibleProductDetailSections(detail).faq.length
  ].filter(Boolean).length;

  return (
    <aside className={`admin-live-preview template-preview ${viewMode}-preview`} aria-label="상세페이지 미리보기">
      <div className="admin-live-preview-head">
        <div>
          <span>LIVE PREVIEW</span>
          <strong>{form.name || "상품명을 입력하세요"}</strong>
          <small>실제 상세 템플릿 · 완성 섹션 {completedSections}/6</small>
        </div>
        <div className="admin-preview-mode" aria-label="미리보기 화면 크기">
          <button type="button" className={viewMode === "mobile" ? "active" : ""} onClick={() => setViewMode("mobile")}>모바일</button>
          <button type="button" className={viewMode === "tablet" ? "active" : ""} onClick={() => setViewMode("tablet")}>태블릿</button>
          <button type="button" className={viewMode === "desktop" ? "active" : ""} onClick={() => setViewMode("desktop")}>PC</button>
        </div>
      </div>
      <div className="admin-live-preview-surface">
        <ProductDetailTemplate product={product} purchaseSlot={<PreviewPurchaseSlot product={product} />} />
      </div>
    </aside>
  );
}
