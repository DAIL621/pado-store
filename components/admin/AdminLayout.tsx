import Link from "next/link";

export type AdminUser = {
  name: string | null;
  email?: string;
  role: "admin";
};

type AdminNavKey =
  | "dashboard"
  | "products"
  | "orders"
  | "shipments"
  | "members"
  | "reviews"
  | "marketing"
  | "content"
  | "stats"
  | "automation"
  | "ai";

export function AdminLayout({
  admin,
  active,
  title,
  subtitle,
  children
}: {
  admin: AdminUser;
  active: AdminNavKey;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const navItems: { key: AdminNavKey; label: string; href: string }[] = [
    { key: "dashboard", label: "대시보드", href: "/admin" },
    { key: "products", label: "상품 관리", href: "/admin/products" },
    { key: "orders", label: "주문 관리", href: "/admin/orders" },
    { key: "shipments", label: "배송 관리", href: "/admin/deliveries" },
    { key: "members", label: "회원 관리", href: "/admin/members" },
    { key: "reviews", label: "리뷰 관리", href: "/admin/reviews" },
    { key: "marketing", label: "쿠폰·배너", href: "/admin/marketing" },
    { key: "content", label: "공지·FAQ", href: "/admin/content" },
    { key: "stats", label: "통계", href: "/admin/stats" },
    { key: "automation", label: "운영 자동화", href: "/admin/automation" },
    { key: "ai", label: "AI 운영센터", href: "/admin/ai/images" }
  ];

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <strong>파도스토리</strong>
        <span>STORE ADMIN</span>
        <nav>
          {navItems.map((item) => (
            <span className="admin-nav-group" key={item.key}>
              <Link className={active === item.key ? "active" : ""} href={item.href}>
                {item.label}
              </Link>
              {item.key === "ai" && (
                <span className="admin-ai-subnav">
                  <Link href="/admin/ai/images">AI 사진분석</Link>
                  <Link href="/admin/ai/dataset">AI Dataset</Link>
                  <Link href="/admin/ai/dashboard">AI Dashboard</Link>
                  <Link href="/admin/ai/review">AI Review Center</Link>
                </span>
              )}
            </span>
          ))}
        </nav>
        <form action="/auth/logout" method="post">
          <button type="submit">관리자 로그아웃</button>
        </form>
      </aside>

      <section className="admin-main">
        <div className="admin-head">
          <div>
            <span>{subtitle}</span>
            <h1>{title}</h1>
          </div>
          <a className="button outline" href="/products" target="_blank">라이브몰 보기</a>
        </div>

        <div className="admin-current-user">
          <span>현재 로그인한 관리자</span>
          <strong>{admin.name || admin.email || "관리자"}</strong>
          <em>{admin.email ?? "이메일 정보 없음"} · role: {admin.role}</em>
        </div>

        <nav className="admin-mobile-nav" aria-label="모바일 관리자 메뉴">
          {navItems.map((item) => (
            <Link className={active === item.key ? "active" : ""} href={item.href} key={item.key}>
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </section>
    </div>
  );
}
