"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

const STORAGE_KEY = "pado_recent_products";

function readRecentSlugs() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function RecentViewedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const current = readRecentSlugs().filter((item) => item !== slug);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([slug, ...current].slice(0, 12)));
  }, [slug]);

  return null;
}

export function RecentViewedProducts({ products, currentSlug }: { products: Product[]; currentSlug?: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(readRecentSlugs());
  }, []);

  const visibleProducts = useMemo(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return slugs
      .filter((slug) => slug !== currentSlug)
      .map((slug) => bySlug.get(slug))
      .filter((product): product is Product => Boolean(product))
      .slice(0, 4);
  }, [currentSlug, products, slugs]);

  if (!visibleProducts.length) return null;

  return (
    <section className="section recent-viewed-section" aria-label="최근 본 상품">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RECENTLY VIEWED</span>
            <h2>최근 본 상품</h2>
            <p>방금 살펴본 상품을 빠르게 다시 확인할 수 있습니다.</p>
          </div>
        </div>
        <div className="product-grid recent-viewed-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
