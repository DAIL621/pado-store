"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";
import { getTotalStock, matchesProductSearch } from "@/lib/products/discovery";

type Props = {
  products: Product[];
  categories: string[];
};

type SortKey = "recommended" | "price-low" | "price-high" | "discount-high";

const RECENT_SEARCH_KEY = "pado_recent_searches";
const ALL_CATEGORY = "전체";

function readRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ProductCatalog({ products, categories }: Props) {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const category = searchParams.get("category");
    const keyword = searchParams.get("q");
    const sort = searchParams.get("sort") as SortKey | null;
    if (category && categories.includes(category)) setActiveCategory(category);
    if (keyword) setQuery(keyword);
    if (sort && ["recommended", "price-low", "price-high", "discount-high"].includes(sort)) setSortKey(sort);
    setRecentSearches(readRecentSearches());
  }, [categories, searchParams]);

  const availableCount = useMemo(() => products.filter((product) => getTotalStock(product) > 0).length, [products]);
  const popularSearches = useMemo(
    () => Array.from(new Set(products.flatMap((product) => [product.name, product.origin, product.category]).filter(Boolean))).slice(0, 8),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const filtered = (activeCategory === ALL_CATEGORY ? products : products.filter((product) => product.category === activeCategory))
      .filter((product) => !availableOnly || getTotalStock(product) > 0)
      .filter((product) => matchesProductSearch(product, query));

    return [...filtered].sort((a, b) => {
      const soldOutA = getTotalStock(a) <= 0 ? 1 : 0;
      const soldOutB = getTotalStock(b) <= 0 ? 1 : 0;
      if (soldOutA !== soldOutB) return soldOutA - soldOutB;
      if (sortKey === "price-low") return a.price - b.price;
      if (sortKey === "price-high") return b.price - a.price;
      if (sortKey === "discount-high") return b.discountRate - a.discountRate;
      return products.indexOf(a) - products.indexOf(b);
    });
  }, [activeCategory, availableOnly, products, query, sortKey]);

  const resetFilters = () => {
    setActiveCategory(ALL_CATEGORY);
    setSortKey("recommended");
    setAvailableOnly(false);
    setQuery("");
  };

  const applySearch = (keyword: string) => {
    const value = keyword.trim();
    setQuery(value);
    if (!value) return;
    const next = [value, ...recentSearches.filter((item) => item !== value)].slice(0, 6);
    setRecentSearches(next);
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  };

  const chips = [...recentSearches, ...popularSearches].filter((item, index, list) => list.indexOf(item) === index).slice(0, 10);

  return (
    <>
      <section className="product-search-panel" aria-label="상품 검색">
        <div>
          <span>SEARCH</span>
          <strong>찾는 수산물이 있으신가요?</strong>
          <p>상품명, 산지, 카테고리를 입력하면 바로 상품을 좁혀볼 수 있습니다.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applySearch(query);
          }}
        >
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 전복, 통영, 선물세트" aria-label="상품 검색어" />
          <button type="submit">검색</button>
        </form>
        <div className="product-search-chips" aria-label="추천 검색어">
          {chips.map((keyword) => (
            <button type="button" key={keyword} onClick={() => applySearch(keyword)}>
              {keyword}
            </button>
          ))}
        </div>
      </section>

      <div className="filter-row product-filter-row">
        <div className="product-filter-summary">
          <strong>
            {activeCategory} {visibleProducts.length}개
          </strong>
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
          <p>검색어를 줄이거나 다른 카테고리를 선택해보세요.</p>
          <button type="button" className="button teal" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      )}
    </>
  );
}
