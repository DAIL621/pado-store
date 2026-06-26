"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/components/cart/CartProvider";
import { AuthHeaderMenu } from "@/components/auth/AuthHeaderMenu";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { createClient } from "@/lib/supabase/client";

type MenuIconName =
  | "home"
  | "bag"
  | "season"
  | "hot"
  | "gift"
  | "meal"
  | "pin"
  | "box"
  | "truck"
  | "headset"
  | "settings";

type MobileMenuItem = {
  icon: MenuIconName;
  label: string;
  description: string;
  href: string;
};

function MenuIcon({ name }: { name: MenuIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  const paths: Record<MenuIconName, ReactNode> = {
    home: (
      <>
        <path {...common} d="M4 11.5 12 5l8 6.5" />
        <path {...common} d="M6.5 10.5V19h11v-8.5" />
        <path {...common} d="M10 19v-5h4v5" />
      </>
    ),
    bag: (
      <>
        <path {...common} d="M6.5 9h11l-.7 10H7.2L6.5 9Z" />
        <path {...common} d="M9 9a3 3 0 0 1 6 0" />
      </>
    ),
    season: (
      <>
        <path {...common} d="M8 18c5.5-.5 9-4 9.5-10.5C11 8 7.5 11.5 8 18Z" />
        <path {...common} d="M8 18c2.5-3.3 4.9-5.4 8.5-7" />
      </>
    ),
    hot: (
      <path
        {...common}
        d="M12 21c3.3-1.1 5-3.1 5-6 0-2.6-1.5-4.3-3.4-6.2-.6 1.8-1.6 3-3 3.8.5-2.9-.7-5.2-2.5-7C7.8 8.8 6 11.2 6 15c0 3 2.1 5.1 6 6Z"
      />
    ),
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
        <path {...common} d="M7 19h10" />
      </>
    ),
    pin: (
      <>
        <path {...common} d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Z" />
        <circle {...common} cx="12" cy="11" r="2.2" />
      </>
    ),
    box: (
      <>
        <path {...common} d="M5 8.5 12 5l7 3.5v7L12 19l-7-3.5v-7Z" />
        <path {...common} d="m5 8.5 7 3.5 7-3.5" />
        <path {...common} d="M12 12v7" />
      </>
    ),
    truck: (
      <>
        <path {...common} d="M4 7h10v9H4V7Z" />
        <path {...common} d="M14 10h3l3 3v3h-6v-6Z" />
        <circle {...common} cx="8" cy="18" r="1.5" />
        <circle {...common} cx="17" cy="18" r="1.5" />
      </>
    ),
    headset: (
      <>
        <path {...common} d="M5 13a7 7 0 0 1 14 0" />
        <path {...common} d="M5 13v4h3v-5H5Z" />
        <path {...common} d="M19 13v4h-3v-5h3Z" />
        <path {...common} d="M16 19h-3" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path
          {...common}
          d="M19 12a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z"
        />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const memberPath = user ? "/mypage" : "/login?next=/mypage";

  const shoppingMenu: MobileMenuItem[] = [
    { icon: "home", label: "홈", description: "오늘의 산지 상품 보기", href: "/" },
    { icon: "bag", label: "전체상품", description: "모든 수산물을 한눈에 보기", href: "/products" },
    { icon: "season", label: "제철상품", description: "이번 달 가장 맛있는 수산물", href: "/#season" },
    { icon: "hot", label: "인기상품", description: "고객이 가장 많이 구매한 상품", href: "/#best" },
    { icon: "gift", label: "선물세트", description: "명절·감사 선물 추천", href: "/products" },
    { icon: "meal", label: "밀키트", description: "간편하게 즐기는 수산 밀키트", href: "/products" },
    { icon: "pin", label: "산지 이야기", description: "생산자와 산지 소개", href: "/#producers" }
  ];

  const serviceMenu: MobileMenuItem[] = [
    { icon: "box", label: "주문조회", description: "주문내역과 재구매 확인", href: memberPath },
    { icon: "truck", label: "배송조회", description: "배송상태와 송장 확인", href: memberPath },
    { icon: "headset", label: "고객센터", description: "전화 상담과 문자 문의", href: "tel:01031287775" }
  ];

  useEffect(() => {
    const supabase = createClient();

    const setSessionUser = async (nextUser: User | null) => {
      setUser(nextUser);
      setIsAdmin(false);

      if (nextUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", nextUser.id)
          .maybeSingle();
        setIsAdmin(profile?.role === "admin");
      }

      setLoadingUser(false);
    };

    supabase.auth.getUser().then(({ data }) => setSessionUser(data.user ?? null));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <div className="notice-bar">산지의 오늘을 식탁까지 · 평일 오후 1시 이전 주문 당일 출고</div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand logo-brand" aria-label="파도스토리 홈">
            <Image
              src="/images/brand/pado-story-horizontal.webp"
              alt="파도스토리"
              width={2760}
              height={597}
              priority
              className="brand-logo-image"
            />
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "메뉴 닫기" : "메뉴 열기"}>
            <span />
            <span />
            <span />
          </button>
          <nav className={open ? "nav open" : "nav"} onClick={() => setOpen(false)} aria-label="주요 메뉴">
            <div className="mobile-account-card" onClick={(event) => event.stopPropagation()}>
              {loadingUser ? (
                <span className="auth-loading">로그인 확인중</span>
              ) : user ? (
                <>
                  <span>안녕하세요.</span>
                  <strong>{user.email ?? "파도스토리 고객"}님</strong>
                  <div className="mobile-account-actions">
                    <Link href="/mypage" onClick={() => setOpen(false)}>마이페이지</Link>
                    <Link href="/mypage" onClick={() => setOpen(false)}>주문내역</Link>
                  </div>
                  <form action="/auth/logout" method="post">
                    <button type="submit">로그아웃</button>
                  </form>
                </>
              ) : (
                <>
                  <strong>로그인하면 주문조회·배송조회·재구매가 가능합니다.</strong>
                  <KakaoLoginButton nextPath="/mypage" label="카카오로 3초 로그인" />
                </>
              )}
            </div>
            <span className="mobile-menu-section-title">상품 구매</span>
            {shoppingMenu.map((item) => (
              <Link href={item.href} className="mobile-nav-link" key={item.label}>
                <span className="mobile-nav-icon"><MenuIcon name={item.icon} /></span>
                <span className="mobile-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                <span className="mobile-nav-chevron" aria-hidden="true">&gt;</span>
              </Link>
            ))}
            <span className="mobile-menu-section-title">주문 · 고객지원</span>
            {serviceMenu.map((item) => {
              const content = (
                <>
                  <span className="mobile-nav-icon"><MenuIcon name={item.icon} /></span>
                  <span className="mobile-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                  <span className="mobile-nav-chevron" aria-hidden="true">&gt;</span>
                </>
              );

              return item.href.startsWith("tel:") ? (
                <a href={item.href} className="mobile-nav-link" key={item.label}>{content}</a>
              ) : (
                <Link href={item.href} className="mobile-nav-link" key={item.label}>{content}</Link>
              );
            })}
            {isAdmin && (
              <>
                <span className="mobile-menu-section-title">관리</span>
                <Link href="/admin" className="mobile-nav-link admin-nav-link">
                  <span className="mobile-nav-icon"><MenuIcon name="settings" /></span>
                  <span className="mobile-nav-copy"><strong>관리자</strong><small>상품·주문·배송 관리</small></span>
                  <span className="mobile-nav-chevron" aria-hidden="true">&gt;</span>
                </Link>
              </>
            )}
            <Link href="/products" className="desktop-nav-link">전체 상품</Link>
            <Link href="/#season" className="desktop-nav-link">제철 수산물</Link>
            <Link href="/#producers" className="desktop-nav-link">산지 이야기</Link>
            <Link href="/#trust" className="desktop-nav-link">파도스토리 소개</Link>
            <Link href="/admin" className="desktop-nav-link">관리자</Link>
          </nav>
          <div className="header-actions">
            <AuthHeaderMenu />
            <Link href="/products" className="search-link" aria-label="상품 검색"><span className="search-icon" aria-hidden="true" /></Link>
            <Link href="/cart" className="cart-link" aria-label={`장바구니 ${count}개`}><span className="cart-icon" aria-hidden="true" /><span>장바구니</span><b>{count}</b></Link>
          </div>
        </div>
      </header>
    </>
  );
}
