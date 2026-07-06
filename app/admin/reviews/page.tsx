import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/reviews");
    redirect("/");
  }

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="reviews" title="리뷰 관리" subtitle="리뷰 승인, 숨김, 베스트, 답글 운영 준비">
      <AdminOperationsPlaceholder
        title="리뷰 운영 관리"
        description="상품 상세페이지의 신뢰도를 높이기 위한 별점, 사진후기, BEST 후기, 답글 관리 준비 영역입니다."
        primaryHref="/products"
        items={[
          { title: "리뷰 목록", description: "상품, 회원, 주문 인증 상태별 리뷰 목록을 조회합니다.", status: "planned" },
          { title: "승인 / 숨김", description: "운영자가 노출 가능한 리뷰만 고객 화면에 표시하도록 관리합니다.", status: "planned" },
          { title: "베스트 지정", description: "상세페이지 상단에 노출할 BEST 후기를 지정합니다.", status: "planned" },
          { title: "사진 리뷰", description: "사진 업로드 저장소와 리뷰 이미지 정책이 필요합니다.", status: "blocked" },
          { title: "운영자 답글", description: "CS 톤앤매너에 맞춘 답글 등록 UI를 준비합니다.", status: "planned" }
        ]}
      />
    </AdminLayout>
  );
}
