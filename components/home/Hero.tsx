import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";
import type { HomeBanner } from "@/lib/site/home-banner";

function ProofIcon({ name }: { name: "pin" | "fresh" | "truck" }) {
  if (name === "pin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  }
  if (name === "fresh") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11M7 3.5l5 3 5-3M7 20.5l5-3 5 3M2.8 9l4.9.4.7-4.8M21.2 15l-4.9-.4-.7 4.8M21.2 9l-4.9.4-.7-4.8M2.8 15l4.9-.4.7 4.8" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>;
}

export function Hero({ products, banner }: { products: Product[]; banner: HomeBanner }) {
  const popularKeywords = [...new Set(products
    .filter((product) => product.options.some((option) => Number(option.stock ?? 0) > 0))
    .map((product) => product.name))].slice(0, 5);

  return (
    <section className="storefront-intro" id="recommend" aria-label="파도스토리 산지 직송">
      <article className={banner.showText ? "storefront-hero" : "storefront-hero image-only"}>
        <picture className="storefront-hero-media">
          {banner.mobileImageUrl && <source media="(max-width: 600px)" srcSet={banner.mobileImageUrl} />}
          <Image src={banner.desktopImageUrl} alt={banner.imageAlt} fill sizes="100vw" priority />
        </picture>
        {banner.showText && (
          <div className="storefront-hero-content shell">
            <div className="storefront-hero-copy">
              {banner.eyebrow && <span className="eyebrow">{banner.eyebrow}</span>}
              <h1>{banner.headline}</h1>
              {banner.description && <p>{banner.description}</p>}
              {banner.ctaLabel && banner.ctaHref && <Link className="button teal" href={banner.ctaHref}>{banner.ctaLabel}</Link>}
            </div>
            <div className="storefront-hero-proof" aria-label="배송 및 선별 안내">
              <span><i><ProofIcon name="pin" /></i><span><b>산지 직송</b><small>산지에서 바로</small></span></span>
              <span><i><ProofIcon name="fresh" /></i><span><b>신선 보장</b><small>선별 · 포장</small></span></span>
              <span><i><ProofIcon name="truck" /></i><span><b>당일 출고</b><small>평일 13시 이전 주문</small></span></span>
            </div>
          </div>
        )}
      </article>

      <div className="shell storefront-home-body">
        <section className="storefront-discovery" aria-label="상품 검색과 카테고리">
          <form action="/products" className="storefront-search">
            <label htmlFor="home-product-search">
              <strong>찾는 수산물이 있으신가요?</strong>
              <small>상품명, 산지, 카테고리를 입력하면<br />원하는 상품을 빠르게 찾을 수 있습니다.</small>
            </label>
            <div>
              <input id="home-product-search" name="q" placeholder={popularKeywords[0] ? `예: ${popularKeywords[0]}` : "상품명 또는 산지 검색"} />
              <button type="submit" aria-label="상품 검색"><span aria-hidden="true">⌕</span> 검색</button>
            </div>
          </form>
          <div className="storefront-popular" aria-label="인기 검색어">
            <strong>인기 검색어</strong>
            {popularKeywords.map((keyword) => (
              <Link href={`/products?q=${encodeURIComponent(keyword)}`} key={keyword}>{keyword}</Link>
            ))}
            <Link href="/products">전체 상품 보기</Link>
          </div>
        </section>

        <section className="storefront-best" aria-labelledby="best-products-title">
          <header>
            <div>
              <span className="eyebrow">BEST PRODUCTS</span>
              <h2 id="best-products-title">지금 가장 많이 찾는 산지 상품</h2>
            </div>
            <Link href="/products">전체 상품 보기 <span aria-hidden="true">›</span></Link>
          </header>
          <div className={`product-grid featured-grid${products.length === 1 ? " single-product-grid" : ""}`}>
            {products.map((product) => <ProductCard key={product.slug} product={product} compact />)}
          </div>
        </section>
      </div>
    </section>
  );
}
