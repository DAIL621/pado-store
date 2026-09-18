"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const productFallbacks: Array<[string, string]> = [
  ["abalone", "/images/products/wando-abalone.webp"],
  ["전복", "/images/products/wando-abalone.webp"],
  ["conch", "/images/products/tongyeong-conch.webp"],
  ["소라", "/images/products/tongyeong-conch.webp"],
  ["oyster", "/images/products/tongyeong-oyster.webp"],
  ["굴", "/images/products/tongyeong-oyster.webp"],
  ["eel", "/images/products/tongyeong-eel.webp"],
  ["장어", "/images/products/tongyeong-eel.webp"],
  ["hairtail", "/images/products/mokpo-hairtail.webp"],
  ["갈치", "/images/products/mokpo-hairtail.webp"],
  ["octopus", "/images/products/tongyeong-octopus.webp"],
  ["문어", "/images/products/tongyeong-octopus.webp"]
];

function fallbackFor(productKey: string) {
  const normalized = productKey.toLowerCase();
  return productFallbacks.find(([keyword]) => normalized.includes(keyword))?.[1] ?? "/images/product-placeholder.svg";
}

export function ProductImage({ productKey, src, alt, ...props }: ImageProps & { productKey: string }) {
  const fallback = fallbackFor(productKey);
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
    />
  );
}
