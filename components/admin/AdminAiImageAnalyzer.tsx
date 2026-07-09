"use client";

import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import {
  AI_IMAGE_ANALYSIS_DRAFT_KEY,
  AI_IMAGE_ROLE_OPTIONS,
  AI_IMAGE_SECTION_OPTIONS,
  analyzeImagesWithMockEngine,
  applyHeroRanking,
  convertImageAnalysisToDetailJson,
  getAiRoleLabel,
  sortAiImageAnalysisResults,
  summarizeAiImageAnalysis,
  type AiImageAnalysisResult,
  type AiImageRecommendedSection,
  type AiImageRole
} from "@/lib/admin/ai-image-analysis";

type ImageDraft = {
  id: string;
  file: File;
  imageUrl: string;
  originalName: string;
};

type ProviderInfo = {
  provider: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
};

type ResultFilter = "all" | "hero" | "needsReview" | "package" | "cooking" | "components";

const CATEGORIES = [
  { value: "abalone", label: "전복" },
  { value: "eel", label: "바다장어" },
  { value: "octopus", label: "문어" },
  { value: "oyster", label: "굴" },
  { value: "shrimp", label: "새우" },
  { value: "fish", label: "생선" },
  { value: "mealKit", label: "밀키트" },
  { value: "gift", label: "선물세트" },
  { value: "seafood", label: "기타 수산물" }
];

const FILTERS: Array<{ value: ResultFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "hero", label: "대표사진 후보" },
  { value: "needsReview", label: "확인 필요" },
  { value: "package", label: "포장·배송" },
  { value: "cooking", label: "조리" },
  { value: "components", label: "구성품" }
];

function providerLabel(provider: string) {
  if (provider === "openai") return "OpenAI Vision";
  if (provider === "mock") return "기본 분석";
  return provider;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function createDraft(file: File): Promise<ImageDraft> {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    imageUrl: await fileToDataUrl(file),
    originalName: file.name
  };
}

function filterResults(results: AiImageAnalysisResult[], filter: ResultFilter) {
  if (filter === "hero") return results.filter((item) => item.heroRank || item.suggestedRole === "hero");
  if (filter === "needsReview") return results.filter((item) => item.qualityScore < 75 || item.suggestedRole === "unknown" || item.warningMessage);
  if (filter === "package") return results.filter((item) => item.suggestedRole === "package" || item.suggestedRole === "shipping");
  if (filter === "cooking") return results.filter((item) => item.suggestedRole === "cooking");
  if (filter === "components") return results.filter((item) => item.suggestedRole === "components");
  return results;
}

