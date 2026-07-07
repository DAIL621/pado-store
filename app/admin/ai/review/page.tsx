import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { getAiReviewCenterState, getConfidenceTier, type AiReviewStatus } from "@/lib/admin/ai-review-center";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<AiReviewStatus, string> = {
  "auto-approved": "Auto approved",
  "review-recommended": "Review recommended",
  "needs-review": "Needs review",
  "operator-required": "Operator required",
  corrected: "Corrected",
  held: "Held",
  misclassified: "Misclassified"
};

function statusClass(status: AiReviewStatus) {
  if (status === "auto-approved") return "success";
  if (status === "review-recommended") return "warning";
  if (status === "needs-review") return "caution";
  return "danger";
}

export default async function AdminAiReviewPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/review");
    redirect("/");
  }

  const state = getAiReviewCenterState();
  const confidenceGuide = [96, 92, 82, 58].map((value) => ({ value, ...getConfidenceTier(value) }));

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI Review Center"
      subtitle="AI analysis review queue, operator rules, and confidence-based approval"
    >
      <div className="admin-ai-page">
        <section className="admin-ops-hero">
          <span>PADO STORY AI REVIEW</span>
          <h2>AI Review Center</h2>
          <p>
            High-confidence images are auto approved. Ambiguous images move into a review queue, and repeated operator
            corrections become reusable rules for future analysis.
          </p>
          <div>
            <a className="button teal" href="#review-queue">Review Queue</a>
            <a className="button outline" href="#review-rules">Rules</a>
          </div>
        </section>

        <section className="admin-kpi-grid">
          <article>
            <span>Total queue</span>
            <strong>{state.metrics.total}</strong>
            <em>fixture-backed images</em>
          </article>
          <article>
            <span>Auto approval</span>
            <strong>{state.metrics.autoApprovalRate}%</strong>
            <em>{state.metrics.autoApproved} images</em>
          </article>
          <article>
            <span>Correction rate</span>
            <strong>{state.metrics.operatorCorrectionRate}%</strong>
            <em>human review pressure</em>
          </article>
          <article>
            <span>Rule usage</span>
            <strong>{state.metrics.ruleUsageRate}%</strong>
            <em>{state.metrics.corrected} rule-applied items</em>
          </article>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Confidence policy</h2>
            <span className="admin-message">The same policy is used by the queue, score script, and operator dashboard.</span>
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
            <h2>AI Review Queue</h2>
            <span className="admin-message">Operators only need to touch images with low confidence, warning messages, or rule conflicts.</span>
          </div>
          <div className="admin-ai-review-tabs">
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = state.queue.filter((item) => item.status === status).length;
              return (
                <a href={`#queue-${status}`} key={status}>
                  {label} <strong>{count}</strong>
                </a>
              );
            })}
          </div>
          <div className="admin-ai-result-list">
            {state.queue.map((item) => (
              <article className="admin-ai-result-card" id={`queue-${item.status}`} key={item.id}>
                <div className="admin-ai-result-image">
                  <div className="admin-ai-placeholder-image">{item.analysis.confidence}%</div>
                  <em className={`admin-ai-status-pill ${statusClass(item.status)}`}>{STATUS_LABELS[item.status]}</em>
                </div>
                <div className="admin-ai-result-fields">
                  <div>
                    <strong>{item.label.fileName}</strong>
                    <span>
                      {item.label.productCategory} / confidence {item.analysis.confidence}% / quality {item.analysis.qualityScore}
                    </span>
                  </div>
                  <p className="admin-ai-reasoning">{item.reviewHint}</p>
                  <div className="admin-ai-review-row">
                    <label>
                      AI role
                      <input readOnly value={`${item.analysis.suggestedRole} -> ${item.finalRole}`} />
                    </label>
                    <label>
                      Section
                      <input readOnly value={`${item.analysis.recommendedSection} -> ${item.finalSection}`} />
                    </label>
                    <label>
                      Human label
                      <input readOnly value={`${item.label.expectedRole} / ${item.label.expectedSection}`} />
                    </label>
                  </div>
                  <div className="admin-ai-action-row compact">
                    <button type="button" disabled>Approve</button>
                    <button type="button" disabled>Change role</button>
                    <button type="button" disabled>Hold</button>
                    <span>{item.appliedRule ? `Rule: ${item.appliedRule.name}` : "No operator rule"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="review-rules">
          <div>
            <h2>Operator Rules</h2>
            <span className="admin-message">Operator rules are applied before Vision, Mock rules, and fallback logic.</span>
          </div>
          <div className="admin-ops-grid">
            {state.rules.map((rule) => (
              <article className="admin-ops-card" key={rule.id}>
                <span>{rule.source} / priority {rule.priority}</span>
                <strong>{rule.name}</strong>
                <p>{rule.description}</p>
                <em>{`${rule.filenameIncludes.join(", ")} -> ${rule.targetRole} / ${rule.targetSection}`}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Rule suggestions</h2>
            <span className="admin-message">Repeated operator corrections are grouped into suggested rules.</span>
          </div>
          <div className="admin-ops-grid">
            {state.ruleSuggestions.map((rule) => (
              <article className="admin-ops-card" key={rule.id}>
                <span>{rule.usageCount} matching corrections</span>
                <strong>{rule.name}</strong>
                <p>{rule.description}</p>
              </article>
            ))}
            {!state.ruleSuggestions.length && <p className="admin-empty-note">No rule suggestions yet.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>AI self evaluation</h2>
            <span className="admin-message">Confidence, rule usage, and correction pressure by product category.</span>
          </div>
          <div className="admin-ops-grid">
            {state.roleAccuracyByCategory.map((item) => (
              <article className="admin-ops-card" key={item.category}>
                <span>{item.category}</span>
                <strong>{item.averageConfidence}%</strong>
                <p>{item.total} items / auto {item.autoApproved} / rule corrected {item.corrected}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Review history & prompt versions</h2>
            <span className="admin-message">This is file-backed in V1 and ready to move into Supabase later.</span>
          </div>
          <pre className="admin-ai-json-preview">
            {JSON.stringify({ history: state.history, promptVersions: state.promptVersions }, null, 2)}
          </pre>
        </section>
      </div>
    </AdminLayout>
  );
}
