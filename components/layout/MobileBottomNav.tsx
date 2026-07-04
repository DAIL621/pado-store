"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

const items = [
  { href: "/", label: "홈", icon: "M4 12h16M6 12l6-6 6 6M7 11v8h10v-8" },
  { href: "/products", label: "상품", icon: "M6.5 9h11l-.7 10H7.2L6.5 9ZM9 9a3 3 0 0 1 6 0" },
  { href: "/categories/gift-set", label: "선물", icon: "M4.5 10h15v10h-15V10ZM4 10h16V7H4v3ZM12 7v13" },
  { href: "/cart", label: "장바구니", icon: "M4 5h2l2 10h8.5L19 8H7M9 20h.1M17 20h.1" },
  { href: "/mypage", label: "마이", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" }
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 빠른 이동">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const showBadge = item.href === "/cart" && ready && count > 0;

        return (
          <Link href={item.href} key={item.href} className={active ? "active" : ""}>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              {showBadge && <b>{count > 99 ? "99+" : count}</b>}
            </span>
            <strong>{item.label}</strong>
          </Link>
        );
      })}
    </nav>
  );
}
