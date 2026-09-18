import Link from "next/link";

export type AdminNavKey =
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

type AdminNavItem = { key: AdminNavKey; label: string; href: string };
type AdminNavGroup = { label: string; icon: string; items: AdminNavItem[] };

const dashboardItem: AdminNavItem = { key: "dashboard", label: "대시보드", href: "/admin" };
const statsItem: AdminNavItem = { key: "stats", label: "통계", href: "/admin/stats" };

const navGroups: AdminNavGroup[] = [
  { label: "주문", icon: "🛒", items: [
    { key: "orders", label: "주문관리", href: "/admin/orders" },
    { key: "shipments", label: "배송관리", href: "/admin/deliveries" }
  ] },
  { label: "상품", icon: "📦", items: [
    { key: "products", label: "상품관리", href: "/admin/products" }
  ] },
  { label: "고객", icon: "👥", items: [
    { key: "members", label: "회원관리", href: "/admin/members" },
    { key: "cs", label: "CS 처리센터", href: "/admin/cs" },
    { key: "reviews", label: "리뷰관리", href: "/admin/reviews" }
  ] },
  { label: "마케팅", icon: "📣", items: [
    { key: "marketing", label: "쿠폰·배너", href: "/admin/marketing" },
    { key: "content", label: "공지·FAQ", href: "/admin/content" }
  ] },
  { label: "AI 운영센터", icon: "🤖", items: [
    { key: "automation", label: "운영 자동화", href: "/admin/automation" },
    { key: "ai", label: "AI 사진분석", href: "/admin/ai/images" }
  ] }
];

const allItems = [dashboardItem, ...navGroups.flatMap((group) => group.items), statsItem];

function NavLink({ item, active }: { item: AdminNavItem; active: AdminNavKey }) {
  return (
    <Link className={active === item.key ? "active" : ""} href={item.href} aria-current={active === item.key ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

function NavSection({ group, active }: { group: AdminNavGroup; active: AdminNavKey }) {
  return (
    <details className="admin-nav-section" open={group.items.some((item) => item.key === active)}>
      <summary>
        <span className="admin-nav-section-title"><span aria-hidden="true">{group.icon}</span>{group.label}</span>
        <span className="admin-nav-chevron" aria-hidden="true">⌄</span>
      </summary>
      <span className="admin-nav-items">
        {group.items.map((item) => <NavLink item={item} active={active} key={item.key} />)}
        {group.label === "주문" && <small>환불관리 · 준비 중</small>}
        {group.label === "상품" && <small>카테고리 · 준비 중</small>}
        {group.label === "AI 운영센터" && <>
          <Link href="/admin/ai/dataset">AI 데이터셋</Link>
          <Link href="/admin/ai/dashboard">AI 대시보드</Link>
          <Link href="/admin/ai/review">AI 검수센터</Link>
        </>}
      </span>
    </details>
  );
}

export function AdminSidebarNavigation({ active }: { active: AdminNavKey }) {
  return (
    <nav className="admin-navigation" aria-label="관리자 주 메뉴">
      <span className="admin-nav-standalone"><span aria-hidden="true">📊</span><NavLink item={dashboardItem} active={active} /></span>
      {navGroups.slice(0, 4).map((group) => <NavSection group={group} active={active} key={group.label} />)}
      <span className="admin-nav-standalone"><span aria-hidden="true">📈</span><NavLink item={statsItem} active={active} /></span>
      {navGroups.slice(4).map((group) => <NavSection group={group} active={active} key={group.label} />)}
    </nav>
  );
}

export function AdminMobileNavigation({ active }: { active: AdminNavKey }) {
  return (
    <nav className="admin-mobile-nav" aria-label="모바일 관리자 메뉴">
      {allItems.map((item) => <NavLink item={item} active={active} key={item.key} />)}
    </nav>
  );
}
