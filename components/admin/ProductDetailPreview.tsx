"use client";

import { formatPrice, type ProductOption } from "@/data/products";
import type { ProductDetail } from "@/lib/products/detail";

type PreviewForm = {
  name: string;
  origin: string;
  subtitle: string;
  basePrice: string;
  imageUrl: string;
  badge: string;
};

type Props = {
  form: PreviewForm;
  options: Array<Pick<ProductOption, "label" | "priceDelta" | "stock">>;
  detail: ProductDetail;
};

export function ProductDetailPreview({ form, options, detail }: Props) {
  const price = Number(form.basePrice) || 0;
  const mainImage = detail.heroImages.find((image) => image.url)?.url || form.imageUrl || "/images/products/wando-abalone.webp";
  const benefits = detail.benefits.filter(Boolean);
  const packaging = detail.packaging.filter(Boolean);
  const components = detail.components.filter(Boolean);
  const faq = detail.faq.filter((item) => item.question || item.answer);

  return (
    <aside className="admin-live-preview" aria-label="상세페이지 미리보기">
      <div className="admin-live-preview-head">
        <span>LIVE PREVIEW</span>
        <strong>{form.name || "상품명을 입력하세요"}</strong>
      </div>
      <div className="admin-live-preview-image">
        <img src={mainImage} alt="대표 이미지 미리보기" />
        {form.badge && <em>{form.badge}</em>}
      </div>
      <div className="admin-live-preview-body">
        <span>{form.origin || "산지 미입력"}</span>
        <h3>{form.name || "상품명 미입력"}</h3>
        <p>{form.subtitle || "상품 한 줄 설명이 여기에 표시됩니다."}</p>
        <strong>{price ? `${formatPrice(price)}~` : "가격 미입력"}</strong>
      </div>
      <div className="admin-live-preview-section">
        <b>옵션</b>
        {options.filter((option) => option.label).length ? (
          options.filter((option) => option.label).map((option, index) => (
            <span key={`${option.label}-${index}`}>{option.label} · 재고 {option.stock ?? 0}</span>
          ))
        ) : (
          <span>옵션을 입력하면 표시됩니다.</span>
        )}
      </div>
      <div className="admin-live-preview-section">
        <b>상품 장점</b>
        {benefits.length ? benefits.map((item) => <span key={item}>{item}</span>) : <span>장점을 입력하면 카드로 자동 생성됩니다.</span>}
      </div>
      <div className="admin-live-preview-section">
        <b>포장 / 배송</b>
        {packaging.length ? packaging.slice(0, 4).map((item) => <span key={item}>{item}</span>) : <span>배송 안내가 자동 표시됩니다.</span>}
      </div>
      <div className="admin-live-preview-section">
        <b>구성품</b>
        {components.length ? components.map((item) => <span key={item}>{item}</span>) : <span>구성품을 입력하면 목록으로 표시됩니다.</span>}
      </div>
      <div className="admin-live-preview-section">
        <b>FAQ</b>
        {faq.length ? faq.slice(0, 3).map((item, index) => <span key={`${item.question}-${index}`}>Q. {item.question || "질문 미입력"}</span>) : <span>FAQ를 입력하면 접이식 질문으로 표시됩니다.</span>}
      </div>
    </aside>
  );
}
