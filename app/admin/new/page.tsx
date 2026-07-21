import { redirect } from "next/navigation";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/new");
    redirect("/forbidden");
  }

  return (
    <AdminProductForm
      admin={{
        name: adminSession.profile.name,
        email: adminSession.user.email,
        role: adminSession.profile.role
      }}
    />
  );
}
