"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { ProductDetailEditor } from "@/components/admin/ProductDetailEditor";
import { ProductDetailPreview } from "@/components/admin/ProductDetailPreview";
import { generateProductDescription, generateProductDetailDraft } from "@/lib/admin/ai-product-drafts";
import { createProductDetailFormValue, type ProductDetail } from "@/lib/products/detail";

export type AdminProductFormState = {
  name: string;
  slug: string;
  origin: string;
  category: string;
  subtitle: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  badge: string;
  highlights: string;
};

export type AdminProductOptionForm = {
  name: string;
  priceDelta: string;
  stock: string;
};

export type AdminProductBuilderPayload = {
  form: AdminProductFormState;
  options: AdminProductOptionForm[];
  detailJson: ProductDetail;
};

type SubmitResult = {
  ok: boolean;
  message?: string;
  productUrl?: string;
};

type Props = {
  title: string;
  initialMessage: string;
  submitLabel: string;
  savingLabel: string;
  successMessage: string;
  initialForm: AdminProductFormState;
  initialOptions: AdminProductOptionForm[];
  initialDetail?: ProductDetail | null;
  resetAfterSuccess?: boolean;
  onSubmit: (payload: AdminProductBuilderPayload) => Promise<SubmitResult>;
  onSuccess?: (result: SubmitResult) => void | Promise<void>;
};

export const emptyProductForm: AdminProductFormState = {
  name: "",
  slug: "",
  origin: "",
  category: "",
  subtitle: "",
  description: "",
  basePrice: "",
  imageUrl: "/images/products/wando-abalone.webp",
  badge: "",
  highlights: "산지 선별, 신선 포장, 빠른 출고"
};

export const defaultProductOptions: AdminProductOptionForm[] = [{ name: "기본 옵션", priceDelta: "0", stock: "30" }];

