import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCustomersManager } from "@/components/admin/AdminCustomersManager";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await getAdminSession();
  if (!session.ok) { if (session.reason === "not-logged-in") redirect("/login?next=/admin/members"); redirect("/forbidden"); }
  return <AdminLayout admin={{ name: session.profile.name, email: session.user.email, role: session.profile.role }} active="members" title="고객 운영센터" subtitle="고객 검색 · 구매 · 배송 · CS 타임라인"><AdminCustomersManager /></AdminLayout>;
}
