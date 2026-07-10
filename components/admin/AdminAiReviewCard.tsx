"use client";

import { useState } from "react";
import {
  AI_IMAGE_ROLE_OPTIONS,
  AI_IMAGE_SECTION_OPTIONS,
  getAiRoleLabel,
  getAiSectionLabel,
  type AiImageRecommendedSection,
  type AiImageRole
} from "@/lib/admin/ai-image-analysis";

export type AdminAiReviewCardProps = {
  category: string;
  fileName: string;
  imageSrc?: string;
  statusLabel: string;
  statusClassName: string;
  confidence: number;
  qualityScore: number;
  reviewHint: string;
  aiRole: AiImageRole;
  aiSection: AiImageRecommendedSection;
  expectedRole: AiImageRole;
  expectedSection: AiImageRecommendedSection;
  expectedHeroRank: number | null;
  expectedQualityScore: number;
  expectedTitle: string;
  expectedCaption: string;
  expectedDescription: string;
  reviewed?: boolean;
  approved?: boolean;
  reviewerNotes?: string;
  appliedRule?: string;
};

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

export function AdminAiReviewCard(props: AdminAiReviewCardProps) {
  const [role, setRole] = useState<AiImageRole>(props.expectedRole);
  const [section, setSection] = useState<AiImageRecommendedSection>(props.expectedSection);
  const [heroRank, setHeroRank] = useState(props.expectedHeroRank ? String(props.expectedHeroRank) : "");
  const [qualityScore, setQualityScore] = useState(String(props.expectedQualityScore));
  const [title, setTitle] = useState(props.expectedTitle);
  const [caption, setCaption] = useState(props.expectedCaption);
  const [description, setDescription] = useState(props.expectedDescription);
  const [notes, setNotes] = useState(props.reviewerNotes || "");
  const [reviewed, setReviewed] = useState(Boolean(props.reviewed));
  const [approved, setApproved] = useState(Boolean(props.approved));
  const [message, setMessage] = useState(reviewed ? "저장됨" : "저장 전");
  const [saving, setSaving] = useState(false);

  const roleMismatch = props.aiRole !== role;
  const sectionMismatch = props.aiSection !== section;

  const save = async (nextApproved = approved, nextReviewed = true, nextNotes = notes) => {
    setSaving(true);
    setMessage("저장 중...");
    try {
      const response = await fetch("/api/admin/ai/review/update-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: props.category,
          fileName: props.fileName,
          expectedRole: role,
          expectedSection: section,
          expectedHeroRank: heroRank,
          expectedQualityScore: qualityScore,
          expectedTitle: title,
          expectedCaption: caption,
          expectedDescription: description,
          reviewed: nextReviewed,
          approved: nextApproved,
          reviewerNotes: nextNotes
        })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body?.message || "검수 결과 저장에 실패했습니다.");
      setReviewed(Boolean(body.label.reviewed));
      setApproved(Boolean(body.label.approved));
      setNotes(body.label.reviewerNotes || "");
      setMessage(body.label.approved ? "승인 저장 완료" : body.label.reviewed ? "검수 저장 완료" : "보류 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="admin-ai-result-card">
      <div className="admin-ai-result-image">
        {props.imageSrc ? <img src={props.imageSrc} alt={props.fileName} /> : <div className="admin-ai-placeholder-image">{props.confidence}%</div>}
        <em className={`admin-ai-status-pill ${props.statusClassName}`}>{props.statusLabel}</em>
      </div>
      <div className="admin-ai-result-fields">
        <div>
          <strong>{props.fileName}</strong>
          <span>
            {categoryLabel(props.category)} / 신뢰도 {props.confidence}% / 품질 {props.qualityScore}점 / {message}
          </span>
        </div>
        <p className="admin-ai-reasoning">{props.reviewHint}</p>
        <div className="admin-ai-review-row">
          <label>
            AI 추천 역할
            <input readOnly value={getAiRoleLabel(props.aiRole)} />
          </label>
          <label>
            운영자 최종 역할
            <input className={roleMismatch ? "admin-ai-compare-mismatch" : "admin-ai-compare-match"} readOnly value={`${getAiRoleLabel(role)}${roleMismatch ? " (수정됨)" : ""}`} />
          </label>
          <label>
            AI 추천 섹션
            <input readOnly value={getAiSectionLabel(props.aiSection)} />
          </label>
          <label>
            운영자 최종 섹션
            <input className={sectionMismatch ? "admin-ai-compare-mismatch" : "admin-ai-compare-match"} readOnly value={`${getAiSectionLabel(section)}${sectionMismatch ? " (수정됨)" : ""}`} />
          </label>
          <label>
            승인 상태
            <input readOnly value={approved ? "승인 완료" : "미승인"} />
          </label>
          <label>
            저장 상태
            <input readOnly value={reviewed ? "검수 완료" : "검수 전"} />
          </label>
        </div>
        <div className="admin-ai-review-row">
          <label>
            적용 규칙
            <input readOnly value={props.appliedRule || "적용된 운영 규칙 없음"} />
          </label>
        </div>
        <label>
          역할 변경
          <select value={role} onChange={(event) => setRole(event.target.value as AiImageRole)}>
            {AI_IMAGE_ROLE_OPTIONS.map((item) => (
              <option value={item.value} key={item.value}>{getAiRoleLabel(item.value)}</option>
            ))}
          </select>
        </label>
        <label>
          상세페이지 섹션 변경
          <select value={section} onChange={(event) => setSection(event.target.value as AiImageRecommendedSection)}>
            {AI_IMAGE_SECTION_OPTIONS.map((item) => (
              <option value={item.value} key={item.value}>{getAiSectionLabel(item.value)}</option>
            ))}
          </select>
        </label>
        <label>
          대표사진 순위
          <input value={heroRank} onChange={(event) => setHeroRank(event.target.value)} placeholder="없음" />
        </label>
        <label>
          품질 점수
          <input value={qualityScore} onChange={(event) => setQualityScore(event.target.value)} />
        </label>
        <label>
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          캡션
          <textarea rows={2} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <label>
          설명
          <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          운영자 메모
          <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="admin-ai-action-row compact">
          <button type="button" disabled={saving} onClick={() => save(true, true, notes || "운영자가 승인했습니다.")}>승인</button>
          <button type="button" disabled={saving} onClick={() => save(false, false, notes || "추가 확인이 필요합니다.")}>보류</button>
          <button type="button" disabled={saving} onClick={() => save(false, true, notes || "역할과 섹션을 검수했습니다.")}>저장</button>
          <span>{reviewed ? "검수 완료" : "검수 전"} / {approved ? "승인됨" : "미승인"}</span>
        </div>
      </div>
    </article>
  );
}
