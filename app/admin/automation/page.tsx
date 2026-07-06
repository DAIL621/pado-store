import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";
import { operationAutomationSchemaSql } from "@/lib/operations/automation";

export const dynamic = "force-dynamic";

const processes = [
  {
    title: "주문 상태 자동화",
    description: "결제대기부터 배송완료, 취소, 반품, 환불까지 상태 전환 정책과 Mock 알림 이벤트를 생성합니다.",
    status: "ready" as const
  },
  {
    title: "재고 자동 관리",
    description: "결제 승인 시 재고 차감은 운영 중이며, 취소/반품/환불 재고 복구 로그 테이블 연결을 준비했습니다.",
    status: "ready" as const
  },
  {
    title: "배송 관리",
    description: "택배사, 송장번호, 배송 상태 변경과 CJ대한통운 배송조회 URL Provider 확장 구조를 갖췄습니다.",
    status: "ready" as const
  },
  {
    title: "고객 알림 Provider",
    description: "현재는 Mock Provider로 동작하며 추후 카카오 알림톡, SMS, Email Provider만 교체하면 됩니다.",
    status: "ready" as const
  },
  {
    title: "리뷰 요청 예약",
    description: "배송완료 전환 시 리뷰 요청 예약 이벤트를 생성합니다. 실제 발송 큐 테이블은 운영 DB 마이그레이션 후 연결합니다.",
    status: "planned" as const
  },
  {
    title: "운영 로그 저장",
    description: "operation_logs 테이블이 있으면 best-effort로 기록합니다. 없으면 주문 처리는 막지 않고 응답에 스킵 사유를 반환합니다.",
    status: "planned" as const
  },
  {
    title: "외부 연동 Provider",
    description: "CJ대한통운, Toss, Kakao, SmartStore, Coupang, ERP Provider 인터페이스를 분리해 추가 연동 비용을 낮췄습니다.",
    status: "planned" as const
  }
];

export default async function AdminAutomationPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/automation");
    redirect("/");
  }

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="automation"
      title="운영 자동화"
      subtitle="주문부터 배송완료까지 운영 프로세스"
    >
      <AdminOperationsPlaceholder
        title="PADO STORY Operation Automation Engine"
        description="대표가 매일 확인해야 하는 주문, 배송, 재고, 알림, 리뷰 요청, 운영 로그 흐름을 하나의 자동화 레이어로 정리했습니다."
        primaryHref="/admin/orders"
        items={processes}
      />

      <section className="admin-panel">
        <div>
          <h2>운영 DB 확장 준비 SQL</h2>
          <span className="admin-message">운영 로그와 상태 이력 저장이 필요할 때 Supabase SQL Editor에서 적용합니다.</span>
        </div>
        <pre className="admin-code-block">{operationAutomationSchemaSql.trim()}</pre>
      </section>

      <section className="admin-panel">
        <div>
          <h2>자동화 이벤트 흐름</h2>
          <span className="admin-message">현재 주문 상태 저장 API가 반환하는 운영 이벤트입니다.</span>
        </div>
        <div className="admin-ops-grid">
          {[
            "order_status_changed",
            "delivery_updated",
            "notification_queued",
            "review_request_scheduled",
            "inventory_adjusted"
          ].map((event) => (
            <article className="admin-ops-card ready" key={event}>
              <span>EVENT</span>
              <h3>{event}</h3>
              <p>관리자 화면, Mock Provider, 추후 DB 큐/외부 API Provider가 같은 이벤트를 공유합니다.</p>
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
