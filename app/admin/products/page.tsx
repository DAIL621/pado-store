import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProductsManager } from "@/components/admin/AdminProductsManager";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/products");
    redirect("/forbidden");
  }

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="products"
      title="상품 관리"
      subtitle="상품 목록·수정·품절 관리"
    >
      <AdminProductsManager />
    </AdminLayout>
  );
}
