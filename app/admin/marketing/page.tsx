import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/marketing");
    redirect("/");
  }

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="marketing" title="쿠폰·배너 관리" subtitle="행사, 쿠폰, 메인 배너 운영 준비">
      <AdminOperationsPlaceholder
        title="마케팅 운영 관리"
        description="쿠폰, 행사 배너, 노출기간, 클릭 URL을 관리하기 위한 준비 영역입니다."
        primaryHref="/admin/products"
        items={[
          { title: "메인 배너", description: "Hero/행사 배너의 이미지, 문구, 클릭 URL, 노출 기간을 관리합니다.", status: "planned" },
          { title: "행사 배너", description: "시즌 특가, 선물세트, 제철상품 캠페인 노출을 관리합니다.", status: "planned" },
          { title: "쿠폰 발급", description: "쿠폰은 Phase 2 기능으로 할인 정책과 정산 기준 확정 후 연결합니다.", status: "blocked" },
          { title: "신규회원 쿠폰", description: "카카오 로그인 운영 전환과 회원 등급 정책이 선행되어야 합니다.", status: "blocked" },
          { title: "노출기간", description: "배너 시작/종료 시간 기준과 Timezone 정책을 적용합니다.", status: "planned" }
        ]}
      />
    </AdminLayout>
  );
}
