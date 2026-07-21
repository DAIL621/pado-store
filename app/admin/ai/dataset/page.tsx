import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/auth/admin";
import { readAiDatasets, scoreAiDataset } from "@/lib/admin/ai-dataset";
import { getRealDatasetStatus, readRealDatasetItems } from "@/lib/admin/ai-real-dataset";
import { getAiRoleLabel, getAiSectionLabel } from "@/lib/admin/ai-image-analysis";

export const dynamic = "force-dynamic";

function yesNo(value: boolean | undefined) {
  return value ? "예" : "아니오";
}

function existsLabel(value: unknown) {
  return value ? "있음" : "없음";
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

export default async function AdminAiDatasetPage() {
  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    if (adminSession.reason === "not-logged-in") redirect("/login?next=/admin/ai/dataset");
    redirect("/forbidden");
  }

  const datasets = readAiDatasets();
  const evaluation = scoreAiDataset(datasets);
  const abaloneStatus = getRealDatasetStatus("abalone");
  const abaloneItems = readRealDatasetItems("abalone");

  return (
    <AdminLayout
      admin={{ name: adminSession.profile.name, email: adminSession.user.email, role: adminSession.profile.role }}
      active="ai"
      title="AI 데이터셋"
      subtitle="AI 사진분석 정답 라벨과 평가 결과를 관리합니다."
    >
      <div className="admin-ai-page">
        <section className="admin-panel">
          <div>
            <h2>데이터셋 목록</h2>
            <span className="admin-message">현재 fixture와 실제 전복 사진 데이터셋을 함께 확인합니다. 실제 이미지가 늘어나면 같은 라벨 구조로 확장됩니다.</span>
          </div>
          <div className="admin-ai-summary">
            <strong>데이터셋 {evaluation.datasetCount}개 · 이미지 {evaluation.imageCount}장 · 종합 {evaluation.totalScore}점</strong>
            <div>
              <span>역할 정확도 {evaluation.roleAccuracy}%</span>
              <span>대표사진 정확도 {evaluation.heroAccuracy}%</span>
              <span>섹션 정확도 {evaluation.sectionAccuracy}%</span>
              <span>품질 점수 정확도 {evaluation.qualityAccuracy}%</span>
              <span>경고문 정확도 {evaluation.warningAccuracy}%</span>
            </div>
          </div>
          <div className="admin-ops-grid">
            <article className="admin-ops-card ready">
              <span>전복 실제 사진 데이터셋</span>
              <strong>{abaloneStatus.imageCount}장</strong>
              <p>
                분석 결과 {abaloneStatus.metadataCount}개 / 라벨 {abaloneStatus.labelCount}개 / 검수 {abaloneStatus.reviewedCount}개 / 승인 {abaloneStatus.approvedCount}개
              </p>
            </article>
            {datasets.map((dataset) => (
              <article className="admin-ops-card" key={dataset.category}>
                <span>{categoryLabel(dataset.category)}</span>
                <strong>{dataset.labels.length}개 라벨</strong>
                <p>이미지 / 라벨 / 분석 결과 구조 준비 완료</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>전복 실제 데이터셋 상태</h2>
            <span className="admin-message">전복 실제 사진의 분석 결과, 정답 라벨, 검수 상태를 확인합니다.</span>
          </div>
          <div className="admin-ai-summary">
            <strong>이미지 {abaloneStatus.imageCount}장 · 분석 결과 {abaloneStatus.metadataCount}개 · 라벨 {abaloneStatus.labelCount}개</strong>
            <div>
              <span>검수 완료 {abaloneStatus.reviewedCount}개</span>
              <span>승인 완료 {abaloneStatus.approvedCount}개</span>
              <span>분석 누락 {abaloneStatus.missingMetadata.length}개</span>
              <span>라벨 누락 {abaloneStatus.missingLabels.length}개</span>
            </div>
          </div>
          <div className="admin-ai-result-list">
            {abaloneItems.slice(0, 12).map((item) => (
              <article className="admin-ai-result-card" key={item.imageId}>
                <div className="admin-ai-result-image">
                  <img src={`/api/admin/ai/dataset-image?category=abalone&file=${encodeURIComponent(item.fileName)}`} alt={item.fileName} />
                </div>
                <div className="admin-ai-result-fields">
                  <div>
                    <strong>{item.fileName}</strong>
                    <span>분석 결과 {existsLabel(item.metadata)} · 라벨 {existsLabel(item.label)} · 검수 {yesNo(item.label?.reviewed)}</span>
                  </div>
                  {item.metadata && (
                    <p>
                      AI 추천: {getAiRoleLabel(item.metadata.suggestedRole)} / {getAiSectionLabel(item.metadata.recommendedSection)} · 품질 {item.metadata.qualityScore}점
                    </p>
                  )}
                  {item.label && (
                    <p>
                      정답 라벨: {getAiRoleLabel(item.label.expectedRole)} / {getAiSectionLabel(item.label.expectedSection)} · 승인 {yesNo(item.label.approved)}
                    </p>
                  )}
                </div>
              </article>
            ))}
            {!abaloneItems.length && <p className="admin-empty-note">아직 등록된 실제 데이터셋 이미지가 없습니다.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div>
            <h2>오분류 확인</h2>
            <span className="admin-message">점수가 낮거나 정답 라벨과 다른 항목을 먼저 확인해 프롬프트와 운영 규칙을 개선합니다.</span>
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
      </div>
    </AdminLayout>
  );
}
