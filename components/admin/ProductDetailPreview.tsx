"use client";

import { useState } from "react";
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
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const price = Number(form.basePrice) || 0;
  const fallbackImage = form.imageUrl || "/images/products/wando-abalone.webp";
  const mainImage = detail.heroImages.find((image) => image.url)?.url || fallbackImage;
  const heroImages = detail.heroImages.filter((image) => image.url);
  const benefits = detail.benefits.filter(Boolean);
  const journey = detail.journey.filter((step) => step.description || step.image);
  const packaging = detail.packaging.filter(Boolean);
  const components = detail.components.filter(Boolean);
  const faq = detail.faq.filter((item) => item.question || item.answer);
  const completedSections = [
    heroImages.length,
    benefits.length,
    journey.length,
    packaging.length,
    components.length,
    faq.length
  ].filter(Boolean).length;

  return (
    <aside className={`admin-live-preview ${viewMode === "desktop" ? "desktop-preview" : "mobile-preview"}`} aria-label="상세페이지 미리보기">
      <div className="admin-live-preview-head">
        <div>
          <span>LIVE PREVIEW</span>
          <strong>{form.name || "상품명을 입력하세요"}</strong>
          <small>완성 섹션 {completedSections}/6</small>
        </div>
        <div className="admin-preview-mode" aria-label="미리보기 화면 크기">
          <button type="button" className={viewMode === "mobile" ? "active" : ""} onClick={() => setViewMode("mobile")}>모바일</button>
          <button type="button" className={viewMode === "desktop" ? "active" : ""} onClick={() => setViewMode("desktop")}>PC</button>
        </div>
      </div>
      <div className="admin-live-preview-image">
        <img
          src={mainImage}
          alt="대표 이미지 미리보기"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied) return;
            event.currentTarget.dataset.fallbackApplied = "true";
            event.currentTarget.src = fallbackImage;
          }}
        />
        {form.badge && <em>{form.badge}</em>}
      </div>
      {heroImages.length > 1 && (
        <div className="admin-live-preview-thumbs" aria-label="대표사진 슬라이더 미리보기">
          {heroImages.slice(0, 6).map((image, index) => (
            <span key={`${image.url}-${index}`} className={index === 0 ? "active" : ""}>
              <img
                src={image.url}
                alt={`${image.label} 썸네일`}
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied) return;
                  event.currentTarget.dataset.fallbackApplied = "true";
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </span>
          ))}
        </div>
      )}
      <div className="admin-live-preview-body">
        <span>{form.origin || "산지 미입력"}</span>
        <h3>{form.name || "상품명 미입력"}</h3>
        <p>{form.subtitle || "상품 한 줄 설명이 여기에 표시됩니다."}</p>
        <strong>{price ? `${formatPrice(price)}~` : "가격 미입력"}</strong>
        <button type="button" className="admin-preview-cta">구매하기 CTA</button>
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
      <div className="admin-live-preview-section admin-preview-card-grid">
        <b>상품 장점</b>
        {benefits.length ? benefits.slice(0, 5).map((item) => <span key={item}>{item}</span>) : <span>장점을 입력하면 카드로 자동 생성됩니다.</span>}
      </div>
      <div className="admin-live-preview-section admin-preview-timeline">
        <b>산지에서 식탁까지</b>
        {journey.length ? (
          journey.slice(0, 5).map((step, index) => (
            <span key={`${step.key}-${index}`}>
              <em>{index + 1}</em>
              {step.title || `단계 ${index + 1}`}
            </span>
          ))
        ) : (
          <span>산지 여정을 입력하면 타임라인으로 표시됩니다.</span>
        )}
      </div>
      <div className="admin-live-preview-section admin-preview-card-grid">
        <b>포장 / 배송</b>
        {packaging.length ? packaging.slice(0, 4).map((item) => <span key={item}>{item}</span>) : <span>배송 안내가 자동 표시됩니다.</span>}
      </div>
      <div className="admin-live-preview-section admin-preview-card-grid">
        <b>구성품</b>
        {components.length ? components.map((item) => <span key={item}>{item}</span>) : <span>구성품을 입력하면 목록으로 표시됩니다.</span>}
      </div>
      <div className="admin-live-preview-section admin-preview-faq">
        <b>FAQ</b>
        {faq.length ? (
          faq.slice(0, 3).map((item, index) => (
            <details key={`${item.question}-${index}`} open={index === 0}>
              <summary>Q. {item.question || "질문 미입력"}</summary>
              <p>{item.answer || "답변 미입력"}</p>
            </details>
          ))
        ) : (
          <span>FAQ를 입력하면 접이식 질문으로 표시됩니다.</span>
        )}
      </div>
    </aside>
  );
}
