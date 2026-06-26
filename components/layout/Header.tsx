"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/components/cart/CartProvider";
import { AuthHeaderMenu } from "@/components/auth/AuthHeaderMenu";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const memberPath = user ? "/mypage" : "/login?next=/mypage";

  const shoppingMenu = [
    { icon: "🏠", label: "홈", href: "/" },
    { icon: "🛍", label: "전체상품", href: "/products" },
    { icon: "🦪", label: "제철상품", href: "/#season" },
    { icon: "🔥", label: "인기상품", href: "/#best" },
    { icon: "🎁", label: "선물세트", href: "/products" },
    { icon: "🍲", label: "밀키트", href: "/products" },
    { icon: "📍", label: "산지 이야기", href: "/#producers" }
  ];

  const serviceMenu = [
    { icon: "📦", label: "주문조회", href: memberPath },
    { icon: "🚚", label: "배송조회", href: memberPath },
    { icon: "🎧", label: "고객센터", href: "tel:01031287775" }
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
            <Image src="/images/brand/pado-story-horizontal.webp" alt="파도스토리" width={2760} height={597} priority className="brand-logo-image" />
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
                  <span>안녕하세요</span>
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
                  <strong>로그인하고 주문을 더 편하게 이용하세요</strong>
                  <p>주문조회 · 배송조회 · 재구매 가능</p>
                  <KakaoLoginButton nextPath="/mypage" label="카카오로 3초 로그인" />
                </>
              )}
            </div>
            <span className="mobile-menu-section-title">상품 구매</span>
            {shoppingMenu.map((item) => (
              <Link href={item.href} className="mobile-nav-link" key={item.label}>
                <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <span className="mobile-menu-section-title">주문 · 고객지원</span>
            {serviceMenu.map((item) => {
              const content = (
                <>
                  <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
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
                  <span className="mobile-nav-icon" aria-hidden="true">⚙</span>
                  <span>관리자</span>
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
