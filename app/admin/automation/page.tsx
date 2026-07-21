import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOperationsPlaceholder } from "@/components/admin/AdminOperationsPlaceholder";
import { getAdminSession } from "@/lib/auth/admin";
import { operationAutomationSchemaSql } from "@/lib/operations/automation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const processes = [
  {
    title: "주문 상태 자동화",
    description: "결제대기부터 배송완료, 취소, 반품, 환불까지 상태 전환 정책과 알림 이벤트를 생성합니다.",
    status: "ready" as const
  },
  {
    title: "재고 자동 관리",
    description: "결제 승인 시 재고 차감, 환불 시 재고 복구, 재고 부족 알림 이벤트를 기록합니다.",
    status: "ready" as const
  },
  {
    title: "배송 관리",
    description: "택배사, 송장번호, 배송 상태 변경과 CJ대한통운 배송조회 URL Provider 구조를 갖췄습니다.",
    status: "ready" as const
  },
  {
    title: "고객 알림 Provider",
    description: "현재는 Mock Provider이며 카카오 알림톡, SMS, Email Provider로 교체 가능한 구조입니다.",
    status: "ready" as const
  },
  {
    title: "리뷰 요청 예약",
    description: "배송완료 전환 시 review_requests에 리뷰 요청 예약 이벤트를 저장합니다.",
    status: "ready" as const
  },
  {
    title: "외부 연동 Provider",
    description: "CJ대한통운, Toss, Kakao, SmartStore, Coupang, ERP Provider 인터페이스를 분리했습니다.",
    status: "planned" as const
  }
];

type OperationLogRow = {
  id: string;
  event_type: string;
  summary: string;
  created_at: string;
};

type StatusHistoryRow = {
  id: string;
  from_status: string;
  to_status: string;
  created_at: string;
};

type NotificationEventRow = {
  id: string;
  event: string;
  status: string;
  channel: string;
  title: string;
  created_at: string;
};

type ReviewRequestRow = {
  id: string;
  status: string;
  scheduled_at: string;
  channel: string;
  created_at: string;
};

type InventoryLogRow = {
  id: string;
  previous_stock: number;
  next_stock: number;
  delta: number;
  reason: string;
  created_at: string;
};

