import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";
import { AdminScreen } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/orders");
    redirect("/forbidden");
  }

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="orders"
      title="주문 관리"
      subtitle="주문 조회·상태 변경·송장 입력"
    >
      <AdminScreen name="orders"><AdminOrdersManager /></AdminScreen>
    </AdminLayout>
  );
}
