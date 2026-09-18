"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type GalleryImage = { label: string; url: string; description?: string };

const ROTATION_INTERVAL_MS = 4000;

export default function ProductHeroGallery({
  productName,
  productOrigin,
  fallbackImage,
  images,
  badge,
  afterContent,
}: {
  productName: string;
  productOrigin: string;
  fallbackImage: string;
  images: GalleryImage[];
  badge?: string;
  afterContent?: ReactNode;
}) {
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    return images
      .filter((image) => image.url?.trim())
      .filter((image) => {
        if (seen.has(image.url)) return false;
        seen.add(image.url);
        return true;
      });
  }, [images]);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const safeGallery = useMemo(() => {
    const available = gallery.filter((image) => !failedUrls.has(image.url));
    if (available.length) return available;
    return [{ label: "대표사진", url: fallbackImage }];
  }, [failedUrls, fallbackImage, gallery]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);
  const visibleIndex = Math.min(previewIndex ?? selectedIndex, safeGallery.length - 1);
  const visibleImage = safeGallery[visibleIndex] ?? safeGallery[0];

  useEffect(() => {
    const updateVisibility = () => setIsPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (safeGallery.length <= 1 || isHovered || isTouching || !isPageVisible) return;
    const interval = window.setInterval(() => {
      setPreviewIndex(null);
      setSelectedIndex((current) => (current + 1) % safeGallery.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isHovered, isPageVisible, isTouching, rotationKey, safeGallery.length]);

  useEffect(() => {
    if (selectedIndex >= safeGallery.length) setSelectedIndex(0);
    if (previewIndex !== null && previewIndex >= safeGallery.length) setPreviewIndex(null);
  }, [previewIndex, safeGallery.length, selectedIndex]);

  const preload = (url: string) => {
    if (typeof window === "undefined") return;
    const image = new window.Image();
    image.src = url;
  };

  const selectImage = useCallback((index: number) => {
    setSelectedIndex(index);
    setPreviewIndex(null);
    setRotationKey((current) => current + 1);
  }, []);

  const excludeBrokenImage = useCallback((url: string) => {
    if (url === fallbackImage && safeGallery.length === 1) return;
    setFailedUrls((current) => {
      const next = new Set(current);
      next.add(url);
      return next;
    });
    setSelectedIndex(0);
    setPreviewIndex(null);
    setRotationKey((current) => current + 1);
  }, [fallbackImage, safeGallery.length]);

  return (
    <div className="detail-master-hero-gallery">
      <div
        className="detail-master-hero-media"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setIsHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            setIsHovered(false);
            setPreviewIndex(null);
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") setIsTouching(true);
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") {
            setIsTouching(false);
            setRotationKey((current) => current + 1);
          }
        }}
        onPointerCancel={() => {
          setIsTouching(false);
          setRotationKey((current) => current + 1);
        }}
      >
        <Image
          key={visibleImage.url}
          src={visibleImage.url}
          alt={visibleImage.description || visibleImage.label || productName}
          fill
          priority={visibleIndex === 0}
          sizes="(max-width: 800px) 100vw, 62vw"
          className="detail-master-selected-image"
          onError={() => excludeBrokenImage(visibleImage.url)}
        />
        {badge && <span className="detail-master-hero-badge">{badge}</span>}
      </div>
      {safeGallery.length > 1 && (
        <div className="detail-master-thumb-rail" aria-label="대표사진 미리보기">
          {safeGallery.map((image, index) => (
            <button
              type="button"
              key={`${image.url}-${index}`}
              className={index === selectedIndex ? "active" : ""}
              aria-pressed={index === selectedIndex}
              aria-label={`${image.label || productName} 이미지 ${index + 1} 보기`}
              onClick={() => selectImage(index)}
              onPointerEnter={(event) => {
                preload(image.url);
                if (event.pointerType === "mouse") setPreviewIndex(index);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setPreviewIndex(null);
              }}
              onFocus={() => preload(image.url)}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="88px"
                onError={() => excludeBrokenImage(image.url)}
              />
              {index === selectedIndex && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
      <section className="detail-purchase-points" aria-labelledby="detail-purchase-points-title">
        <header>
          <span>WHY PADO STORY</span>
          <h2 id="detail-purchase-points-title">구매 포인트</h2>
          <p>산지에서 식탁까지, 신선함을 지키는 기준입니다.</p>
        </header>
        <div>
          <article>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 12c3-4 6-6 10-6 2.5 0 4.5 1 6 3l3-2v10l-3-2c-1.5 2-3.5 3-6 3-4 0-7-2-10-6Z" />
                <circle cx="14.5" cy="10" r=".8" />
              </svg>
            </i>
            <div>
              <strong>100% 국내산</strong>
              <p>{productOrigin} 산지에서 선별한 국내산 수산물</p>
            </div>
          </article>
          <article>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 6h11v10H3zM14 9h3l4 4v3h-7z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
            </i>
            <div>
              <strong>평일 당일 출고</strong>
              <p>오후 1시 이전 주문 시 당일 출고</p>
            </div>
          </article>
          <article>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2v20M4.2 6.5l15.6 9M4.2 17.5l15.6-9" />
                <path d="m9 4 3 3 3-3M9 20l3-3 3 3M4 10l4 1-1-4M20 14l-4-1 1 4M4 14l4-1-1 4M20 10l-4 1 1-4" />
              </svg>
            </i>
            <div>
              <strong>냉장 신선배송</strong>
              <p>신선도를 유지한 냉장 포장 배송</p>
            </div>
          </article>
          <article>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 4.5 6v5.5c0 4.6 3 7.8 7.5 9.5 4.5-1.7 7.5-4.9 7.5-9.5V6L12 3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </i>
            <div>
              <strong>품질 보장</strong>
              <p>선별 검수 후 안전하게 발송</p>
            </div>
          </article>
        </div>
      </section>
      {afterContent}
    </div>
  );
}