export default async function AdminAutomationPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/automation");
    redirect("/forbidden");
  }

  const supabase = createAdminClient();
  const [logsResult, statusResult, notificationResult, reviewResult, inventoryResult] = await Promise.all([
    supabase.from("operation_logs").select("id, event_type, summary, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("order_status_history").select("id, from_status, to_status, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("notification_events").select("id, event, status, channel, title, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("review_requests").select("id, status, scheduled_at, channel, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("inventory_logs").select("id, previous_stock, next_stock, delta, reason, created_at").order("created_at", { ascending: false }).limit(20)
  ]);

  const missingTables = [
    logsResult.error ? "operation_logs" : null,
    statusResult.error ? "order_status_history" : null,
    notificationResult.error ? "notification_events" : null,
    reviewResult.error ? "review_requests" : null,
    inventoryResult.error ? "inventory_logs" : null
  ].filter(Boolean);

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="automation"
      title="운영 자동화"
      subtitle="주문부터 배송완료까지 운영 프로세스"
    >
      <AdminOperationsPlaceholder
        title="PADO STORY Operation Automation Engine"
        description="주문, 결제, 배송, 재고, 알림, 리뷰 요청, 운영 로그 흐름을 하나의 자동화 레이어로 관리합니다."
        primaryHref="/admin/orders"
        items={processes}
      />

      {!!missingTables.length && (
        <div className="admin-alert-panel" role="status">
          <strong>운영 자동화 테이블 적용이 필요합니다.</strong>
          <span>{missingTables.join(", ")} 테이블을 Supabase SQL Editor에서 먼저 생성해주세요.</span>
        </div>
      )}

      <section className="admin-dashboard-grid wide">
        <div className="admin-panel">
          <div>
            <h2>최근 운영 로그</h2>
            <span className="admin-message">주문 생성, 결제, 배송, 환불, 관리자 수정 이벤트</span>
          </div>
          <div className="admin-mini-list">
            {((logsResult.data ?? []) as OperationLogRow[]).map((log) => (
              <div key={log.id}>
                <strong>{log.summary}</strong>
                <span>{log.event_type}</span>
                <em>{new Date(log.created_at).toLocaleString("ko-KR")}</em>
              </div>
            ))}
            {!logsResult.data?.length && <p className="admin-empty-note">아직 운영 로그가 없거나 테이블이 적용되지 않았습니다.</p>}
          </div>
        </div>

        <div className="admin-panel">
          <div>
            <h2>최근 상태 변경 이력</h2>
            <span className="admin-message">주문 상태 변경 시간과 변경 주체 추적</span>
          </div>
          <div className="admin-mini-list">
            {((statusResult.data ?? []) as StatusHistoryRow[]).map((history) => (
              <div key={history.id}>
                <strong>{history.from_status} → {history.to_status}</strong>
                <span>주문 상태 변경</span>
                <em>{new Date(history.created_at).toLocaleString("ko-KR")}</em>
              </div>
            ))}
            {!statusResult.data?.length && <p className="admin-empty-note">아직 상태 변경 이력이 없거나 테이블이 적용되지 않았습니다.</p>}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-grid wide">
        <div className="admin-panel">
          <div>
            <h2>알림 이벤트 큐</h2>
            <span className="admin-message">Mock, 카카오 알림톡, SMS, Email로 확장될 이벤트</span>
          </div>
          <div className="admin-mini-list">
            {((notificationResult.data ?? []) as NotificationEventRow[]).map((event) => (
              <div key={event.id}>
                <strong>{event.title}</strong>
                <span>{event.event} · {event.channel} · {event.status}</span>
                <em>{new Date(event.created_at).toLocaleString("ko-KR")}</em>
              </div>
            ))}
            {!notificationResult.data?.length && <p className="admin-empty-note">아직 알림 이벤트가 없거나 테이블이 적용되지 않았습니다.</p>}
          </div>
        </div>

        <div className="admin-panel">
          <div>
            <h2>리뷰 요청 예약</h2>
            <span className="admin-message">배송완료 후 리뷰 요청 발송 대기열</span>
          </div>
          <div className="admin-mini-list">
            {((reviewResult.data ?? []) as ReviewRequestRow[]).map((request) => (
              <div key={request.id}>
                <strong>{request.status}</strong>
                <span>{request.channel} · 예약 {new Date(request.scheduled_at).toLocaleString("ko-KR")}</span>
                <em>{new Date(request.created_at).toLocaleString("ko-KR")}</em>
              </div>
            ))}
            {!reviewResult.data?.length && <p className="admin-empty-note">아직 리뷰 요청 예약이 없거나 테이블이 적용되지 않았습니다.</p>}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div>
          <h2>재고 변경 로그</h2>
          <span className="admin-message">결제 승인, 환불, 수동 조정에 따른 inventory_logs 기록</span>
        </div>
        <div className="admin-mini-list">
          {((inventoryResult.data ?? []) as InventoryLogRow[]).map((log) => (
            <div key={log.id}>
              <strong>{log.previous_stock} → {log.next_stock}</strong>
              <span>{log.reason} · 변동 {log.delta}</span>
              <em>{new Date(log.created_at).toLocaleString("ko-KR")}</em>
            </div>
          ))}
          {!inventoryResult.data?.length && <p className="admin-empty-note">아직 재고 로그가 없거나 inventory_logs 테이블이 적용되지 않았습니다.</p>}
        </div>
      </section>

      <section className="admin-panel">
        <div>
          <h2>운영 DB 마이그레이션 SQL</h2>
          <span className="admin-message">`supabase/migrations/202607060400_operation_automation.sql`와 동일한 운영 자동화 테이블 구조입니다.</span>
        </div>
        <pre className="admin-code-block">{operationAutomationSchemaSql.trim()}</pre>
      </section>
    </AdminLayout>
  );
}
