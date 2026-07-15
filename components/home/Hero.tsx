"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

type CampaignIconName = "season" | "hot" | "gift" | "meal" | "pin" | "new";

function CampaignIcon({ name }: { name: CampaignIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  const icons: Record<CampaignIconName, ReactNode> = {
    season: (
      <>
        <path {...common} d="M7.8 18.2c5.7-.4 9.3-4.1 9.8-10.8-6.6.5-10.2 4.2-9.8 10.8Z" />
        <path {...common} d="M8 18c2.5-3.3 4.9-5.4 8.5-7" />
      </>
    ),
    hot: <path {...common} d="M12 21c3.3-1.1 5-3.1 5-6 0-2.6-1.5-4.3-3.4-6.2-.6 1.8-1.6 3-3 3.8.5-2.9-.7-5.2-2.5-7C7.8 8.8 6 11.2 6 15c0 3 2.1 5.1 6 6Z" />,
    gift: (
      <>
        <path {...common} d="M4.5 10h15v10h-15V10Z" />
        <path {...common} d="M4 10h16V7H4v3Z" />
        <path {...common} d="M12 7v13" />
        <path {...common} d="M8.5 7C6 5.5 7 3.5 9 4c1.5.4 3 3 3 3s1.5-2.6 3-3c2-.5 3 1.5.5 3" />
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
    pin: (
      <>
        <path {...common} d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Z" />
        <circle {...common} cx="12" cy="11" r="2.2" />
      </>
    ),
    new: (
      <>
        <path {...common} d="M12 3v4" />
        <path {...common} d="M12 17v4" />
        <path {...common} d="M4.2 7.5l3.5 2" />
        <path {...common} d="M16.3 14.5l3.5 2" />
        <path {...common} d="M19.8 7.5l-3.5 2" />
        <path {...common} d="M7.7 14.5l-3.5 2" />
        <circle {...common} cx="12" cy="12" r="3.2" />
      </>
    )
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>;
}

const campaignLinks: Array<{ title: string; icon: CampaignIconName; href: string }> = [
  { title: "제철상품", icon: "season", href: "#season" },
  { title: "인기상품", icon: "hot", href: "#recommend" },
  { title: "선물세트", icon: "gift", href: "/categories/gift-set" },
  { title: "밀키트", icon: "meal", href: "/categories/meal-kit" },
  { title: "산지 이야기", icon: "pin", href: "#today-sea" },
  { title: "신상품", icon: "new", href: "/products" }
];

export function Hero() {
  const featuredProduct = products[0];

  return (
    <section className="hero hero-v2" id="recommend" aria-label="파도스토리 추천 상품 슬라이드">
      <div className="shell home-hero-dashboard">
        <article className="home-hero-story fade-up">
          <Image src="/images/story/timeline-dawn-fishing.png" alt="새벽 바다에서 조업하는 파도스토리 산지 현장" fill sizes="(max-width: 900px) 100vw, 66vw" priority />
          <div>
            <span className="eyebrow light">FROM SEA TO TABLE</span>
            <h1>산지의 오늘을<br />식탁까지</h1>
            <p>새벽 조업부터 선별과 신선 포장까지, 파도스토리가 직접 확인한 바다의 시간을 전합니다.</p>
            <div className="hero-actions"><Link href="#today-sea" className="button coral">오늘의 산지 보기</Link><Link href="/products" className="text-link light">전체 상품 보기</Link></div>
          </div>
        </article>
        <aside className="home-hero-side">
          <Link href="/products" className="home-hero-benefit fade-up">
            <span>EVERYDAY BENEFIT</span><strong>전 상품<br />기본 무료배송</strong><small>배송비 부담 없이 신선하게 받아보세요.</small>
          </Link>
          <Link href={`/products/${featuredProduct.slug}`} className="home-hero-product fade-up">
            <div><Image src={featuredProduct.image} alt={featuredProduct.name} fill sizes="(max-width: 900px) 44vw, 18vw" /></div>
            <section><span>오늘의 제철상품</span><strong>{featuredProduct.name}</strong><small>{featuredProduct.origin} · {featuredProduct.price.toLocaleString("ko-KR")}원~</small></section>
          </Link>
        </aside>
      </div>

      <nav className="shell campaign-menu fade-up" aria-label="기획전 바로가기">
        {campaignLinks.map((item) => (
          <Link href={item.href} key={item.title} className="campaign-card">
            <span><CampaignIcon name={item.icon} /></span>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </nav>

      <div className="shell hero-products hero-products-v2 fade-up">
        <div className="hero-products-head">
          <div>
            <span className="eyebrow">WEEKLY PICKS</span>
            <h2>오늘의 추천 상품</h2>
            <p className="best-subcopy">이번 주 파도스토리에서 먼저 추천하는 상품</p>
          </div>
          <Link href="/products">전체 상품 보기</Link>
        </div>
        <div className="product-grid featured-grid">
          {products.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} compact />)}
        </div>
      </div>
    </section>
  );
}
