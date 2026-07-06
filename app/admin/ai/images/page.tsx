import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAiImageAnalyzer } from "@/components/admin/AdminAiImageAnalyzer";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminAiImagesPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/images");
    redirect("/");
  }

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI 운영센터"
      subtitle="상품 사진을 분석해 상세페이지 자동 생성에 활용합니다"
    >
      <AdminAiImageAnalyzer />
    </AdminLayout>
  );
}

