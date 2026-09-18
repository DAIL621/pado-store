import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminMobileNavigation, AdminSidebarNavigation, type AdminNavKey } from "@/components/admin/AdminNavigation";
import { AdminPageHeader } from "@/components/admin/ui";

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
  active: AdminNavKey;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <strong>파도스토리</strong>
        <span>관리자 시스템</span>
        <AdminSidebarNavigation active={active} />
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

        <AdminMobileNavigation active={active} />

        {children}
      </section>
    </div>
  );
}
