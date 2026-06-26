import Link from "next/link";
import type { ReactNode } from "react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

type QuickIconName = "season" | "hot" | "all" | "meal" | "gift" | "pin";

function QuickIcon({ name }: { name: QuickIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  const paths: Record<QuickIconName, ReactNode> = {
    season: (
      <>
        <path {...common} d="M7.8 18.2c5.7-.4 9.3-4.1 9.8-10.8-6.6.5-10.2 4.2-9.8 10.8Z" />
        <path {...common} d="M8 18c2.5-3.3 4.9-5.4 8.5-7" />
      </>
    ),
    hot: <path {...common} d="M12 21c3.3-1.1 5-3.1 5-6 0-2.6-1.5-4.3-3.4-6.2-.6 1.8-1.6 3-3 3.8.5-2.9-.7-5.2-2.5-7C7.8 8.8 6 11.2 6 15c0 3 2.1 5.1 6 6Z" />,
    all: (
      <>
        <path {...common} d="M6.5 9h11l-.7 10H7.2L6.5 9Z" />
        <path {...common} d="M9 9a3 3 0 0 1 6 0" />
      </>
    ),
    meal: (
      <>
        <path {...common} d="M5 12h14l-1.2 7H6.2L5 12Z" />
        <path {...common} d="M8 12V8" />
        <path {...common} d="M12 12V6" />
        <path {...common} d="M16 12V8" />
      </>
    ),
    gift: (
      <>
        <path {...common} d="M4.5 10h15v10h-15V10Z" />
        <path {...common} d="M4 10h16V7H4v3Z" />
        <path {...common} d="M12 7v13" />
        <path {...common} d="M8.5 7C6 5.5 7 3.5 9 4c1.5.4 3 3 3 3s1.5-2.6 3-3c2-.5 3 1.5.5 3" />
      </>
    ),
    pin: (
      <>
        <path {...common} d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Z" />
        <circle {...common} cx="12" cy="11" r="2.2" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function Hero() {
  const quickLinks: Array<[string, QuickIconName, string]> = [
    ["제철상품", "season", "#season"],
    ["인기상품", "hot", "#best"],
    ["전체상품", "all", "/products"],
    ["밀키트", "meal", "/products"],
    ["선물세트", "gift", "/products"],
    ["산지이야기", "pin", "#producers"]
  ];

  return (
    <section className="hero" id="best">
      <div className="shell hero-copy fade-up">
        <span className="eyebrow light">산지에서 식탁까지</span>
        <h1>오늘 바다의 신선함을<br />가장 가까이 만나는 법</h1>
        <p>통영·완도·목포의 생산자와 직접 연결해<br />선별한 수산물을 신선하게 보내드립니다.</p>
        <div className="hero-actions">
          <Link href="/products" className="button coral">산지 직송 상품 보기</Link>
          <Link href="#season" className="text-link light">이번 달 제철 확인</Link>
        </div>
        <div className="hero-proof-row" aria-label="배송 및 품질 안내">
          <span><b>✓</b> 산지 직송</span>
          <span><b>✓</b> 1시 전 당일 출고</span>
          <span><b>✓</b> 전국 냉장배송</span>
        </div>
      </div>
      <div className="shell mobile-shop-menu fade-up">
        {quickLinks.map(([label, icon, href]) => (
          <Link href={href} key={label}>
            <span><QuickIcon name={icon} /></span>
            <strong>{label}</strong>
          </Link>
        ))}
      </div>
      <div className="shell hero-products fade-up">
        <div className="hero-products-head">
          <div>
            <span className="eyebrow">TODAY&apos;S BEST</span>
            <h2>오늘 가장 많이 찾는 상품</h2>
            <p className="best-subcopy">실시간 인기 상품</p>
          </div>
          <Link href="/products">전체 상품 보기</Link>
        </div>
        <div className="product-grid featured-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} compact />)}</div>
      </div>
    </section>
  );
}