export function AdminAiImageAnalyzer() {
  const [category, setCategory] = useState("abalone");
  const [drafts, setDrafts] = useState<ImageDraft[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<AiImageAnalysisResult[]>([]);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [message, setMessage] = useState("상품 사진을 올리면 AI가 역할, 품질 점수, 대표사진 후보, 상세페이지 배치 위치를 추천합니다.");

  const summary = useMemo(() => summarizeAiImageAnalysis(results), [results]);
  const filteredResults = useMemo(() => filterResults(results, resultFilter), [results, resultFilter]);
  const convertedDetailJson = useMemo(() => convertImageAnalysisToDetailJson(results), [results]);

  const addFiles = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      setMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    const nextDrafts = await Promise.all(images.map(createDraft));
    setDrafts((current) => [...current, ...nextDrafts]);
    setMessage(`${images.length}장의 사진을 추가했습니다. 분석 시작 버튼을 눌러 사진 역할을 추천받으세요.`);
  };

  const removeDraft = (id: string) => {
    const target = drafts.find((draft) => draft.id === id);
    setDrafts((current) => current.filter((item) => item.id !== id));
    if (target) setResults((current) => current.filter((item) => item.imageUrl !== target.imageUrl));
  };

  const moveDraft = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= drafts.length) return;
    setDrafts((current) => {
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const sortByAiRecommendation = () => {
    const sortedResults = sortAiImageAnalysisResults(applyHeroRanking(results));
    setResults(sortedResults);
    setDrafts((current) => {
      const order = new Map(sortedResults.map((item, index) => [item.imageUrl, index]));
      return [...current].sort((a, b) => (order.get(a.imageUrl) ?? 999) - (order.get(b.imageUrl) ?? 999));
    });
    setMessage("AI 추천 순서로 정렬했습니다. 필요하면 위/아래 버튼으로 직접 조정할 수 있습니다.");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const startAnalysis = async () => {
    if (!drafts.length) {
      setMessage("분석할 사진을 먼저 업로드해주세요.");
      return;
    }

    const inputs = drafts.map((draft, index) => ({
      imageUrl: draft.imageUrl,
      originalName: draft.originalName,
      index,
      category
    }));

    setIsAnalyzing(true);
    setProviderInfo(null);
    setMessage("AI가 사진을 분석 중입니다. 사진 내용과 파일명을 함께 확인하고 있습니다.");

    try {
      const response = await fetch("/api/admin/ai/images/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, images: inputs })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body?.message || "AI 사진분석 API 요청에 실패했습니다.");

      const nextResults = applyHeroRanking(body.results);
      setResults(nextResults);
      setProviderInfo({
        provider: body.provider || "mock",
        fallbackUsed: Boolean(body.fallbackUsed),
        fallbackReason: body.fallbackReason
      });
      setMessage(
        body.fallbackUsed
          ? "실제 AI 분석에 실패하여 기본 분석으로 대체했습니다. 운영자가 결과를 확인하고 수정할 수 있습니다."
          : `${nextResults.length}장의 사진 분석을 완료했습니다. 대표사진 후보와 확인 필요 항목을 검토해주세요.`
      );
    } catch (error) {
      const nextResults = analyzeImagesWithMockEngine(inputs).map((item) => ({
        ...item,
        warningMessage: item.warningMessage || "서버 AI 분석에 실패하여 기본 분석으로 대체했습니다.",
        reasoningSummary: "서버 API 실패로 파일명과 업로드 순서 기반 분석을 사용했습니다."
      }));
      setResults(nextResults);
      setProviderInfo({
        provider: "mock",
        fallbackUsed: true,
        fallbackReason: error instanceof Error ? error.message : "알 수 없는 클라이언트 대체 분석"
      });
      setMessage("실제 AI 분석에 실패하여 기본 분석으로 대체했습니다. 결과를 수정한 뒤 상품등록으로 보낼 수 있습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendToProductRegistration = () => {
    if (!results.length) {
      setMessage("상품등록으로 보내기 전에 분석을 먼저 실행해주세요.");
      return;
    }
    const detailJson = convertImageAnalysisToDetailJson(results);
    try {
      window.localStorage.setItem(
        AI_IMAGE_ANALYSIS_DRAFT_KEY,
        JSON.stringify({
          source: "ai-image-analysis",
          category,
          results,
          detailJson,
          savedAt: new Date().toISOString()
        })
      );
      setMessage("AI 사진분석 결과를 상품등록 초안으로 저장했습니다. 상품등록 화면으로 이동합니다.");
      window.setTimeout(() => {
        window.location.href = "/admin/new?source=ai-images";
      }, 450);
    } catch {
      setMessage("브라우저 저장 공간 문제로 AI 분석 결과를 상품등록으로 보낼 수 없습니다.");
    }
  };

  const updateResult = <K extends keyof AiImageAnalysisResult>(index: number, key: K, value: AiImageAnalysisResult[K]) => {
    setResults((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  };

  return (
    <div className="admin-ai-page">
      <section className="admin-ops-hero">
        <span>PADO STORY AI CENTER</span>
        <h2>AI 사진분석</h2>
        <p>
          상품 사진을 올리면 AI가 사진의 실제 내용과 파일명을 함께 보고 역할, 품질 점수, 대표사진 후보, 상세페이지 배치 위치를 추천합니다.
        </p>
        <div>
          <a className="button teal" href="#ai-image-upload">사진 업로드</a>
          <a className="button outline" href="#ai-analysis-result">분석 결과 보기</a>
        </div>
      </section>

      <section className="admin-panel admin-ai-toolbar" id="ai-image-upload">
        <div>
          <h2>사진 업로드</h2>
          <span className="admin-message">드래그 앤 드롭, 여러 장 선택, 미리보기, 삭제, 순서 변경을 지원합니다.</span>
        </div>
        <label>
          상품 카테고리
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option value={item.value} key={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </section>

      <div
        className={`admin-ai-dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <strong>사진을 여기에 놓아주세요</strong>
        <span>또는 클릭해서 여러 장을 선택하세요. JPG, PNG, WebP 이미지를 권장합니다.</span>
        <input
          type="file"
          accept="image/*"
          multiple
          aria-label="AI 분석용 사진 업로드"
          onChange={(event) => {
            void addFiles(Array.from(event.target.files ?? []));
            event.currentTarget.value = "";
          }}
        />
      </div>

      <p className="admin-detail-upload-message info" role="status">{message}</p>

      <section className="admin-ai-image-grid" aria-label="업로드한 사진">
        {drafts.map((draft, index) => (
          <article className="admin-ai-image-card" key={draft.id}>
            <div>
              <img src={draft.imageUrl} alt={draft.originalName} />
              {index === 0 && <em>대표 후보</em>}
            </div>
            <strong>{index + 1}. {draft.originalName}</strong>
            <span>{Math.round(draft.file.size / 1024)}KB</span>
            <div>
              <button type="button" onClick={() => moveDraft(index, index - 1)} disabled={index === 0}>위로</button>
              <button type="button" onClick={() => moveDraft(index, index + 1)} disabled={index === drafts.length - 1}>아래로</button>
              <button type="button" onClick={() => removeDraft(draft.id)}>삭제</button>
            </div>
          </article>
        ))}
        {!drafts.length && <p className="admin-empty-note">아직 업로드한 사진이 없습니다.</p>}
      </section>

      <div className="admin-ai-action-row">
        <button type="button" className="button teal" onClick={() => void startAnalysis()} disabled={isAnalyzing}>
          {isAnalyzing ? "AI 분석 중..." : "분석 시작"}
        </button>
        <button type="button" className="button outline" onClick={sortByAiRecommendation} disabled={!results.length || isAnalyzing}>
          AI 추천 순서로 정렬
        </button>
        <button type="button" className="button coral" onClick={sendToProductRegistration} disabled={!results.length || isAnalyzing}>
          상품등록으로 보내기
        </button>
        <span>현재 {drafts.length}장 준비됨</span>
      </div>

      <section className="admin-panel" id="ai-analysis-result">
        <div>
          <h2>분석 결과</h2>
          <span className="admin-message">역할 요약, 대표 후보, 확인 필요 사진을 먼저 보고 운영자가 빠르게 수정할 수 있습니다.</span>
        </div>

        {providerInfo && (
          <div className={`admin-ai-provider-badge ${providerInfo.fallbackUsed ? "fallback" : ""}`}>
            <strong>분석 방식: {providerLabel(providerInfo.provider)}</strong>
            <span>{providerInfo.fallbackUsed ? "기본 분석으로 대체됨" : "실제 AI 분석 정상"}</span>
            {providerInfo.fallbackReason && <em>{providerInfo.fallbackReason}</em>}
          </div>
        )}

        {results.length > 0 && (
          <div className="admin-ai-summary">
            <strong>전체 {summary.total}장 · 평균 품질 {summary.averageQuality}점 · 확인 필요 {summary.needsReview}장</strong>
            <div>
              {summary.heroCandidates.map((item) => (
                <span key={item.imageUrl}>대표 {item.heroRank}순위: {item.originalName}</span>
              ))}
            </div>
            <div>
              {Object.entries(summary.roleCounts).map(([role, count]) => (
                <span key={role}>{getAiRoleLabel(role as AiImageRole)}: {count}</span>
              ))}
            </div>
          </div>
        )}

        <div className="admin-ai-filter-row" aria-label="AI 분석 결과 필터">
          {FILTERS.map((item) => (
            <button type="button" className={resultFilter === item.value ? "active" : ""} key={item.value} onClick={() => setResultFilter(item.value)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="admin-ai-result-list">
          {filteredResults.map((result, index) => (
            <article className="admin-ai-result-card" key={`${result.originalName}-${index}`}>
              <div className="admin-ai-result-image">
                <img src={result.imageUrl} alt={result.originalName} />
                {result.heroRank && <em>대표 {result.heroRank}순위</em>}
              </div>
              <div className="admin-ai-result-fields">
                <div>
                  <strong>{result.originalName}</strong>
                  <span>신뢰도 {result.confidence}% · 품질 {result.qualityScore}점 · {getAiRoleLabel(result.suggestedRole)}</span>
                </div>
                {result.warningMessage && <p className="admin-ai-warning">{result.warningMessage}</p>}
                {result.reasoningSummary && <p className="admin-ai-reasoning">{result.reasoningSummary}</p>}
                <label>
                  추천 역할
                  <select value={result.suggestedRole} onChange={(event) => updateResult(results.indexOf(result), "suggestedRole", event.target.value as AiImageRole)}>
                    {AI_IMAGE_ROLE_OPTIONS.map((item) => (
                      <option value={item.value} key={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  상세페이지 배치 위치
                  <select value={result.recommendedSection} onChange={(event) => updateResult(results.indexOf(result), "recommendedSection", event.target.value as AiImageRecommendedSection)}>
                    {AI_IMAGE_SECTION_OPTIONS.map((item) => (
                      <option value={item.value} key={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  자동 제목
                  <input value={result.title} onChange={(event) => updateResult(results.indexOf(result), "title", event.target.value)} />
                </label>
                <label>
                  자동 설명
                  <textarea value={result.description} onChange={(event) => updateResult(results.indexOf(result), "description", event.target.value)} rows={3} />
                </label>
              </div>
            </article>
          ))}
          {!filteredResults.length && <p className="admin-empty-note">해당 필터에 표시할 분석 결과가 없습니다.</p>}
        </div>
      </section>

      <section className="admin-panel">
        <div>
          <h2>상세페이지 데이터 연결 준비</h2>
          <span className="admin-message">FAQ, 상품 장점, 갤러리, 포장, 레시피와 공정 섹션 초안까지 함께 생성합니다.</span>
        </div>
        <pre className="admin-ai-json-preview">{JSON.stringify(convertedDetailJson, null, 2)}</pre>
      </section>
    </div>
  );
}
