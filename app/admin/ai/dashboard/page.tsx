import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { getAiPromptHistory, scoreAiDataset } from "@/lib/admin/ai-dataset";
import { getAiRoleLabel, getAiSectionLabel } from "@/lib/admin/ai-image-analysis";

export const dynamic = "force-dynamic";

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

function errorReasonKo(reason: string) {
  return reason
    .replace("role:", "역할:")
    .replace("section:", "섹션:")
    .replace("hero:", "대표사진:")
    .replace("quality:", "품질:")
    .replace("warning mismatch", "경고문 일치 여부 확인 필요")
    .replace("expected", "기대값")
    .replace("got", "AI 결과")
    .replace("around", "근사값")
    .replace("none", "없음");
}

export default async function AdminAiDashboardPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/dashboard");
    redirect("/forbidden");
  }

  const evaluation = scoreAiDataset();
  const promptHistory = getAiPromptHistory();

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI 대시보드"
      subtitle="AI 사진분석 정확도와 오분류 흐름을 추적합니다."
    >
      <div className="admin-ai-page">
        <section className="admin-kpi-grid">
          <article>
            <span>데이터셋 이미지</span>
            <strong>{evaluation.imageCount}장</strong>
            <em>{evaluation.datasetCount}개 상품군</em>
          </article>
          <article>
            <span>역할 정확도</span>
            <strong>{evaluation.roleAccuracy}%</strong>
            <em>정답 역할과 AI 추천 역할 비교</em>
          </article>
          <article>
            <span>대표사진 정확도</span>
            <strong>{evaluation.heroAccuracy}%</strong>
            <em>대표사진 후보 순위 평가</em>
          </article>
          <article>
            <span>종합 점수</span>
            <strong>{evaluation.totalScore}</strong>
            <em>AI 사진분석 품질 점수</em>
          </article>
        </section>

        <section className="admin-panel">
          <div>
            <h2>상품군별 정확도</h2>
            <span className="admin-message">데이터셋이 늘어날수록 상품군별 프롬프트 개선 우선순위를 판단합니다.</span>
          </div>
          <div className="admin-ops-grid">
            {evaluation.categoryScores.map((score) => (
              <article className="admin-ops-card" key={score.category}>
                <span>{categoryLabel(score.category)}</span>
                <strong>{score.totalScore}점</strong>
                <p>{score.imageCount}장 · 역할 정확도 {score.roleAccuracy}%</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>오분류 Top 10</h2>
            <span className="admin-message">틀린 이미지는 reports/ai-errors에 저장되며 프롬프트 개선 대상이 됩니다.</span>
          </div>
          <div className="admin-ai-result-list">
            {evaluation.errors.slice(0, 10).map((item) => (
              <article className="admin-ai-result-card" key={item.label.imageId}>
                <div className="admin-ai-result-image">
                  <div className="admin-ai-placeholder-image">{item.totalScore}</div>
                </div>
                <div className="admin-ai-result-fields">
                  <div>
                    <strong>{item.label.fileName}</strong>
                    <span>{item.errorReasons.map(errorReasonKo).join(" · ") || "캡션 또는 품질 검토 필요"}</span>
                  </div>
                  <p>
                    AI: {getAiRoleLabel(item.prediction.suggestedRole)} / {getAiSectionLabel(item.prediction.recommendedSection)} · 정답:{" "}
                    {getAiRoleLabel(item.label.expectedRole === "gallery" ? "detail" : item.label.expectedRole)} / {getAiSectionLabel(item.label.expectedSection)}
                  </p>
                </div>
              </article>
            ))}
            {!evaluation.errors.length && <p className="admin-empty-note">현재 확인할 오분류가 없습니다.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>프롬프트 개선 이력</h2>
            <span className="admin-message">데이터셋 재평가 결과와 프롬프트 변경 이력을 비교합니다.</span>
          </div>
          <div className="admin-ops-grid">
            {promptHistory.map((fileName) => (
              <article className="admin-ops-card" key={fileName}>
                <span>평가 이력</span>
                <strong>{fileName}</strong>
                <p>프롬프트 변경 후 정확도 비교에 사용합니다.</p>
              </article>
            ))}
            {!promptHistory.length && <p className="admin-empty-note">아직 저장된 프롬프트 이력이 없습니다.</p>}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
