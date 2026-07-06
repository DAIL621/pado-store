import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/stats");
    redirect("/");
  }

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="stats" title="통계" subtitle="매출, 카테고리, 상품, 전환율 분석 준비">
      <AdminOperationsPlaceholder
        title="운영 통계"
        description="일매출, 월매출, 카테고리별/상품별 성과, 전환율을 확인하기 위한 분석 준비 영역입니다."
        primaryHref="/admin"
        items={[
          { title: "일매출", description: "현재 대시보드에서 오늘 매출을 1차 확인할 수 있습니다.", status: "ready" },
          { title: "월매출", description: "현재 대시보드에서 이번달 매출을 1차 확인할 수 있습니다.", status: "ready" },
          { title: "상품별 판매순위", description: "대시보드에서 최근 주문 기준 판매순위를 표시합니다.", status: "ready" },
          { title: "카테고리별 매출", description: "상품 카테고리 정규화와 주문 아이템 집계가 필요합니다.", status: "planned" },
          { title: "전환율", description: "방문/장바구니/구매 이벤트 수집 정책이 필요합니다.", status: "blocked" }
        ]}
      />
    </AdminLayout>
  );
}
