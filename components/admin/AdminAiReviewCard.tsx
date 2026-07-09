"use client";

import { useState } from "react";
import type { AiImageRecommendedSection, AiImageRole } from "@/lib/admin/ai-image-analysis";

const ROLE_OPTIONS: AiImageRole[] = ["hero", "origin", "sizeComparison", "freshness", "package", "shipping", "cooking", "components", "process", "review", "detail", "unknown"];
const SECTION_OPTIONS: AiImageRecommendedSection[] = ["heroImages", "journey", "gallery", "packaging", "recipes", "components", "process", "extraSections"];

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
  const [message, setMessage] = useState(reviewed ? "검수 완료" : "검수 대기");
  const [saving, setSaving] = useState(false);

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
      if (!response.ok || !body.ok) throw new Error(body?.message || "label 저장 실패");
      setReviewed(Boolean(body.label.reviewed));
      setApproved(Boolean(body.label.approved));
      setNotes(body.label.reviewerNotes || "");
      setMessage(body.label.approved ? "승인 저장 완료" : body.label.reviewed ? "검수 저장 완료" : "보류 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장 실패");
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
            {props.category} / confidence {props.confidence}% / quality {props.qualityScore} / {message}
          </span>
        </div>
        <p className="admin-ai-reasoning">{props.reviewHint}</p>
        <div className="admin-ai-review-row">
          <label>
            AI role
            <input readOnly value={`${props.aiRole} -> ${role}`} />
          </label>
          <label>
            AI section
            <input readOnly value={`${props.aiSection} -> ${section}`} />
          </label>
          <label>
            Rule
            <input readOnly value={props.appliedRule || "No operator rule"} />
          </label>
        </div>
        <label>
          Role 변경
          <select value={role} onChange={(event) => setRole(event.target.value as AiImageRole)}>
            {ROLE_OPTIONS.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Section 변경
          <select value={section} onChange={(event) => setSection(event.target.value as AiImageRecommendedSection)}>
            {SECTION_OPTIONS.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Hero Rank
          <input value={heroRank} onChange={(event) => setHeroRank(event.target.value)} placeholder="none" />
        </label>
        <label>
          Quality Score
          <input value={qualityScore} onChange={(event) => setQualityScore(event.target.value)} />
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Caption
          <textarea rows={2} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <label>
          Description
          <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Reviewer Notes
          <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="admin-ai-action-row compact">
          <button type="button" disabled={saving} onClick={() => save(true, true, notes || "approved")}>승인</button>
          <button type="button" disabled={saving} onClick={() => save(false, false, notes || "hold")}>보류</button>
          <button type="button" disabled={saving} onClick={() => save(false, true, notes || "role/section reviewed")}>저장</button>
          <span>{reviewed ? "reviewed=true" : "reviewed=false"} / {approved ? "approved=true" : "approved=false"}</span>
        </div>
      </div>
    </article>
  );
}
