import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/ui";

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
  | "cs"
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
    { key: "cs", label: "CS 처리센터", href: "/admin/cs" },
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
        <span>관리자 시스템</span>
        <nav>
          {navItems.map((item) =>
            item.key === "ai" ? (
              <details className="admin-nav-group admin-ai-nav" key={item.key} open={active === "ai"}>
                <summary className={active === "ai" ? "active" : ""}>
                  <span>{item.label}</span>
                  <span aria-hidden="true">⌄</span>
                </summary>
                <span className="admin-ai-subnav">
                  <Link href="/admin/ai/images">AI 사진분석</Link>
                  <Link href="/admin/ai/dataset">AI 데이터셋</Link>
                  <Link href="/admin/ai/dashboard">AI 대시보드</Link>
                  <Link href="/admin/ai/review">AI 검수센터</Link>
                </span>
              </details>
            ) : (
              <span className="admin-nav-group" key={item.key}>
                <Link className={active === item.key ? "active" : ""} href={item.href}>
                  {item.label}
                </Link>
              </span>
            ),
          )}
        </nav>
        <div className="admin-account-compact" aria-label="현재 관리자 계정">
          <span>현재 관리자</span>
          <strong>{admin.name || admin.email || "관리자"}</strong>
          <small>{admin.email ?? "이메일 정보 없음"}</small>
          <em>권한: {admin.role}</em>
        </div>
        <AdminLogoutButton />
      </aside>

      <section className="admin-main">
        <AdminPageHeader
          eyebrow={subtitle}
          title={title}
          action={<a className="admin-ui-button outline md" href="/products" target="_blank" rel="noreferrer">라이브몰 보기</a>}
        />

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
