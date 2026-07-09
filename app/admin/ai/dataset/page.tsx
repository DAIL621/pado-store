import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { readAiDatasets, scoreAiDataset } from "@/lib/admin/ai-dataset";
import { getRealDatasetStatus, readRealDatasetItems } from "@/lib/admin/ai-real-dataset";

export const dynamic = "force-dynamic";

export default async function AdminAiDatasetPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/dataset");
    redirect("/");
  }

  const datasets = readAiDatasets();
  const evaluation = scoreAiDataset(datasets);
  const abaloneStatus = getRealDatasetStatus("abalone");
  const abaloneItems = readRealDatasetItems("abalone");

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI Dataset"
      subtitle="사진 분석 정답 Label과 Evaluation을 관리합니다."
    >
      <div className="admin-ai-page">
        <section className="admin-panel">
          <div>
            <h2>Dataset 목록</h2>
            <span className="admin-message">현재는 fixture 기반 Mock Dataset입니다. 실제 이미지를 넣으면 같은 Label Schema로 확장됩니다.</span>
          </div>
          <div className="admin-ai-summary">
            <strong>Dataset {evaluation.datasetCount}개 · Fixture {evaluation.imageCount}장 · Total {evaluation.totalScore}점</strong>
            <div>
              <span>Role Accuracy {evaluation.roleAccuracy}%</span>
              <span>Hero Accuracy {evaluation.heroAccuracy}%</span>
              <span>Section Accuracy {evaluation.sectionAccuracy}%</span>
              <span>Quality Accuracy {evaluation.qualityAccuracy}%</span>
              <span>Warning Accuracy {evaluation.warningAccuracy}%</span>
            </div>
          </div>
          <div className="admin-ops-grid">
            <article className="admin-ops-card ready">
              <span>abalone real images</span>
              <strong>{abaloneStatus.imageCount} images</strong>
              <p>
                metadata {abaloneStatus.metadataCount} / labels {abaloneStatus.labelCount} / reviewed {abaloneStatus.reviewedCount} / approved {abaloneStatus.approvedCount}
              </p>
            </article>
            {datasets.map((dataset) => (
              <article className="admin-ops-card" key={dataset.category}>
                <span>{dataset.category}</span>
                <strong>{dataset.labels.length} labels</strong>
                <p>images / labels / metadata 구조 준비 완료</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Real Abalone Dataset Status</h2>
            <span className="admin-message">`datasets/abalone/images`의 실제 사진과 metadata/label 생성 상태를 확인합니다.</span>
          </div>
          <div className="admin-ai-summary">
            <strong>
              Images {abaloneStatus.imageCount} · Metadata {abaloneStatus.metadataCount} · Labels {abaloneStatus.labelCount}
            </strong>
            <div>
              <span>Reviewed {abaloneStatus.reviewedCount}</span>
              <span>Approved {abaloneStatus.approvedCount}</span>
              <span>Missing metadata {abaloneStatus.missingMetadata.length}</span>
              <span>Missing labels {abaloneStatus.missingLabels.length}</span>
            </div>
          </div>
          <div className="admin-ai-result-list">
            {abaloneItems.map((item) => (
              <article className="admin-ai-result-card" key={item.fileName}>
                <div className="admin-ai-result-image">
                  <img
                    src={`/api/admin/ai/dataset-image?category=abalone&file=${encodeURIComponent(item.fileName)}`}
                    alt={item.fileName}
                  />
                </div>
                <div className="admin-ai-result-fields">
                  <div>
                    <strong>{item.fileName}</strong>
                    <span>
                      metadata {item.metadata ? "ok" : "missing"} / label {item.label ? "ok" : "missing"}
                    </span>
                  </div>
                  <label>
                    AI Role
                    <input readOnly value={item.metadata?.suggestedRole || "not analyzed"} />
                  </label>
                  <label>
                    Confidence
                    <input readOnly value={item.metadata?.confidence ?? "-"} />
                  </label>
                  <label>
                    Reviewed
                    <input readOnly value={item.label?.reviewed ? "true" : "false"} />
                  </label>
                  <label>
                    Approved
                    <input readOnly value={item.label?.approved ? "true" : "false"} />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Label Editor</h2>
            <span className="admin-message">사진별 Role, Hero 여부, Quality Score, Warning, Title, Caption, Description, Section을 검수합니다.</span>
          </div>
          <div className="admin-ai-result-list">
            {datasets.flatMap((dataset) =>
              dataset.labels.map((label) => (
                <article className="admin-ai-result-card" key={label.imageId}>
                  <div className="admin-ai-result-image">
                    <div className="admin-ai-placeholder-image">{label.productCategory}</div>
                  </div>
                  <div className="admin-ai-result-fields">
                    <div>
                      <strong>{label.fileName}</strong>
                      <span>{label.imageId} · {label.notes}</span>
                    </div>
                    <label>
                      Expected Role
                      <input readOnly value={label.expectedRole} />
                    </label>
                    <label>
                      Expected Section
                      <input readOnly value={label.expectedSection} />
                    </label>
                    <label>
                      Hero Rank
                      <input readOnly value={label.expectedHeroRank ?? "none"} />
                    </label>
                    <label>
                      Quality Score
                      <input readOnly value={label.expectedQualityScore} />
                    </label>
                    <label>
                      Caption
                      <textarea readOnly rows={2} value={label.expectedCaption} />
                    </label>
                    <label>
                      Description
                      <textarea readOnly rows={2} value={label.expectedDescription} />
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>Evaluation 실행</h2>
            <span className="admin-message">CLI에서 `pnpm run evaluate:dataset`을 실행하면 reports/ai-errors와 reports/prompt-history가 생성됩니다.</span>
          </div>
          <pre className="admin-ai-json-preview">{JSON.stringify(evaluation, null, 2)}</pre>
        </section>
      </div>
    </AdminLayout>
  );
}