export function AdminProductBuilder({
  title,
  initialMessage,
  submitLabel,
  savingLabel,
  successMessage,
  initialForm,
  initialOptions,
  initialDetail,
  resetAfterSuccess = false,
  onSubmit,
  onSuccess
}: Props) {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState<AdminProductOptionForm[]>(initialOptions);
  const [detailJson, setDetailJson] = useState(() => createProductDetailFormValue(initialDetail));
  const [message, setMessage] = useState(initialMessage);
  const [createdUrl, setCreatedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const update = (key: keyof AdminProductFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateOption = (index: number, key: keyof AdminProductOptionForm, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, [key]: value } : option)));
  };

  const addOption = () => {
    setOptions((current) => [...current, { name: "", priceDelta: "0", stock: "0" }]);
  };

  const removeOption = (index: number) => {
    setOptions((current) => (current.length === 1 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  };

  const progress = useMemo(() => {
    const checks = [
      form.name,
      form.origin,
      form.category,
      form.subtitle,
      form.description,
      form.basePrice,
      options.some((option) => option.name && option.stock),
      detailJson.heroImages.some((image) => image.url),
      detailJson.benefits.some(Boolean),
      detailJson.packaging.some(Boolean)
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [detailJson, form, options]);

  const inputRef = (node: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (node && !node.value && node.required && !firstInvalidRef.current) firstInvalidRef.current = node;
  };

  const fillDraft = () => {
    const seed = {
      name: form.name || "신규 상품",
      origin: form.origin || "산지",
      category: form.category
    };
    const draft = generateProductDetailDraft(seed);
    setForm((current) => ({
      ...current,
      description: current.description || generateProductDescription(seed),
      subtitle: current.subtitle || `${seed.origin}에서 바로 보내는 ${seed.name}`
    }));
    setDetailJson((current) => ({
      ...current,
      benefits: current.benefits.some(Boolean) ? current.benefits : draft.benefits,
      journey: current.journey.some((step) => step.description || step.image) ? current.journey : draft.journey,
      packaging: current.packaging.some(Boolean) ? current.packaging : draft.packaging,
      recipes: current.recipes.some((recipe) => recipe.title || recipe.description) ? current.recipes : draft.recipes,
      faq: current.faq.some((item) => item.question || item.answer) ? current.faq : draft.faq
    }));
    setMessage("상품명과 산지를 기준으로 상세페이지 초안을 채웠습니다.");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    firstInvalidRef.current = null;
    setSaving(true);
    setCreatedUrl("");
    setMessage("저장하는 중입니다...");

    const result = await onSubmit({ form, options, detailJson });

    if (!result.ok) {
      setMessage(result.message ?? "저장에 실패했습니다.");
      setSaving(false);
      const invalidField = firstInvalidRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
      invalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidField?.focus();
      return;
    }

    if (resetAfterSuccess) {
      setForm(initialForm);
      setOptions(initialOptions);
      setDetailJson(createProductDetailFormValue(initialDetail));
    }
    setCreatedUrl(result.productUrl ?? "");
    setMessage(result.message ?? successMessage);
    setSaving(false);
    await onSuccess?.(result);
  };

  return (
    <>
      <div className="admin-product-progress">
        <div>
          <span>상품등록 진행률</span>
          <strong>{progress}%</strong>
        </div>
        <progress value={progress} max={100} aria-label="상품등록 진행률" />
      </div>

      <div className="admin-panel">
        <div>
          <h2>{title}</h2>
          <span className="admin-message">{message}</span>
          {createdUrl && <a className="admin-message-link" href={createdUrl} target="_blank">방금 저장한 상품 보기 →</a>}
        </div>
        <button type="button" className="button outline" onClick={fillDraft}>초안 자동 채우기</button>

        <form className="admin-product-builder" onSubmit={submit}>
          <div className="admin-product-builder-main">
            <details className="admin-form-section" open>
              <summary>① 기본정보</summary>
              <div className="admin-form section-grid">
                <label>
                  상품명 <em>필수</em>
                  <input ref={inputRef} value={form.name} onChange={(event) => update("name", event.target.value)} required placeholder="예: 완도 활전복" />
                </label>
                <label>
                  URL 이름(slug)
                  <input value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="예: wando-live-abalone" />
                </label>
                <label>
                  산지 <em>필수</em>
                  <input ref={inputRef} value={form.origin} onChange={(event) => update("origin", event.target.value)} required placeholder="예: 완도" />
                </label>
                <label>
                  카테고리 <em>필수</em>
                  <input ref={inputRef} value={form.category} onChange={(event) => update("category", event.target.value)} required placeholder="예: 전복·조개" />
                </label>
                <label>
                  대표 배지
                  <input value={form.badge} onChange={(event) => update("badge", event.target.value)} placeholder="BEST, 제철, 추천" />
                </label>
                <label>
                  대표 이미지 경로
                  <input value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="/images/products/sample.webp" />
                </label>
                <label className="wide">
                  한 줄 설명 <em>필수</em>
                  <input ref={inputRef} value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} required placeholder="상품 카드와 상세 상단에 보이는 짧은 문구" />
                </label>
                <label className="wide">
                  기본 상세 설명 <em>필수</em>
                  <textarea ref={inputRef} value={form.description} onChange={(event) => update("description", event.target.value)} required rows={4} />
                </label>
                <label className="wide">
                  카드 핵심 문구
                  <input value={form.highlights} onChange={(event) => update("highlights", event.target.value)} placeholder="쉼표로 구분" />
                </label>
              </div>
            </details>

            <details className="admin-form-section" open>
              <summary>② 가격 / 옵션</summary>
              <div className="admin-form section-grid">
                <label>
                  기본 판매가 <em>필수</em>
                  <input ref={inputRef} type="number" value={form.basePrice} onChange={(event) => update("basePrice", event.target.value)} required placeholder="39900" />
                </label>
              </div>
              <div className="option-editor">
                <div className="option-editor-head">
                  <div>
                    <strong>상품 옵션 / 재고</strong>
                    <small>옵션별 추가금액과 재고를 입력합니다.</small>
                  </div>
                  <button type="button" onClick={addOption}>+ 옵션 추가</button>
                </div>
                {options.map((option, index) => (
                  <div className="option-row" key={index}>
                    <label>옵션명<input value={option.name} onChange={(event) => updateOption(index, "name", event.target.value)} required placeholder="예: 1kg" /></label>
                    <label>추가금액<input type="number" value={option.priceDelta} onChange={(event) => updateOption(index, "priceDelta", event.target.value)} required /></label>
                    <label>재고<input type="number" value={option.stock} onChange={(event) => updateOption(index, "stock", event.target.value)} required min="0" /></label>
                    <button type="button" className="remove-option" onClick={() => removeOption(index)} disabled={options.length === 1}>삭제</button>
                  </div>
                ))}
              </div>
            </details>

            <ProductDetailEditor value={detailJson} onChange={setDetailJson} />

            <details className="admin-form-section" open>
              <summary>⑩ 저장</summary>
              <div className="admin-save-panel">
                <p>필수 정보와 상세페이지 자동 생성 정보를 확인한 뒤 저장합니다.</p>
                <button type="submit" className="button teal" disabled={saving}>{saving ? savingLabel : submitLabel}</button>
              </div>
            </details>
          </div>

          <ProductDetailPreview
            form={form}
            options={options.map((option) => ({
              label: option.name,
              priceDelta: Number(option.priceDelta) || 0,
              stock: Number(option.stock) || 0
            }))}
            detail={detailJson}
          />
        </form>
      </div>
    </>
  );
}
