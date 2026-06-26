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
  const [loadingUser, setLoadingUser] = useState(true);
  const memberPath = user ? "/mypage" : "/login?next=/mypage";

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoadingUser(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
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
                  <strong>로그인하고 주문내역을 확인하세요</strong>
                  <p>주문조회 · 배송조회 · 재구매를 더 쉽게 이용할 수 있어요</p>
                  <KakaoLoginButton nextPath="/mypage" label="카카오로 3초 로그인" />
                </>
              )}
            </div>
            <Link href="/" className="mobile-nav-link">홈</Link>
            <Link href="/products" className="mobile-nav-link">전체상품</Link>
            <Link href="/#season" className="mobile-nav-link">제철상품</Link>
            <Link href="/#best" className="mobile-nav-link">인기상품</Link>
            <Link href="/products" className="mobile-nav-link">할인상품</Link>
            <Link href="/products" className="mobile-nav-link">선물세트</Link>
            <Link href="/cart" className="mobile-nav-link">장바구니</Link>
            <Link href={memberPath} className="mobile-nav-link">주문조회</Link>
            <Link href={memberPath} className="mobile-nav-link">배송조회</Link>
            <a href="tel:01031287775" className="mobile-nav-link">고객센터</a>
            <Link href="/admin" className="mobile-nav-link admin-nav-link">관리자</Link>
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
