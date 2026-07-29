"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type GalleryImage = { label: string; url: string; description?: string };

const ROTATION_INTERVAL_MS = 4000;

export default function ProductHeroGallery({
  productName,
  fallbackImage,
  images,
  badge,
}: {
  productName: string;
  fallbackImage: string;
  images: GalleryImage[];
  badge?: string;
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
    </div>
  );
}
