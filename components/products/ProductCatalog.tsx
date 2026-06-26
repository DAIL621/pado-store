"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

type Props = {
  products: Product[];
  categories: string[];
};

export function ProductCatalog({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState("전체");
  const visibleProducts = useMemo(
    () => activeCategory === "전체" ? products : products.filter((product) => product.category === activeCategory),
    [activeCategory, products]
  );

  return (
    <>
      <div className="filter-row product-filter-row">
        <strong>{activeCategory} {visibleProducts.length}개</strong>
        <div role="tablist" aria-label="상품 카테고리">
          {categories.map((label) => (
            <button
              type="button"
              className={activeCategory === label ? "active" : ""}
              key={label}
              role="tab"
              aria-selected={activeCategory === label}
              onClick={() => setActiveCategory(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
