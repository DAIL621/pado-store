import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAiReviewCard } from "@/components/admin/AdminAiReviewCard";
import { getAdminSession } from "@/lib/auth/admin";
import { getAiReviewCenterState, getConfidenceTier, type AiReviewStatus } from "@/lib/admin/ai-review-center";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<AiReviewStatus, string> = {
  "auto-approved": "승인 완료",
  "review-recommended": "검토 권장",
  "needs-review": "확인 필요",
  "operator-required": "운영자 확인 필수",
  corrected: "수정 완료",
  held: "보류",
  misclassified: "오분류"
};

type ReviewFilter = "all" | "pending" | "approved" | "held" | "roleMismatch" | "sectionMismatch" | "lowQuality";

const FILTER_LABELS: Record<ReviewFilter, string> = {
  all: "전체",
  pending: "검수 전",
  approved: "승인 완료",
  held: "보류",
  roleMismatch: "역할 다름",
  sectionMismatch: "섹션 다름",
  lowQuality: "품질 낮음"
};

function statusClass(status: AiReviewStatus) {
  if (status === "auto-approved") return "success";
  if (status === "review-recommended") return "warning";
  if (status === "needs-review") return "caution";
  return "danger";
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    abalone: "전복",
    eel: "바다장어",
    octopus: "문어",
    oyster: "굴",
    shrimp: "새우",
    fish: "생선",
    "meal-kit": "밀키트",
    "gift-set": "선물세트"
  };
  return labels[category] ?? category;
}

function isReviewFilter(value: unknown): value is ReviewFilter {
  return typeof value === "string" && value in FILTER_LABELS;
}

