import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/content");
    redirect("/");
  }

  return (
    <AdminLayout admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }} active="content" title="공지·FAQ 관리" subtitle="공지사항, FAQ, 팝업, 이벤트 운영 준비">
      <AdminOperationsPlaceholder
        title="콘텐츠 운영 관리"
        description="고객 안내, FAQ, 이벤트, 팝업을 운영자가 직접 관리하기 위한 준비 영역입니다."
        primaryHref="/admin"
        items={[
          { title: "공지사항", description: "배송 지연, 휴무, 산지 상황 공지를 관리합니다.", status: "planned" },
          { title: "FAQ", description: "배송, 보관, 교환/반품, 결제 관련 자주 묻는 질문을 관리합니다.", status: "planned" },
          { title: "팝업", description: "오픈 이벤트와 휴무 안내 팝업은 노출기간/닫기 정책이 필요합니다.", status: "planned" },
          { title: "이벤트", description: "쿠폰/특가 기능과 연결되는 Phase 2 운영 항목입니다.", status: "blocked" }
        ]}
      />
    </AdminLayout>
  );
}
