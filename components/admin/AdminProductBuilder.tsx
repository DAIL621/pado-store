"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { ProductDetailEditor } from "@/components/admin/ProductDetailEditor";
import { ProductDetailPreview } from "@/components/admin/ProductDetailPreview";
import { generateProductDescription, generateProductDetailDraft } from "@/lib/admin/ai-product-drafts";
import { PRODUCT_DETAIL_PRESET_OPTIONS, buildProductDetailPreset, type ProductPresetId } from "@/lib/admin/product-detail-presets";
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

type ValidationIssue = {
  label: string;
  message: string;
  section: "basic" | "options" | "detail";
};

function validateProductPayload(payload: Pick<AdminProductBuilderPayload, "form" | "options">): ValidationIssue[] {
  const { form, options } = payload;
  const issues: ValidationIssue[] = [];
  const requiredFields: Array<[keyof AdminProductFormState, string]> = [
    ["name", "상품명"],
    ["origin", "산지"],
    ["category", "카테고리"],
    ["subtitle", "한 줄 설명"],
    ["description", "기본 상세 설명"],
    ["basePrice", "기본 판매가"]
  ];

  for (const [field, label] of requiredFields) {
    if (!form[field].trim()) issues.push({ label, message: `${label}을 입력해주세요.`, section: field === "basePrice" ? "options" : "basic" });
  }

  const basePrice = Number(form.basePrice);
  if (form.basePrice.trim() && (!Number.isFinite(basePrice) || basePrice < 0)) {
    issues.push({ label: "기본 판매가", message: "기본 판매가는 0원 이상의 숫자로 입력해주세요.", section: "options" });
  }

  const validOptions = options.filter((option) => option.name.trim());
  if (!validOptions.length) {
    issues.push({ label: "상품 옵션", message: "최소 1개 이상의 옵션명을 입력해주세요.", section: "options" });
  }

  options.forEach((option, index) => {
    if (!option.name.trim()) issues.push({ label: `옵션 ${index + 1}`, message: `옵션 ${index + 1}의 옵션명을 입력해주세요.`, section: "options" });
    const priceDelta = Number(option.priceDelta);
    const stock = Number(option.stock);
    if (!Number.isFinite(priceDelta)) issues.push({ label: `옵션 ${index + 1} 추가금액`, message: `옵션 ${index + 1}의 추가금액은 숫자로 입력해주세요.`, section: "options" });
    if (!Number.isFinite(stock) || stock < 0) issues.push({ label: `옵션 ${index + 1} 재고`, message: `옵션 ${index + 1}의 재고는 0개 이상의 숫자로 입력해주세요.`, section: "options" });
  });

  return issues;
}

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
  draftStorageKey?: string;
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
  draftStorageKey,
  onSubmit,
  onSuccess
}: Props) {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState<AdminProductOptionForm[]>(initialOptions);
  const [detailJson, setDetailJson] = useState(() => createProductDetailFormValue(initialDetail));
  const [message, setMessage] = useState(initialMessage);
  const [createdUrl, setCreatedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [draftReady, setDraftReady] = useState(!draftStorageKey);
  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!draftStorageKey) return;

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<AdminProductBuilderPayload> & { savedAt?: string };
        if (draft.form) setForm((current) => ({ ...current, ...draft.form }));
        if (draft.options?.length) setOptions(draft.options);
        if (draft.detailJson) setDetailJson(createProductDetailFormValue(draft.detailJson));
        const savedAt = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
        setDraftStatus(savedAt ? `${savedAt} 자동 저장 초안을 불러왔습니다.` : "자동 저장 초안을 불러왔습니다.");
      }
    } catch {
      setDraftStatus("저장된 초안을 불러오지 못했습니다. 새 입력은 계속 가능합니다.");
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey || !draftReady || saving) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            form,
            options,
            detailJson,
            savedAt: new Date().toISOString()
          })
        );
        setDraftStatus("초안 자동 저장됨");
      } catch {
        setDraftStatus("브라우저 저장 공간 부족으로 초안 자동 저장에 실패했습니다.");
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [detailJson, draftReady, draftStorageKey, form, options, saving]);

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

  const progressItems = useMemo(() => {
    const heroCount = detailJson.heroImages.filter((image) => image.url).length;
    const benefitCount = detailJson.benefits.filter(Boolean).length;
    const faqCount = detailJson.faq.filter((item) => item.question || item.answer).length;
    const journeyCount = detailJson.journey.filter((step) => step.description || step.image).length;

    return [
      { label: "기본정보", value: form.name && form.origin && form.category && form.subtitle && form.description ? "완료" : "입력 필요", done: Boolean(form.name && form.origin && form.category && form.subtitle && form.description) },
      { label: "옵션", value: options.some((option) => option.name && option.stock) ? "완료" : "입력 필요", done: options.some((option) => option.name && option.stock) },
      { label: "대표사진", value: `${heroCount}/6`, done: heroCount > 0 },
      { label: "상품장점", value: `${benefitCount}/5`, done: benefitCount >= 3 },
      { label: "여정", value: `${journeyCount}/5`, done: journeyCount >= 3 },
      { label: "FAQ", value: `${faqCount}/5`, done: faqCount > 0 }
    ];
  }, [detailJson, form, options]);

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const heroCount = detailJson.heroImages.filter((image) => image.url).length;
    const benefitCount = detailJson.benefits.filter(Boolean).length;
    const journeyCount = detailJson.journey.filter((step) => step.description || step.image).length;
    const componentCount = detailJson.components.filter(Boolean).length;
    const faqCount = detailJson.faq.filter((item) => item.question || item.answer).length;
    const totalStock = options.reduce((total, option) => total + (Number(option.stock) || 0), 0);

    if (form.slug && !/^[a-z0-9가-힣-]+$/i.test(form.slug.trim())) warnings.push("URL 이름(slug)은 문자, 숫자, 한글, 하이픈만 권장합니다.");
    if (heroCount === 0) warnings.push("대표사진이 없으면 상세페이지 상단 이미지가 기본 이미지로 표시됩니다.");
    if (heroCount > 0 && heroCount < 3) warnings.push("대표사진은 3장 이상이면 구매 전환에 더 유리합니다.");
    if (benefitCount < 3) warnings.push("상품 장점은 최소 3개 이상 입력하는 것을 권장합니다.");
    if (journeyCount < 3) warnings.push("산지 여정이 부족하면 상세페이지 신뢰 정보가 약해집니다.");
    if (componentCount === 0) warnings.push("구성품을 입력하면 고객 문의를 줄일 수 있습니다.");
    if (faqCount === 0) warnings.push("FAQ가 없으면 출고/보관 문의가 늘어날 수 있습니다.");
    if (totalStock === 0) warnings.push("옵션 재고가 0개이면 고객 화면에서 품절 상태로 보일 수 있습니다.");

    return warnings;
  }, [detailJson, form.slug, options]);

  const blockingIssues = useMemo<ValidationIssue[]>(() => validateProductPayload({ form, options }), [form, options]);

  const inputRef = (node: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (node && !node.value && node.required && !firstInvalidRef.current) firstInvalidRef.current = node;
  };

  const fieldClass = (value: string) => (value.trim() ? "" : "is-empty");

  const focusNextField = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    if (target.type === "file" || target.type === "button" || target.type === "submit") return;

    const fields = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])"
      )
    ).filter((field) => field.offsetParent !== null);
    const index = fields.indexOf(target);
    const next = fields[index + 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    if (next instanceof HTMLInputElement) next.select();
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

  const applyPreset = (presetId: ProductPresetId) => {
    const preset = buildProductDetailPreset(presetId, {
      name: form.name || "신규 상품",
      origin: form.origin || "산지"
    });

    setForm((current) => ({
      ...current,
      category: current.category || preset.form.category,
      badge: current.badge || preset.form.badge,
      subtitle: current.subtitle || preset.form.subtitle,
      description: current.description || preset.form.description,
      highlights: preset.form.highlights
    }));
    setOptions((current) => {
      const hasCustomOption = current.some((option) => option.name.trim() && option.name !== "기본 옵션");
      return hasCustomOption ? current : preset.options;
    });
    setDetailJson((current) => ({
      ...current,
      benefits: preset.detail.benefits,
      journey: preset.detail.journey,
      packaging: preset.detail.packaging,
      recipes: preset.detail.recipes,
      components: current.components.some(Boolean) ? current.components : preset.detail.components,
      faq: preset.detail.faq
    }));
    setMessage(`${preset.label} 프리셋을 적용했습니다. 상품명, 산지, 사진은 유지됩니다.`);
    setToastMessage(`${preset.label} 프리셋 적용 완료`);
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  const saveProduct = async (formElement: HTMLFormElement) => {
    if (saving) return;
    firstInvalidRef.current = null;
    const formData = new FormData(formElement);
    const submittedForm: AdminProductFormState = {
      name: String(formData.get("name") ?? form.name).trim(),
      slug: String(formData.get("slug") ?? form.slug).trim(),
      origin: String(formData.get("origin") ?? form.origin).trim(),
      category: String(formData.get("category") ?? form.category).trim(),
      subtitle: String(formData.get("subtitle") ?? form.subtitle).trim(),
      description: String(formData.get("description") ?? form.description).trim(),
      basePrice: String(formData.get("basePrice") ?? form.basePrice).trim(),
      imageUrl: String(formData.get("imageUrl") ?? form.imageUrl).trim(),
      badge: String(formData.get("badge") ?? form.badge).trim(),
      highlights: String(formData.get("highlights") ?? form.highlights).trim()
    };
    const submittedOptions = options.map((option, index) => ({
      name: String(formData.get(`options.${index}.name`) ?? option.name).trim(),
      priceDelta: String(formData.get(`options.${index}.priceDelta`) ?? option.priceDelta).trim(),
      stock: String(formData.get(`options.${index}.stock`) ?? option.stock).trim()
    }));
    const submitBlockingIssues = validateProductPayload({ form: submittedForm, options: submittedOptions });

    if (submitBlockingIssues.length > 0) {
      const firstIssue = submitBlockingIssues[0];
      setMessage(`등록 차단: ${firstIssue.message}`);
      setToastMessage("필수 입력 항목이 부족합니다.");
      window.setTimeout(() => setToastMessage(""), 2600);
      const section = formElement.querySelector<HTMLElement>(`[data-admin-section="${firstIssue.section}"]`);
      section?.setAttribute("open", "");
      section?.scrollIntoView({ behavior: "smooth", block: "center" });
      const invalidField = section?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input.is-empty, textarea.is-empty, input:invalid, textarea:invalid, select:invalid");
      invalidField?.focus();
      return;
    }
    setSaving(true);
    setCreatedUrl("");
    setMessage("저장하는 중입니다...");

    let result: SubmitResult;
    try {
      result = await onSubmit({ form: submittedForm, options: submittedOptions, detailJson });
    } catch (error) {
      result = {
        ok: false,
        message: error instanceof Error ? error.message : "네트워크 또는 브라우저 오류로 저장에 실패했습니다."
      };
    }

    if (!result.ok) {
      setMessage(`저장 실패: ${result.message ?? "저장에 실패했습니다."}`);
      setToastMessage("저장 실패");
      window.setTimeout(() => setToastMessage(""), 2600);
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
    if (draftStorageKey) window.localStorage.removeItem(draftStorageKey);
    setCreatedUrl(result.productUrl ?? "");
    setMessage(result.message ?? successMessage);
    setToastMessage(result.message ?? successMessage);
    window.setTimeout(() => setToastMessage(""), 2800);
    setSaving(false);
    await onSuccess?.(result);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProduct(event.currentTarget);
  };

  const clickSave = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget.form;
    if (!formElement) {
      setMessage("저장 실패: 상품 등록 폼을 찾지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
      return;
    }
    await saveProduct(formElement);
  };

  return (
    <>
    <div className="admin-product-progress">
        <div>
          <span>상품등록 진행률</span>
          <strong>{progress}%</strong>
        </div>
        <div className="admin-progress-checks" aria-label="상품등록 세부 진행률">
          {progressItems.map((item) => (
            <span key={item.label} className={item.done ? "done" : ""}>
              <b>{item.label}</b>
              {item.done ? "✓" : item.value}
            </span>
          ))}
        </div>
        <progress value={progress} max={100} aria-label="상품등록 진행률" />
      </div>

      <div className="admin-panel">
        <div>
          <h2>{title}</h2>
          <span className="admin-message">{message}</span>
          {draftStatus && <small className="admin-draft-status">{draftStatus}</small>}
          {createdUrl && <a className="admin-message-link" href={createdUrl} target="_blank">방금 저장한 상품 보기 →</a>}
        </div>
        <div className="admin-builder-actions">
          <button type="button" className="button outline" onClick={fillDraft}>초안 자동 채우기</button>
        </div>

        {toastMessage && <div className="admin-toast" role="status">{toastMessage}</div>}

        <form className="admin-product-builder" onSubmit={submit} onKeyDown={focusNextField} noValidate>
          <div className="admin-product-builder-main">
            <details className="admin-form-section" data-admin-section="basic" open>
              <summary>① 기본정보</summary>
              <div className="admin-preset-box">
                <div>
                  <strong>상품 유형 프리셋</strong>
                  <span>자주 쓰는 상세 구성과 FAQ를 한 번에 채웁니다.</span>
                </div>
                <div className="admin-preset-grid">
                  {PRODUCT_DETAIL_PRESET_OPTIONS.map((preset) => (
                    <button type="button" key={preset.id} onClick={() => applyPreset(preset.id)}>
                      <b>{preset.label}</b>
                      <small>{preset.description}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-form section-grid">
                <label>
                  상품명 <em>필수</em>
                  <input name="name" ref={inputRef} className={fieldClass(form.name)} value={form.name} onChange={(event) => update("name", event.target.value)} required placeholder="예: 완도 활전복" />
                </label>
                <label>
                  URL 이름(slug)
                  <input name="slug" value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="예: wando-live-abalone" />
                </label>
                <label>
                  산지 <em>필수</em>
                  <input name="origin" ref={inputRef} className={fieldClass(form.origin)} value={form.origin} onChange={(event) => update("origin", event.target.value)} required placeholder="예: 완도" />
                </label>
                <label>
                  카테고리 <em>필수</em>
                  <input name="category" ref={inputRef} className={fieldClass(form.category)} value={form.category} onChange={(event) => update("category", event.target.value)} required placeholder="예: 전복·조개" />
                </label>
                <label>
                  대표 배지
                  <input name="badge" value={form.badge} onChange={(event) => update("badge", event.target.value)} placeholder="BEST, 제철, 추천" />
                </label>
                <label>
                  대표 이미지 경로
                  <input name="imageUrl" value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="/images/products/sample.webp" />
                </label>
                <label className="wide">
                  한 줄 설명 <em>필수</em>
                  <input name="subtitle" ref={inputRef} className={fieldClass(form.subtitle)} value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} required placeholder="상품 카드와 상세 상단에 보이는 짧은 문구" />
                </label>
                <label className="wide">
                  기본 상세 설명 <em>필수</em>
                  <textarea name="description" ref={inputRef} className={fieldClass(form.description)} value={form.description} onChange={(event) => update("description", event.target.value)} required rows={4} />
                </label>
                <label className="wide">
                  카드 핵심 문구
                  <input name="highlights" value={form.highlights} onChange={(event) => update("highlights", event.target.value)} placeholder="쉼표로 구분" />
                </label>
              </div>
            </details>

            <details className="admin-form-section" data-admin-section="options" open>
              <summary>② 가격 / 옵션</summary>
              <div className="admin-form section-grid">
                <label>
                  기본 판매가 <em>필수</em>
                  <input name="basePrice" ref={inputRef} className={fieldClass(form.basePrice)} type="number" value={form.basePrice} onChange={(event) => update("basePrice", event.target.value)} required placeholder="39900" />
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
                    <label>옵션명<input name={`options.${index}.name`} className={fieldClass(option.name)} value={option.name} onChange={(event) => updateOption(index, "name", event.target.value)} required placeholder="예: 1kg" /></label>
                    <label>추가금액<input name={`options.${index}.priceDelta`} className={fieldClass(option.priceDelta)} type="number" value={option.priceDelta} onChange={(event) => updateOption(index, "priceDelta", event.target.value)} required /></label>
                    <label>재고<input name={`options.${index}.stock`} className={fieldClass(option.stock)} type="number" value={option.stock} onChange={(event) => updateOption(index, "stock", event.target.value)} required min="0" /></label>
                    <button type="button" className="remove-option" onClick={() => removeOption(index)} disabled={options.length === 1}>삭제</button>
                  </div>
                ))}
              </div>
            </details>

            <div data-admin-section="detail">
              <ProductDetailEditor value={detailJson} onChange={setDetailJson} />
            </div>

            <details className="admin-form-section" open>
              <summary>⑩ 저장</summary>
              <div className={`admin-validation-panel ${blockingIssues.length ? "blocking" : ""}`} role="status">
                <strong>{blockingIssues.length ? "등록 차단" : validationWarnings.length ? "저장 전 경고" : "운영 등록 준비 완료"}</strong>
                {blockingIssues.length ? (
                  <>
                    <p>아래 항목은 저장 전에 반드시 입력해야 합니다.</p>
                    <ul>
                      {blockingIssues.map((issue) => (
                        <li key={`${issue.section}-${issue.label}`}>{issue.message}</li>
                      ))}
                    </ul>
                  </>
                ) : validationWarnings.length ? (
                  <ul>
                    {validationWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p>필수 정보와 상세페이지 핵심 항목이 균형 있게 입력되었습니다.</p>
                )}
              </div>
              <div className="admin-save-panel">
                <p>필수 정보와 상세페이지 자동 생성 정보를 확인한 뒤 저장합니다.</p>
                <button type="submit" className="button teal" disabled={saving} onClick={clickSave}>{saving ? savingLabel : submitLabel}</button>
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
