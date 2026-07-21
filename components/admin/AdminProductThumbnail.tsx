"use client";
import { useEffect, useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/products/image";

export function AdminProductThumbnail({ src, name }: { src: string; name: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src || PRODUCT_IMAGE_PLACEHOLDER);
  useEffect(() => setResolvedSrc(src || PRODUCT_IMAGE_PLACEHOLDER), [src]);
  return <img src={resolvedSrc} alt={`${name} 대표 이미지`} onError={() => setResolvedSrc(PRODUCT_IMAGE_PLACEHOLDER)} />;
}
