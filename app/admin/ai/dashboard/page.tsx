import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { getAiPromptHistory, scoreAiDataset } from "@/lib/admin/ai-dataset";

export const dynamic = "force-dynamic";

export default async function AdminAiDashboardPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/dashboard");
    redirect("/");
  }

  const evaluation = scoreAiDataset();
  const promptHistory = getAiPromptHistory();

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI Dashboard"
      subtitle="AI 사진분석 정확도와 오분류를 추적합니다."
    >
      <div className="admin-ai-page">
        <section className="admin-kpi-grid">
          <article>
            <span>Dataset</span>
            <strong>{evaluation.imageCount}장</strong>
            <em>{evaluation.datasetCount} categories</em>
          </article>
          <article>
            <span>Role Accuracy</span>
            <strong>{evaluation.roleAccuracy}%</strong>
            <em>정답 role 비교</em>
          </article>
          <article>
            <span>Hero Accuracy</span>
            <strong>{evaluation.heroAccuracy}%</strong>
            <em>대표 후보 ranking</em>
          </article>
          <article>
            <span>Total Score</span>
            <strong>{evaluation.totalScore}</strong>
            <em>종합 평가</em>
          </article>
        </section>

        <section className="admin-panel">
          <div>
            <h2>상품군별 정확도</h2>
            <span className="admin-message">Dataset이 늘어날수록 상품군별 Prompt 개선 우선순위를 판단합니다.</span>
          </div>
          <div className="admin-ops-grid">
            {evaluation.categoryScores.map((score) => (
              <article className="admin-ops-card" key={score.category}>
                <span>{score.category}</span>
                <strong>{score.totalScore}점</strong>
                <p>{score.imageCount}장 · Role Accuracy {score.roleAccuracy}%</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>오분류 Top10</h2>
            <span className="admin-message">틀린 이미지는 reports/ai-errors에 저장되며 Prompt 개선 대상이 됩니다.</span>
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
                    <span>{item.errorReasons.join(" · ") || "caption/quality review"}</span>
                  </div>
                  <label>
                    Expected
                    <input readOnly value={`${item.label.expectedRole} / ${item.label.expectedSection}`} />
                  </label>
                  <label>
                    AI Result
                    <input readOnly value={`${item.prediction.suggestedRole} / ${item.prediction.recommendedSection}`} />
                  </label>
                </div>
              </article>
            ))}
            {!evaluation.errors.length && <p className="admin-empty-note">현재 fixture 기준 오분류가 없습니다.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Prompt History</h2>
            <span className="admin-message">`pnpm run evaluate:dataset` 실행 시 평가 이력이 reports/prompt-history에 저장됩니다.</span>
          </div>
          <pre className="admin-ai-json-preview">{JSON.stringify({ promptHistory }, null, 2)}</pre>
        </section>
      </div>
    </AdminLayout>
  );
}
