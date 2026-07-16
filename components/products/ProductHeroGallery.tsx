"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type GalleryImage = { label: string; url: string; description?: string };

export default function ProductHeroGallery({ productName, fallbackImage, images, badge }: { productName: string; fallbackImage: string; images: GalleryImage[]; badge?: string }) {
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    return images.filter((image) => image.url?.trim()).filter((image) => {
      if (seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    });
  }, [images]);
  const safeGallery = gallery.length ? gallery : [{ label: "대표사진", url: fallbackImage }];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const visibleIndex = previewIndex ?? selectedIndex;
  const visibleImage = safeGallery[visibleIndex] ?? safeGallery[0];
  const preload = (url: string) => {
    if (typeof window === "undefined") return;
    const image = new window.Image();
    image.src = url;
  };

  return <div className="detail-master-hero-gallery">
    <div className="detail-master-hero-media">
      <Image key={visibleImage.url} src={visibleImage.url} alt={visibleImage.description || visibleImage.label || productName} fill priority={visibleIndex === 0} sizes="(max-width: 800px) 100vw, 62vw" className="detail-master-selected-image" />
      {badge && <span className="detail-master-hero-badge">{badge}</span>}
    </div>
    {safeGallery.length > 1 && <div className="detail-master-thumb-rail" aria-label="대표사진 미리보기">
      {safeGallery.map((image, index) => <button type="button" key={`${image.url}-${index}`} className={index === selectedIndex ? "active" : ""} aria-pressed={index === selectedIndex} aria-label={`${image.label || productName} 이미지 ${index + 1} 보기`} onClick={() => { setSelectedIndex(index); setPreviewIndex(null); }} onPointerEnter={(event) => { preload(image.url); if (event.pointerType === "mouse") setPreviewIndex(index); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setPreviewIndex(null); }} onFocus={() => preload(image.url)}>
        <Image src={image.url} alt="" fill sizes="84px" />
        {index === selectedIndex && <span aria-hidden="true">✓</span>}
      </button>)}
    </div>}
  </div>;
}
