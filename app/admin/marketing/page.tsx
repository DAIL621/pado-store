import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHomeBannerManager } from "@/components/admin/AdminHomeBannerManager";
import { getAdminSession } from "@/lib/auth/admin";
import { getHomeBanner } from "@/lib/site/home-banner";
import "@/app/admin-banner.css";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/marketing");
    redirect("/forbidden");
  }

  const banner = await getHomeBanner();
  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="marketing"
      title="메인 배너 관리"
      subtitle="사진 업로드 → PC·모바일 미리보기 → 홈페이지에 적용"
    >
      <AdminHomeBannerManager initial={banner} />
    </AdminLayout>
  );
}
