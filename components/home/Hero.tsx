import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

function ProofIcon({ name }: { name: "pin" | "fresh" | "truck" }) {
  if (name === "pin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  }
  if (name === "fresh") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11M7 3.5l5 3 5-3M7 20.5l5-3 5 3M2.8 9l4.9.4.7-4.8M21.2 15l-4.9-.4-.7 4.8M21.2 9l-4.9.4-.7-4.8M2.8 15l4.9-.4.7 4.8" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>;
}

export function Hero({ products }: { products: Product[] }) {
  const popularKeywords = ["완도 전복", "통영 굴", "자연산 돌문어", "목포 먹갈치", "선물세트"];

  return (
    <section className="storefront-intro" id="recommend" aria-label="파도스토리 산지 직송">
      <article className="storefront-hero">
        <Image
          src="/images/story/reference-fishing-boat-hero-v2.png"
          alt="거제도 푸른 바다를 달리는 실제 어선"
          fill
          sizes="100vw"
          priority
        />
        <div className="storefront-hero-content shell">
          <div className="storefront-hero-copy">
            <span className="eyebrow">PADO STORY · FROM THE COAST</span>
            <h1>산지 직송 상품</h1>
            <p>파도스토리는 산지에서 직접 확인하고<br />선별한 신선한 수산물만을 전해드립니다.</p>
          </div>
          <div className="storefront-hero-proof" aria-label="배송 및 선별 안내">
            <span><i><ProofIcon name="pin" /></i><span><b>산지 직송</b><small>산지에서 바로</small></span></span>
            <span><i><ProofIcon name="fresh" /></i><span><b>신선 보장</b><small>선별 · 포장</small></span></span>
            <span><i><ProofIcon name="truck" /></i><span><b>당일 출고</b><small>평일 13시 이전 주문</small></span></span>
          </div>
        </div>
      </article>

      <div className="shell storefront-home-body">
        <section className="storefront-discovery" aria-label="상품 검색과 카테고리">
          <form action="/products" className="storefront-search">
            <label htmlFor="home-product-search">
              <strong>찾는 수산물이 있으신가요?</strong>
              <small>상품명, 산지, 카테고리를 입력하면<br />원하는 상품을 빠르게 찾을 수 있습니다.</small>
            </label>
            <div>
              <input id="home-product-search" name="q" placeholder="예: 전복, 통영, 선물세트" />
              <button type="submit" aria-label="상품 검색"><span aria-hidden="true">⌕</span> 검색</button>
            </div>
          </form>
          <div className="storefront-popular" aria-label="인기 검색어">
            <strong>인기 검색어</strong>
            {popularKeywords.map((keyword) => (
              <Link href={`/products?q=${encodeURIComponent(keyword)}`} key={keyword}>{keyword}</Link>
            ))}
            <details>
              <summary>더보기⌄</summary>
              <div><Link href="/products?q=참소라">참소라</Link><Link href="/products?q=바다장어">바다장어</Link></div>
            </details>
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
          <div className="product-grid featured-grid">
            {products.map((product) => <ProductCard key={product.slug} product={product} compact />)}
          </div>
        </section>
      </div>
    </section>
  );
}
