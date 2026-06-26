"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

const slidePlan = [
  { slug: "wando-live-abalone", label: "완도 활전복", title: "오늘 수확한 활전복", copy: "바다 향이 살아 있는 완도 활전복을 가장 신선한 시간에 만나보세요." },
  { slug: "tongyeong-conch", label: "통영 참소라", title: "지금 가장 맛있는 제철 참소라", copy: "쫄깃한 식감과 진한 단맛, 제철 바다의 즐거움을 바로 보내드립니다." },
  { slug: "tongyeong-sea-eel", label: "통영 바다장어", title: "손질 완료, 당일 출고", copy: "집에서는 굽기만 하면 되는 손질 바다장어로 저녁 식탁을 빠르게 준비하세요." },
  { slug: "abalone-porridge", label: "전복 밀키트", title: "집에서도 간편하게", copy: "바쁜 날에도 깊고 고소한 전복의 맛을 간편하게 즐길 수 있습니다." },
  { slug: "pado-gift-set", label: "명절 선물세트", title: "감사의 마음을 전하세요", copy: "받는 분의 식탁까지 신선하게 도착하는 파도스토리 선물세트입니다." }
];

const campaignLinks: Array<{ title: string; icon: CampaignIconName; href: string }> = [
  { title: "제철상품", icon: "season", href: "#season" },
  { title: "인기상품", icon: "hot", href: "#recommend" },
  { title: "선물세트", icon: "gift", href: "/products/pado-gift-set" },
  { title: "밀키트", icon: "meal", href: "/products/abalone-porridge" },
  { title: "산지 이야기", icon: "pin", href: "#today-sea" },
  { title: "신상품", icon: "new", href: "/products" }
];

export function Hero() {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const slides = useMemo(
    () =>
      slidePlan.map((slide) => {
        const product = products.find((item) => item.slug === slide.slug) ?? products[0];
        return {
          ...slide,
          image: product.image,
          href: `/products/${product.slug}`
        };
      }),
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const moveSlide = (direction: -1 | 1) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  const handlePointerUp = (clientX: number) => {
    if (touchStartX.current === null) return;
    const diff = clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diff) < 45) return;
    moveSlide(diff > 0 ? -1 : 1);
  };

  return (
    <section className="hero hero-v2" id="recommend">
      <div
        className="hero-carousel"
        onPointerDown={(event) => {
          touchStartX.current = event.clientX;
        }}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
        onPointerCancel={() => {
          touchStartX.current = null;
        }}
      >
        {slides.map((slide, index) => (
          <article className={`hero-slide ${index === active ? "active" : ""}`} key={slide.slug} aria-hidden={index !== active}>
            <div className="hero-slide-image">
              <Image src={slide.image} alt={slide.label} fill sizes="100vw" priority={index === 0} />
            </div>
            <div className="shell hero-slide-copy fade-up">
              <span className="eyebrow light">{slide.label}</span>
              <h1>{slide.title}</h1>
              <p>{slide.copy}</p>
              <div className="hero-actions">
                <Link href={slide.href} className="button coral">상품 보기</Link>
                <Link href="/products" className="text-link light">전체 상품 보기</Link>
              </div>
              <div className="hero-proof-row" aria-label="배송 및 신선도 안내">
                <span><b>✓</b>산지 직송</span>
                <span><b>✓</b>오후 1시 이전 당일 출고</span>
                <span><b>✓</b>전국 냉장배송</span>
              </div>
            </div>
          </article>
        ))}

        <button className="hero-arrow hero-arrow-prev" type="button" onClick={() => moveSlide(-1)} aria-label="이전 슬라이드">‹</button>
        <button className="hero-arrow hero-arrow-next" type="button" onClick={() => moveSlide(1)} aria-label="다음 슬라이드">›</button>
        <div className="hero-indicators" aria-label="슬라이드 선택">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.slug}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`${index + 1}번 슬라이드 보기`}
            />
          ))}
        </div>
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
