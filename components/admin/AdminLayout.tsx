import Link from "next/link";

export type AdminUser = {
  name: string | null;
  email?: string;
  role: "admin";
};

export function AdminLayout({
  admin,
  active,
  title,
  subtitle,
  children
}: {
  admin: AdminUser;
  active: "dashboard" | "products" | "orders" | "shipments";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const navItems = [
    { key: "dashboard", label: "대시보드", href: "/admin" },
    { key: "products", label: "상품 관리", href: "/admin/products" },
    { key: "orders", label: "주문 관리", href: "/admin/orders" },
    { key: "shipments", label: "배송 관리", href: "/admin/deliveries" }
  ] as const;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <strong>파도스토리</strong>
        <span>STORE ADMIN</span>
        <nav>
          {navItems.map((item) => (
            <Link className={active === item.key ? "active" : ""} href={item.href} key={item.key}>
              {item.label}
            </Link>
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
          <a className="button outline" href="/products" target="_blank">쇼핑몰 보기</a>
        </div>

        <div className="admin-current-user">
          <span>현재 로그인한 관리자</span>
          <strong>{admin.name || admin.email || "관리자"}</strong>
          <em>{admin.email ?? "이메일 정보 없음"} · role: {admin.role}</em>
        </div>

        {children}
      </section>
    </div>
  );
}
