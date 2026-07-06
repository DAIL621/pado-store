"use client";

import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import {
  AI_IMAGE_ROLE_OPTIONS,
  AI_IMAGE_SECTION_OPTIONS,
  analyzeImagesWithMockEngine,
  convertImageAnalysisToDetailJson,
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

const CATEGORIES = [
  { value: "abalone", label: "전복" },
  { value: "conch", label: "참소라" },
  { value: "eel", label: "장어/아나고" },
  { value: "fish", label: "생선" },
  { value: "mealKit", label: "밀키트" },
  { value: "gift", label: "선물세트" },
  { value: "seafood", label: "기타 수산물" }
];

function createDraft(file: File): ImageDraft {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    imageUrl: URL.createObjectURL(file),
    originalName: file.name
  };
}

export function AdminAiImageAnalyzer() {
  const [category, setCategory] = useState("abalone");
  const [drafts, setDrafts] = useState<ImageDraft[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<AiImageAnalysisResult[]>([]);
  const [message, setMessage] = useState("상품 사진을 여러 장 올리면 Mock AI가 역할과 상세페이지 배치 위치를 추천합니다.");

  const convertedDetailJson = useMemo(() => convertImageAnalysisToDetailJson(results), [results]);

  const addFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      setMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setDrafts((current) => [...current, ...images.map(createDraft)]);
    setMessage(`${images.length}장의 사진이 추가되었습니다. 분석 시작 버튼을 눌러 역할을 추천받으세요.`);
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.imageUrl);
      return current.filter((item) => item.id !== id);
    });
    setResults((current) => current.filter((item) => item.imageUrl !== drafts.find((draft) => draft.id === id)?.imageUrl));
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

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    addFiles(files);
  };

  const startAnalysis = () => {
    if (!drafts.length) {
      setMessage("분석할 사진을 먼저 업로드해주세요.");
      return;
    }
    const nextResults = analyzeImagesWithMockEngine(
      drafts.map((draft, index) => ({
        imageUrl: draft.imageUrl,
        originalName: draft.originalName,
        index,
        category
      }))
    );
    setResults(nextResults);
    setMessage(`${nextResults.length}장의 사진 분석이 완료되었습니다. 운영자가 역할과 문구를 수정할 수 있습니다.`);
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
          상품 사진을 올리면 파일명, 업로드 순서, 상품 카테고리를 기준으로 상세페이지에서 쓸 역할을 추천합니다.
          실제 Vision API 연결 전에도 운영자가 사진 역할과 문구를 빠르게 정리할 수 있습니다.
        </p>
        <div>
          <a className="button teal" href="#ai-image-upload">사진 업로드</a>
          <a className="button outline" href="#ai-analysis-result">분석 결과 보기</a>
        </div>
      </section>

      <section className="admin-panel admin-ai-toolbar" id="ai-image-upload">
        <div>
          <h2>사진 업로드</h2>
          <span className="admin-message">Drag & Drop, 다중 선택, 미리보기, 삭제, 순서 변경을 지원합니다.</span>
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
        <strong>사진을 여기에 끌어다 놓으세요</strong>
        <span>또는 클릭해서 여러 장을 선택하세요. JPG, PNG, WebP 이미지를 권장합니다.</span>
        <input
          type="file"
          accept="image/*"
          multiple
          aria-label="AI 분석용 사진 업로드"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
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
        <button type="button" className="button teal" onClick={startAnalysis}>분석 시작</button>
        <span>현재 {drafts.length}장 준비됨</span>
      </div>

      <section className="admin-panel" id="ai-analysis-result">
        <div>
          <h2>분석 결과</h2>
          <span className="admin-message">AI 제안은 모두 수정 가능합니다. 저장 기능은 다음 단계에서 상품등록 흐름과 연결합니다.</span>
        </div>

        <div className="admin-ai-result-list">
          {results.map((result, index) => (
            <article className="admin-ai-result-card" key={`${result.originalName}-${index}`}>
              <div className="admin-ai-result-image">
                <img src={result.imageUrl} alt={result.originalName} />
              </div>
              <div className="admin-ai-result-fields">
                <div>
                  <strong>{result.originalName}</strong>
                  <span>신뢰도 {result.confidence}% · 품질 {result.qualityScore}점</span>
                </div>
                {result.warningMessage && <p className="admin-ai-warning">{result.warningMessage}</p>}
                <label>
                  추천 역할
                  <select value={result.suggestedRole} onChange={(event) => updateResult(index, "suggestedRole", event.target.value as AiImageRole)}>
                    {AI_IMAGE_ROLE_OPTIONS.map((item) => (
                      <option value={item.value} key={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  상세페이지 배치 위치
                  <select value={result.recommendedSection} onChange={(event) => updateResult(index, "recommendedSection", event.target.value as AiImageRecommendedSection)}>
                    {AI_IMAGE_SECTION_OPTIONS.map((item) => (
                      <option value={item.value} key={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  자동 제목
                  <input value={result.title} onChange={(event) => updateResult(index, "title", event.target.value)} />
                </label>
                <label>
                  자동 설명
                  <textarea value={result.description} onChange={(event) => updateResult(index, "description", event.target.value)} rows={3} />
                </label>
              </div>
            </article>
          ))}
          {!results.length && <p className="admin-empty-note">분석 시작 후 사진별 추천 역할과 상세페이지 배치 제안이 표시됩니다.</p>}
        </div>
      </section>

      <section className="admin-panel">
        <div>
          <h2>detail_json 연결 준비</h2>
          <span className="admin-message">`convertImageAnalysisToDetailJson()` 변환 결과 미리보기입니다.</span>
        </div>
        <pre className="admin-ai-json-preview">{JSON.stringify(convertedDetailJson, null, 2)}</pre>
      </section>
    </div>
  );
}

