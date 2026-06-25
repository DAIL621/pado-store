"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { AuthHeaderMenu } from "@/components/auth/AuthHeaderMenu";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="notice-bar">산지의 오늘을 식탁까지 · 평일 오후 1시 이전 주문 당일 출고</div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand" aria-label="파도스토리 홈">
            <span className="brand-mark">파</span>
            <span><strong>파도스토리</strong><small>PADO STORY SEAFOOD</small></span>
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "메뉴 닫기" : "메뉴 열기"}>
            {open ? "×" : "☰"}
          </button>
          <nav className={open ? "nav open" : "nav"} onClick={() => setOpen(false)} aria-label="주요 메뉴">
            <Link href="/products">전체 상품</Link>
            <Link href="/#season">제철 수산물</Link>
            <Link href="/#producers">산지 이야기</Link>
            <Link href="/#trust">파도스토리 소개</Link>
            <Link href="/admin">관리자</Link>
          </nav>
          <div className="header-actions">
            <AuthHeaderMenu />
            <Link href="/cart" className="cart-link" aria-label={`장바구니 ${count}개`}><span>장바구니</span><b>{count}</b></Link>
          </div>
        </div>
      </header>
    </>
  );
}
