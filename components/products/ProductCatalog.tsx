"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

type Props = {
  products: Product[];
  categories: string[];
};

type SortKey = "recommended" | "price-low" | "price-high" | "discount-high";

function getTotalStock(product: Product) {
  return product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
}

export function ProductCatalog({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);
  const availableCount = useMemo(() => products.filter((product) => getTotalStock(product) > 0).length, [products]);
  const visibleProducts = useMemo(() => {
    const filtered = (activeCategory === "전체" ? products : products.filter((product) => product.category === activeCategory))
      .filter((product) => !availableOnly || getTotalStock(product) > 0);
    return [...filtered].sort((a, b) => {
      const soldOutA = getTotalStock(a) <= 0 ? 1 : 0;
      const soldOutB = getTotalStock(b) <= 0 ? 1 : 0;
      if (soldOutA !== soldOutB) return soldOutA - soldOutB;
      if (sortKey === "price-low") return a.price - b.price;
      if (sortKey === "price-high") return b.price - a.price;
      if (sortKey === "discount-high") return b.discountRate - a.discountRate;
      return products.indexOf(a) - products.indexOf(b);
    });
  }, [activeCategory, availableOnly, products, sortKey]);

  const resetFilters = () => {
    setActiveCategory("전체");
    setSortKey("recommended");
    setAvailableOnly(false);
  };

  return (
    <>
      <div className="filter-row product-filter-row">
        <div className="product-filter-summary">
          <strong>{activeCategory} {visibleProducts.length}개</strong>
          <label>
            <span>정렬</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              <option value="recommended">추천순</option>
              <option value="price-low">낮은 가격순</option>
              <option value="price-high">높은 가격순</option>
              <option value="discount-high">할인율 높은순</option>
            </select>
          </label>
          <button
            type="button"
            className={`stock-filter-button ${availableOnly ? "active" : ""}`}
            aria-pressed={availableOnly}
            onClick={() => setAvailableOnly((current) => !current)}
          >
            구매 가능만 {availableCount}
          </button>
        </div>
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
      {visibleProducts.length ? (
        <div className="product-grid" id="product-list">
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-cart product-empty-state">
          <span aria-hidden="true">SHOP</span>
          <h2>조건에 맞는 상품이 없습니다</h2>
          <p>다른 카테고리를 선택해보세요.</p>
          <button type="button" className="button teal" onClick={resetFilters}>필터 초기화</button>
        </div>
      )}
    </>
  );
}
