import { redirect } from "next/navigation";
import { AdminDeliveriesManager } from "@/components/admin/AdminDeliveriesManager";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/deliveries");
    redirect("/forbidden");
  }

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="shipments"
      title="배송 관리"
      subtitle="상품준비중·배송중·배송완료 주문 처리"
    >
      <AdminDeliveriesManager />
    </AdminLayout>
  );
}
