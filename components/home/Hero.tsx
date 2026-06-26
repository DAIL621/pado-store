import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

export function Hero() {
  const quickLinks = [
    ["제철상품", "旬", "#season"],
    ["인기상품", "BEST", "#best"],
    ["할인상품", "%", "/products"],
    ["산지직송", "産", "/#trust"],
    ["선물세트", "Gift", "/products"],
    ["재구매", "↻", "/mypage"]
  ];

  return (
    <section className="hero" id="best">
      <div className="shell hero-copy">
        <span className="eyebrow light">산지에서 식탁까지</span>
        <h1>오늘 바다의 신선함을<br />가장 가까이 만나는 법</h1>
        <p>통영·완도·목포의 생산자와 직접 연결해<br />선별한 수산물을 신선하게 보내드립니다.</p>
        <div className="hero-actions"><Link href="/products" className="button coral">산지 직송 상품 보기</Link><Link href="#season" className="text-link light">이번 달 제철 확인 →</Link></div>
      </div>
      <div className="shell mobile-shop-menu">
        {quickLinks.map(([label, icon, href]) => (
          <Link href={href} key={label}>
            <span>{icon}</span>
            <strong>{label}</strong>
          </Link>
        ))}
      </div>
      <div className="shell hero-products">
        <div className="hero-products-head"><div><span className="eyebrow">TODAY&apos;S BEST</span><h2>오늘 가장 많이 찾는 상품</h2></div><Link href="/products">전체 상품 보기 →</Link></div>
        <div className="mobile-promo-strip"><strong>오늘 출고 찬스</strong><span>평일 오후 1시 전 주문 당일 출고</span></div>
        <div className="product-grid featured-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} compact />)}</div>
      </div>
    </section>
  );
}