export default async function AdminAiReviewPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/review");
    redirect("/");
  }

  const state = getAiReviewCenterState();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawFilter = Array.isArray(resolvedSearchParams.filter) ? resolvedSearchParams.filter[0] : resolvedSearchParams.filter;
  const activeFilter: ReviewFilter = isReviewFilter(rawFilter) ? rawFilter : "all";
  const filteredQueue = state.queue.filter((item) => {
    if (activeFilter === "pending") return !item.realLabel?.reviewed && !item.realLabel?.approved;
    if (activeFilter === "approved") return Boolean(item.realLabel?.approved);
    if (activeFilter === "held") return Boolean(item.realLabel?.reviewed && !item.realLabel?.approved);
    if (activeFilter === "roleMismatch") return item.analysis.suggestedRole !== item.finalRole;
    if (activeFilter === "sectionMismatch") return item.analysis.recommendedSection !== item.finalSection;
    if (activeFilter === "lowQuality") return item.analysis.qualityScore < 70;
    return true;
  });
  const filterCounts: Record<ReviewFilter, number> = {
    all: state.queue.length,
    pending: state.metrics.pending,
    approved: state.metrics.approved,
    held: state.metrics.held,
    roleMismatch: state.metrics.roleMismatch,
    sectionMismatch: state.metrics.sectionMismatch,
    lowQuality: state.metrics.lowQuality
  };
  const confidenceGuide = [96, 92, 82, 58].map((value) => ({ value, ...getConfidenceTier(value) }));

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI Review Center"
      subtitle="AI 사진분석 결과를 검수하고 운영자 승인 라벨 기준으로 정확도를 확인합니다."
    >
      <div className="admin-ai-page">
        <section className="admin-ops-hero">
          <span>PADO STORY AI REVIEW</span>
          <h2>전복 사진 검수 현황</h2>
          <p>
            AI 원본 추천과 운영자 최종 라벨을 나란히 확인합니다. 승인된 라벨은 평가 리포트와 다음 상품등록 초안 품질 개선에 사용됩니다.
          </p>
          <div>
            <a className="button teal" href="#review-queue">검수 대기열</a>
            <a className="button outline" href="#review-rules">운영 규칙</a>
          </div>
        </section>

        <section className="admin-kpi-grid">
          <article>
            <span>전체 사진</span>
            <strong>{state.metrics.total}</strong>
            <em>전복 dataset 기준</em>
          </article>
          <article>
            <span>승인 완료</span>
            <strong>{state.metrics.approved}</strong>
            <em>운영자 승인 라벨</em>
          </article>
          <article>
            <span>검수 전</span>
            <strong>{state.metrics.pending}</strong>
            <em>아직 확인이 필요한 사진</em>
          </article>
          <article>
            <span>수정 필요</span>
            <strong>{state.metrics.roleMismatch + state.metrics.sectionMismatch}</strong>
            <em>AI 추천과 운영자 값 불일치</em>
          </article>
          <article>
            <span>보류</span>
            <strong>{state.metrics.held}</strong>
            <em>검수했지만 미승인</em>
          </article>
          <article>
            <span>자동 승인 후보</span>
            <strong>{state.metrics.autoApprovalCandidates}</strong>
            <em>신뢰도 95% 이상 미검수</em>
          </article>
        </section>

        <section className="admin-panel">
          <div>
            <h2>신뢰도 기준</h2>
            <span className="admin-message">검수 화면, 평가 스크립트, 운영자 화면에서 같은 기준을 사용합니다.</span>
          </div>
          <div className="admin-ai-review-policy">
            {confidenceGuide.map((item) => (
              <article className={`admin-ai-review-badge ${item.severity}`} key={item.value}>
                <strong>{item.value}%</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="review-queue">
          <div>
            <h2>AI 검수 대기열</h2>
            <span className="admin-message">현재 필터: {FILTER_LABELS[activeFilter]} / {filteredQueue.length}장 표시</span>
          </div>
          <div className="admin-ai-review-tabs">
            {(Object.keys(FILTER_LABELS) as ReviewFilter[]).map((filter) => (
              <a className={activeFilter === filter ? "active" : ""} href={`/admin/ai/review?filter=${filter}#review-queue`} key={filter}>
                {FILTER_LABELS[filter]} <strong>{filterCounts[filter]}</strong>
              </a>
            ))}
          </div>
          <div className="admin-ai-result-list">
            {filteredQueue.map((item) => (
              <div id={`queue-${item.id}`} key={item.id}>
                <AdminAiReviewCard
                  category={item.label.productCategory}
                  fileName={item.label.fileName}
                  imageSrc={item.imageSrc}
                  statusLabel={STATUS_LABELS[item.status]}
                  statusClassName={statusClass(item.status)}
                  confidence={item.analysis.confidence}
                  qualityScore={item.analysis.qualityScore}
                  reviewHint={item.reviewHint}
                  aiRole={item.analysis.suggestedRole}
                  aiSection={item.analysis.recommendedSection}
                  expectedRole={item.finalRole}
                  expectedSection={item.finalSection}
                  expectedHeroRank={item.label.expectedHeroRank}
                  expectedQualityScore={item.label.expectedQualityScore}
                  expectedTitle={item.label.expectedTitle}
                  expectedCaption={item.label.expectedCaption}
                  expectedDescription={item.label.expectedDescription}
                  reviewed={item.realLabel?.reviewed}
                  approved={item.realLabel?.approved}
                  reviewerNotes={item.realLabel?.reviewerNotes}
                  appliedRule={item.appliedRule?.name}
                />
              </div>
            ))}
            {!filteredQueue.length && <p className="admin-empty-note">현재 필터에 해당하는 사진이 없습니다.</p>}
          </div>
        </section>

        <section className="admin-panel" id="review-rules">
          <div>
            <h2>운영 규칙</h2>
            <span className="admin-message">운영자가 반복해서 수정한 기준은 Vision 분석보다 우선 적용할 수 있도록 관리합니다.</span>
          </div>
          <div className="admin-ops-grid">
            {state.rules.map((rule) => (
              <article className="admin-ops-card" key={rule.id}>
                <span>{rule.source === "operator" ? "운영자 규칙" : "시스템 규칙"} / 우선순위 {rule.priority}</span>
                <strong>{rule.name}</strong>
                <p>{rule.description}</p>
                <em>{`${rule.filenameIncludes.join(", ")} -> ${rule.targetRole} / ${rule.targetSection}`}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>규칙 제안</h2>
            <span className="admin-message">반복된 운영자 수정을 규칙 후보로 묶어 보여줍니다.</span>
          </div>
          <div className="admin-ops-grid">
            {state.ruleSuggestions.map((rule) => (
              <article className="admin-ops-card" key={rule.id}>
                <span>{rule.usageCount}건의 유사 수정</span>
                <strong>{rule.name}</strong>
                <p>{rule.description}</p>
              </article>
            ))}
            {!state.ruleSuggestions.length && <p className="admin-empty-note">아직 제안할 규칙이 없습니다.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>AI 자체 평가</h2>
            <span className="admin-message">상품군별 신뢰도, 자동 승인, 운영자 수정 비율을 확인합니다.</span>
          </div>
          <div className="admin-ops-grid">
            {state.roleAccuracyByCategory.map((item) => (
              <article className="admin-ops-card" key={item.category}>
                <span>{categoryLabel(item.category)}</span>
                <strong>{item.averageConfidence}%</strong>
                <p>{item.total}건 / 승인 {item.autoApproved}건 / 수정 필요 {item.corrected}건</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>검수 이력과 프롬프트 버전</h2>
            <span className="admin-message">현재는 파일 기반 이력이며, 이후 운영 DB 저장 구조로 이전할 수 있습니다.</span>
          </div>
          <pre className="admin-ai-json-preview">
            {JSON.stringify({ history: state.history, promptVersions: state.promptVersions }, null, 2)}
          </pre>
        </section>
      </div>
    </AdminLayout>
  );
}
