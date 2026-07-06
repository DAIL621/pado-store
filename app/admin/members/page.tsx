import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/members");
    redirect("/");
  }

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="members" title="회원 관리" subtitle="회원 목록, 등급, 구매횟수, 포인트 운영 준비">
      <AdminOperationsPlaceholder
        title="회원 운영 관리"
        description="회원목록, 구매횟수, 등급, 포인트, 탈퇴 처리까지 운영에 필요한 항목을 한 화면에서 관리할 준비 영역입니다."
        primaryHref="/admin/orders"
        items={[
          { title: "회원 목록", description: "Supabase profiles와 주문 데이터를 연결해 회원별 구매 이력을 조회합니다.", status: "planned" },
          { title: "구매횟수", description: "orders 기준으로 회원별 누적 구매 횟수와 금액을 계산합니다.", status: "planned" },
          { title: "회원 등급", description: "등급 정책과 자동 승급 기준이 확정되면 profiles에 연결합니다.", status: "blocked" },
          { title: "포인트", description: "적립금/포인트는 Phase 2 이후 기능으로, 회계 정책 확정 후 진행합니다.", status: "blocked" },
          { title: "탈퇴 처리", description: "개인정보 보존 기간과 주문 이력 보관 정책 확정이 필요합니다.", status: "blocked" }
        ]}
      />
    </AdminLayout>
  );
}
