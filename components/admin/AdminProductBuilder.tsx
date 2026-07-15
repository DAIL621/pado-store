"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { ProductDetailEditor } from "@/components/admin/ProductDetailEditor";
import { ProductDetailPreview } from "@/components/admin/ProductDetailPreview";
import { AI_IMAGE_ANALYSIS_DRAFT_KEY, type AiImageAnalysisDraft } from "@/lib/admin/ai-image-analysis";
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

export type AdminProductPublishMode = "public" | "private" | "reserved";

export type AdminProductBuilderPayload = {
  form: AdminProductFormState;
  options: AdminProductOptionForm[];
  detailJson: ProductDetail;
  publishMode: AdminProductPublishMode;
  reservedAt?: string;
};

type SubmitResult = {
  ok: boolean;
  code?: string;
  message?: string;
  productId?: string;
  productSlug?: string;
  productUrl?: string;
  slug?: string;
};

type ValidationIssue = {
  label: string;
  message: string;
  section: "basic" | "options" | "detail";
};

type SubmitDebugState = {
  mountedAt: string;
  lastPointerDownAt?: string;
  lastClickAt?: string;
  clickCount: number;
  formFound?: boolean;
  buttonDisabled?: boolean;
  topElementAtButton?: string;
  submitStartedAt?: string;
  validationStatus?: string;
  apiStatus?: string;
  apiStartedAt?: string;
  apiFinishedAt?: string;
  apiMessage?: string;
  navigationScheduledAt?: string;
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
  mode: "create" | "edit";
  productId?: string;
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
  imageUrl: "",
  badge: "",
  highlights: ""
};

export const defaultProductOptions: AdminProductOptionForm[] = [{ name: "", priceDelta: "0", stock: "0" }];

function debugTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

function describeElement(element: Element | null) {
  if (!element) return "none";
  const htmlElement = element as HTMLElement;
  const id = htmlElement.id ? `#${htmlElement.id}` : "";
  const classes = typeof htmlElement.className === "string" && htmlElement.className ? `.${htmlElement.className.trim().replace(/\s+/g, ".")}` : "";
  const testId = htmlElement.dataset?.testid ? `[data-testid="${htmlElement.dataset.testid}"]` : "";
  return `${element.tagName.toLowerCase()}${id}${classes}${testId}`;
}

function createTestSlug(baseSlug: string) {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  const time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0")].join("");
  const normalizedBase = baseSlug.trim().replace(/-test-\d{8}-\d{4}.*$/, "") || "test-product";
  return `${normalizedBase}-test-${date}-${time}`;
}

function firstText(values: Array<string | undefined>) {
  return values.find((value) => value && value.trim())?.trim() ?? "";
}

function hasReviewPlaceholder(detail: ProductDetail) {
  return detail.extraSections.some((section) => section.type === "review-placeholder");
}

function withReviewPlaceholder(detail: ProductDetail): ProductDetail {
  if (hasReviewPlaceholder(detail)) return detail;
  return {
    ...detail,
    extraSections: [
      ...detail.extraSections,
      {
        type: "review-placeholder",
        title: "리뷰 준비중",
        items: [
          {
            title: "사진 리뷰 영역",
            description: "상품 판매 후 구매 인증 리뷰와 사진 후기를 연결할 수 있도록 준비된 영역입니다."
          }
        ]
      }
    ]
  };
}

export function AdminProductBuilder({
  mode,
  productId,
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
  const [createdInfo, setCreatedInfo] = useState("");
  const [duplicateSlug, setDuplicateSlug] = useState("");
  const [saveCompleted, setSaveCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [draftAutosaveEnabled, setDraftAutosaveEnabled] = useState(mode === "edit");
  const [loadedDraftSlug, setLoadedDraftSlug] = useState("");
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [draftReady, setDraftReady] = useState(!draftStorageKey);
  const [aiDraftLoaded, setAiDraftLoaded] = useState(false);
  const [publishMode, setPublishMode] = useState<AdminProductPublishMode>("public");
  const [reservedAt, setReservedAt] = useState("");
  const [submitDebug, setSubmitDebug] = useState<SubmitDebugState>({ mountedAt: "-", clickCount: 0 });
  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const showSubmitDebug = process.env.NEXT_PUBLIC_ADMIN_SUBMIT_DEBUG === "true";

  const updateSubmitDebug = (patch: Partial<SubmitDebugState>) => {
    if (!showSubmitDebug) return;
    setSubmitDebug((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    updateSubmitDebug({ mountedAt: debugTime(), apiStatus: "hydrated" });

    try {
      if (!draftStorageKey) return;
      const raw = window.localStorage.getItem(draftStorageKey);
      const aiRaw = mode === "create" ? window.localStorage.getItem(AI_IMAGE_ANALYSIS_DRAFT_KEY) : null;
      if (mode === "create") {
        setHasStoredDraft(Boolean(raw || aiRaw));
        setDraftStatus(raw || aiRaw ? "저장된 초안이 있습니다." : "새 상품은 빈 상태로 시작합니다.");
      } else if (raw) {
        const draft = JSON.parse(raw) as Partial<AdminProductBuilderPayload> & { savedAt?: string };
        if (draft.form) setForm((current) => ({ ...current, ...draft.form }));
        if (draft.options?.length) setOptions(draft.options);
        if (draft.detailJson) setDetailJson(createProductDetailFormValue(draft.detailJson));
        if (draft.publishMode === "public" || draft.publishMode === "private" || draft.publishMode === "reserved") {
          setPublishMode(draft.publishMode);
        }
        if (typeof draft.reservedAt === "string") setReservedAt(draft.reservedAt);
        const savedAt = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
        setDraftStatus(savedAt ? `${savedAt} 자동 저장 초안을 불러왔습니다.` : "자동 저장 초안을 불러왔습니다.");
      }
    } catch {
      setDraftStatus("저장된 초안을 불러오지 못했습니다. 새 입력은 계속 가능합니다.");
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey, mode]);

  useEffect(() => {
    if (!draftStorageKey || !draftReady || !draftAutosaveEnabled || saving) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            form,
            options,
            detailJson,
            publishMode,
            reservedAt,
            savedAt: new Date().toISOString()
          })
        );
        setDraftStatus("초안 자동 저장됨");
      } catch {
        setDraftStatus("브라우저 저장 공간 부족으로 초안 자동 저장에 실패했습니다.");
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [detailJson, draftAutosaveEnabled, draftReady, draftStorageKey, form, options, publishMode, reservedAt, saving]);

  const enableDraftAutosave = () => setDraftAutosaveEnabled(true);

  const resetBuilderState = () => {
    setForm(initialForm);
    setOptions(initialOptions);
    setDetailJson(createProductDetailFormValue(initialDetail));
    setPublishMode("public");
    setReservedAt("");
    setAiDraftLoaded(false);
    setLoadedDraftSlug("");
    setCreatedUrl("");
    setCreatedInfo("");
    setDuplicateSlug("");
    setSaveCompleted(false);
    setEditorResetKey((current) => current + 1);
  };

  const loadStoredDraft = () => {
    if (mode !== "create" || !draftStorageKey) return;
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<AdminProductBuilderPayload> & { savedAt?: string; productId?: string };
        if (draft.productId) {
          setMessage("초안에 기존 상품 ID가 포함되어 있어 불러오기를 차단했습니다.");
          return;
        }
        if (draft.form) {
          setForm({ ...initialForm, ...draft.form });
          setLoadedDraftSlug(draft.form.slug?.trim() ?? "");
        }
        if (draft.options?.length) setOptions(draft.options);
        if (draft.detailJson) setDetailJson(createProductDetailFormValue(draft.detailJson));
        if (draft.publishMode === "public" || draft.publishMode === "private" || draft.publishMode === "reserved") setPublishMode(draft.publishMode);
        setReservedAt(typeof draft.reservedAt === "string" ? draft.reservedAt : "");
        setAiDraftLoaded(false);
        setDraftAutosaveEnabled(true);
        setDraftStatus("저장된 초안을 불러왔습니다.");
        setMessage("저장된 초안을 불러왔습니다. 운영 상품으로 등록하기 전에 상품명과 URL을 확인하세요.");
        return;
      }

      const aiRaw = window.localStorage.getItem(AI_IMAGE_ANALYSIS_DRAFT_KEY);
      if (!aiRaw) return;
      const aiDraft = JSON.parse(aiRaw) as AiImageAnalysisDraft;
      const nextDetail = withReviewPlaceholder(createProductDetailFormValue(aiDraft.detailJson));
      const heroImage = aiDraft.detailJson.heroImages?.[0];
      const firstBenefit = aiDraft.detailJson.benefits?.find(Boolean);
      const firstFaq = aiDraft.detailJson.faq?.find((item) => item.question || item.answer);
      const generatedTitle = firstText([heroImage?.label, aiDraft.results?.[0]?.title]);
      setDetailJson(nextDetail);
      setForm({
        ...initialForm,
        name: generatedTitle,
        category: aiDraft.category || "",
        subtitle: generatedTitle || firstBenefit || "",
        description: firstText([heroImage?.description, aiDraft.results?.[0]?.description, firstFaq?.answer, firstBenefit]),
        badge: "AI 초안",
        highlights: (aiDraft.detailJson.benefits ?? []).filter(Boolean).slice(0, 3).join(", "),
        imageUrl: heroImage?.url || ""
      });
      setAiDraftLoaded(true);
      setDraftAutosaveEnabled(true);
      setDraftStatus("AI 사진분석 초안을 불러왔습니다.");
      setMessage("AI 사진분석 초안을 불러왔습니다. 운영 상품으로 등록하기 전에 내용을 확인하세요.");
    } catch {
      setDraftStatus("저장된 초안을 불러오지 못했습니다.");
    }
  };

  const deleteStoredDraft = () => {
    if (draftStorageKey) window.localStorage.removeItem(draftStorageKey);
    if (mode === "create") window.localStorage.removeItem(AI_IMAGE_ANALYSIS_DRAFT_KEY);
    setHasStoredDraft(false);
    setDraftStatus("저장된 초안을 삭제했습니다.");
  };

  const startNewProduct = () => {
    if (!window.confirm("현재 입력 중인 내용을 모두 지우고 새 상품으로 시작하시겠습니까?")) return;
    deleteStoredDraft();
    setDraftAutosaveEnabled(false);
    resetBuilderState();
    setMessage("새 상품 등록을 위해 모든 입력과 업로드 대기 상태를 초기화했습니다.");
    setDraftStatus("새 상품은 빈 상태로 시작합니다.");
  };

  const update = (key: keyof AdminProductFormState, value: string) => {
    enableDraftAutosave();
    setForm((current) => ({ ...current, [key]: value }));
    setSaveCompleted(false);
    setCreatedInfo("");
    setDuplicateSlug("");
  };

  const updateOption = (index: number, key: keyof AdminProductOptionForm, value: string) => {
    enableDraftAutosave();
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, [key]: value } : option)));
    setSaveCompleted(false);
    setCreatedInfo("");
  };

  const updateDetailJson = (nextDetail: ProductDetail) => {
    enableDraftAutosave();
    setDetailJson(nextDetail);
    setSaveCompleted(false);
    setCreatedInfo("");
  };

  const addOption = () => {
    enableDraftAutosave();
    setOptions((current) => [...current, { name: "", priceDelta: "0", stock: "0" }]);
  };

  const removeOption = (index: number) => {
    enableDraftAutosave();
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
    const basePrice = Number(form.basePrice);

    if (form.slug && !/^[a-z0-9가-힣-]+$/i.test(form.slug.trim())) warnings.push("URL 이름(slug)은 문자, 숫자, 한글, 하이픈만 권장합니다.");
    if (mode === "create" && loadedDraftSlug && form.slug.trim() === loadedDraftSlug) warnings.push("불러온 초안과 URL(slug)이 같습니다. 이전 테스트 상품을 덮어 등록하지 않는지 확인하세요.");
    if (mode === "create" && /(테스트|test|0710)/i.test(`${form.name} ${form.slug}`)) warnings.push("테스트 상품 초안으로 보입니다. 운영 공개 전에 상품명, URL, 공개 상태를 다시 확인하세요.");
    if (form.subtitle && form.subtitle.trim().length < 18) warnings.push("한 줄 설명은 18자 이상이면 검색/공유 화면에서 상품 매력이 더 잘 전달됩니다.");
    if (!form.badge.trim()) warnings.push("대표 배지를 입력하면 상품 목록에서 시선이 더 잘 갑니다. 예: BEST, 제철, 추천");
    if (!Number.isFinite(basePrice) || basePrice <= 0) warnings.push("기본 판매가는 0원보다 큰 금액을 권장합니다.");
    if (heroCount === 0) warnings.push("대표사진이 없으면 상세페이지 상단 이미지가 기본 이미지로 표시됩니다.");
    if (heroCount > 0 && heroCount < 3) warnings.push("대표사진은 3장 이상이면 구매 전환에 더 유리합니다.");
    if (benefitCount < 3) warnings.push("상품 장점은 최소 3개 이상 입력하는 것을 권장합니다.");
    if (journeyCount < 3) warnings.push("산지 여정이 부족하면 상세페이지 신뢰 정보가 약해집니다.");
    if (componentCount === 0) warnings.push("구성품을 입력하면 고객 문의를 줄일 수 있습니다.");
    if (faqCount === 0) warnings.push("FAQ가 없으면 출고/보관 문의가 늘어날 수 있습니다.");
    if (totalStock === 0) warnings.push("옵션 재고가 0개이면 고객 화면에서 품절 상태로 보일 수 있습니다.");

    return warnings;
  }, [detailJson, form.badge, form.basePrice, form.name, form.slug, form.subtitle, loadedDraftSlug, mode, options]);

  const qualityItems = useMemo(() => {
    const heroCount = detailJson.heroImages.filter((image) => image.url).length;
    const benefitCount = detailJson.benefits.filter(Boolean).length;
    const journeyCount = detailJson.journey.filter((step) => step.description || step.image).length;
    const packagingCount = detailJson.packaging.filter(Boolean).length;
    const recipeCount = detailJson.recipes.filter((recipe) => recipe.title || recipe.description || recipe.image).length;
    const componentCount = detailJson.components.filter(Boolean).length;
    const faqCount = detailJson.faq.filter((item) => item.question || item.answer).length;
    const totalStock = options.reduce((total, option) => total + (Number(option.stock) || 0), 0);
    const hasSellableOption = options.some((option) => option.name.trim() && Number(option.stock) > 0);
    const basePrice = Number(form.basePrice);

    return [
      { label: "대표사진", value: `${heroCount}/6`, done: heroCount >= 3, weight: 18, hint: "사진 3장 이상이면 상품 신뢰도가 좋아집니다." },
      { label: "상품 장점", value: `${benefitCount}/5`, done: benefitCount >= 3, weight: 15, hint: "핵심 장점은 최소 3개를 권장합니다." },
      { label: "산지 여정", value: `${journeyCount}/5`, done: journeyCount >= 3, weight: 15, hint: "산지/선별/포장 흐름을 채우면 상세페이지가 더 믿음직합니다." },
      { label: "포장/배송", value: `${packagingCount}`, done: packagingCount >= 3, weight: 12, hint: "배송 안내는 고객 문의를 줄여줍니다." },
      { label: "먹는 방법", value: `${recipeCount}`, done: recipeCount >= 1, weight: 10, hint: "조리/섭취 방법 1개 이상을 권장합니다." },
      { label: "구성품", value: `${componentCount}`, done: componentCount >= 1, weight: 10, hint: "고객이 받는 구성품을 명확히 적어주세요." },
      { label: "FAQ", value: `${faqCount}`, done: faqCount >= 1, weight: 10, hint: "출고/보관/교환 질문을 미리 줄일 수 있습니다." },
      { label: "기본 정보", value: form.name && form.origin && form.subtitle && form.description ? "완료" : "부족", done: Boolean(form.name && form.origin && form.subtitle && form.description), weight: 10, hint: "상품명, 산지, 설명은 필수입니다." },
      { label: "가격/재고", value: totalStock > 0 ? `${totalStock}개` : "품절", done: Number.isFinite(basePrice) && basePrice > 0 && hasSellableOption, weight: 10, hint: "판매가와 구매 가능한 옵션 재고가 있어야 바로 판매할 수 있습니다." },
      { label: "SEO", value: form.slug && form.subtitle.length >= 18 ? "준비" : "보강", done: Boolean(form.name && form.origin && form.slug && form.subtitle.length >= 18), weight: 8, hint: "상품명, 산지, URL, 한 줄 설명이 검색/공유 정보로 자동 사용됩니다." }
    ];
  }, [detailJson, form.basePrice, form.description, form.name, form.origin, form.slug, form.subtitle, options]);

  const qualityScore = useMemo(() => {
    const totalWeight = qualityItems.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = qualityItems.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
    return Math.round((earnedWeight / totalWeight) * 100);
  }, [qualityItems]);

  const launchReadiness = useMemo(() => {
    const heroCount = detailJson.heroImages.filter((image) => image.url).length;
    const benefitCount = detailJson.benefits.filter(Boolean).length;
    const packagingCount = detailJson.packaging.filter(Boolean).length;
    const faqCount = detailJson.faq.filter((item) => item.question || item.answer).length;
    const seoReady = Boolean(form.name && form.slug && form.subtitle);
    const detailReady = benefitCount >= 3 && packagingCount >= 3 && faqCount >= 1;
    const checks = [
      Boolean(form.name && form.origin && form.category && form.subtitle && form.description && form.basePrice),
      heroCount > 0,
      aiDraftLoaded || heroCount > 0,
      detailReady,
      seoReady,
      publishMode === "public" ? qualityScore >= 80 : true
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [aiDraftLoaded, detailJson, form, publishMode, qualityScore]);

  const aiAutoFields = useMemo(() => {
    const checks = [
      { label: "제목", done: Boolean(aiDraftLoaded && form.name) },
      { label: "설명", done: Boolean(aiDraftLoaded && form.description) },
      { label: "대표사진", done: Boolean(detailJson.heroImages.some((image) => image.url)) },
      { label: "Gallery", done: Boolean(detailJson.heroImages.filter((image) => image.url).length >= 2) },
      { label: "FAQ", done: Boolean(detailJson.faq.some((item) => item.question || item.answer)) },
      { label: "Benefits", done: Boolean(detailJson.benefits.some(Boolean)) },
      { label: "Packaging", done: Boolean(detailJson.packaging.some(Boolean)) },
      { label: "Review", done: Boolean(hasReviewPlaceholder(detailJson)) },
      { label: "SEO", done: Boolean(form.name && form.slug && form.subtitle) }
    ];
    const doneCount = checks.filter((item) => item.done).length;
    return {
      checks,
      rate: Math.round((doneCount / checks.length) * 100)
    };
  }, [aiDraftLoaded, detailJson, form.description, form.name, form.slug, form.subtitle]);

  const wizardSteps = useMemo(() => {
    const heroCount = detailJson.heroImages.filter((image) => image.url).length;
    return [
      { label: "① 기본정보", done: Boolean(form.name && form.origin && form.category && form.basePrice), value: form.name ? "완료" : "입력" },
      { label: "② 사진 업로드", done: heroCount > 0, value: `${heroCount}/6` },
      { label: "③ AI 자동분석", done: aiDraftLoaded, value: aiDraftLoaded ? "완료" : "선택" },
      { label: "④ AI 상세 생성", done: aiAutoFields.rate >= 60, value: `${aiAutoFields.rate}%` },
      { label: "⑤ 운영자 수정", done: qualityScore >= 80, value: `${qualityScore}%` },
      { label: "⑥ 저장", done: saveCompleted, value: saveCompleted ? "완료" : "대기" },
      { label: "⑦ 상품 공개", done: publishMode === "public" && saveCompleted, value: publishMode === "public" ? "공개" : publishMode === "private" ? "비공개" : "예약" }
    ];
  }, [aiAutoFields.rate, aiDraftLoaded, detailJson.heroImages, form, publishMode, qualityScore, saveCompleted]);

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

  const clearAiDraft = () => {
    window.localStorage.removeItem(AI_IMAGE_ANALYSIS_DRAFT_KEY);
    setAiDraftLoaded(false);
    setDraftStatus("AI 사진분석 draft를 초기화했습니다.");
    setToastMessage("AI draft 초기화 완료");
    window.setTimeout(() => setToastMessage(""), 2200);
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
    if (saving) {
      updateSubmitDebug({ apiStatus: "ignored: saving", apiMessage: "saveProduct ignored because saving=true" });
      return;
    }
    updateSubmitDebug({ submitStartedAt: debugTime(), validationStatus: "running", apiStatus: "not-started", apiMessage: "" });
    if (mode === "create" && productId) {
      setMessage("등록 차단: 신규 상품 화면에 기존 상품 ID가 연결되어 있습니다. 새 상품으로 초기화하세요.");
      setToastMessage("기존 상품 ID 감지로 등록을 차단했습니다.");
      return;
    }
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
      updateSubmitDebug({ validationStatus: `blocked: ${firstIssue.section}`, apiStatus: "not-started", apiMessage: firstIssue.message });
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
    setCreatedInfo("");
    setSaveCompleted(false);
    setDuplicateSlug("");
    setMessage("저장하는 중입니다...");
    setToastMessage(savingLabel);
    updateSubmitDebug({ validationStatus: "passed", apiStatus: "requesting", apiStartedAt: debugTime() });

    let result: SubmitResult;
    try {
      result = await onSubmit({ form: submittedForm, options: submittedOptions, detailJson, publishMode, reservedAt });
      updateSubmitDebug({
        apiStatus: result.ok ? "success" : "failed",
        apiFinishedAt: debugTime(),
        apiMessage: result.message ?? (result.ok ? "ok" : "failed")
      });
    } catch (error) {
      result = {
        ok: false,
        message: error instanceof Error ? error.message : "네트워크 또는 브라우저 오류로 저장에 실패했습니다."
      };
      updateSubmitDebug({ apiStatus: "exception", apiFinishedAt: debugTime(), apiMessage: result.message });
    }

    if (!result.ok) {
      if (result.code === "DUPLICATE_SLUG") {
        setDuplicateSlug(result.slug || submittedForm.slug);
      }
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
    setDuplicateSlug("");
    setCreatedUrl(result.productUrl ?? "");
    setCreatedInfo(
      [result.productId ? `ID: ${result.productId}` : "", result.productSlug ? `Slug: ${result.productSlug}` : ""]
        .filter(Boolean)
        .join(" · ")
    );
    setMessage(result.message ?? successMessage);
    setToastMessage(result.message ?? successMessage);
    setSaveCompleted(true);
    window.setTimeout(() => setToastMessage(""), 2800);
    setSaving(false);
    updateSubmitDebug({ navigationScheduledAt: debugTime(), apiMessage: result.message ?? successMessage });
    await onSuccess?.(result);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSubmitDebug({ submitStartedAt: debugTime(), apiMessage: "form submit event fired" });
    await saveProduct(event.currentTarget);
  };

  const recordPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    updateSubmitDebug({
      lastPointerDownAt: debugTime(),
      buttonDisabled: event.currentTarget.disabled,
      topElementAtButton: describeElement(topElement)
    });
  };

  const clickSave = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget.form;
    const rect = event.currentTarget.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    updateSubmitDebug({
      lastClickAt: debugTime(),
      clickCount: submitDebug.clickCount + 1,
      formFound: Boolean(formElement),
      buttonDisabled: event.currentTarget.disabled,
      topElementAtButton: describeElement(topElement),
      apiMessage: "button click handler fired"
    });
    console.info("[PADO_ADMIN_SUBMIT_DEBUG]", {
      at: debugTime(),
      formFound: Boolean(formElement),
      disabled: event.currentTarget.disabled,
      topElementAtButton: describeElement(topElement)
    });
    if (!formElement) {
      setMessage("저장 실패: 상품 등록 폼을 찾지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
      return;
    }
    await saveProduct(formElement);
  };

  const applyTestSlug = () => {
    const nextSlug = createTestSlug(duplicateSlug || form.slug || form.name);
    setForm((current) => ({ ...current, slug: nextSlug }));
    setDuplicateSlug("");
    setSaveCompleted(false);
    setCreatedInfo("");
    setCreatedUrl("");
    setMessage(`테스트용 URL을 생성했습니다: ${nextSlug}`);
    setToastMessage("테스트용 URL 생성 완료");
    updateSubmitDebug({ apiStatus: "ready-after-test-slug", apiMessage: nextSlug });
    window.setTimeout(() => setToastMessage(""), 2200);
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

      <section className="admin-launch-wizard" aria-label="상품등록 런칭 Wizard">
        <div className="admin-launch-wizard-head">
          <div>
            <span>LAUNCH WIZARD</span>
            <strong>5분 상품등록 흐름</strong>
          </div>
          <div>
            <b>{launchReadiness}%</b>
            <small>출시 가능도</small>
          </div>
        </div>
        <div className="admin-launch-steps">
          {wizardSteps.map((step) => (
            <span key={step.label} className={step.done ? "done" : ""}>
              <b>{step.label}</b>
              <em>{step.value}</em>
            </span>
          ))}
        </div>
        <div className="admin-ai-autofill-rate" role="status">
          <strong>AI 자동 입력률 {aiAutoFields.rate}%</strong>
          <div>
            {aiAutoFields.checks.map((item) => (
              <span key={item.label} className={item.done ? "done" : ""}>{item.label}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-panel">
        <div>
          <h2>{title}</h2>
          <span className="admin-message">{message}</span>
          {draftStatus && <small className="admin-draft-status">{draftStatus}</small>}
          {aiDraftLoaded && (
            <div className="admin-ai-draft-notice" role="status" data-testid="admin-ai-draft-notice">
              <strong>AI 사진분석 결과를 불러왔습니다.</strong>
              <span>대표사진, 포장/배송, 조리법, 구성품, 추가 섹션 초안이 detail_json에 반영되었습니다.</span>
              <button type="button" data-testid="admin-ai-draft-clear" onClick={clearAiDraft}>AI draft 초기화</button>
            </div>
          )}
          {duplicateSlug && (
            <div className="admin-duplicate-slug-action" role="status">
              <span>같은 URL이 이미 있습니다. 상세페이지 디자인 확인용 테스트 URL로 바꿔 저장할 수 있습니다.</span>
              <button
                type="button"
                className="button outline"
                data-testid="admin-apply-test-slug"
                onClick={applyTestSlug}
              >
                테스트용 URL 자동 생성
              </button>
            </div>
          )}
          {createdInfo && <small className="admin-created-info">{createdInfo}</small>}
          {createdUrl && (
            <a className="admin-detail-link button outline" data-testid="admin-created-detail-link" href={createdUrl} target="_blank">
              생성된 상세페이지 보기 →
            </a>
          )}
        </div>
        <div className="admin-builder-actions">
          {mode === "create" && (
            <>
              <button type="button" className="button outline" data-testid="admin-new-reset" onClick={startNewProduct}>새 상품으로 초기화</button>
              <button type="button" className="button outline" data-testid="admin-draft-load" onClick={loadStoredDraft} disabled={!hasStoredDraft}>초안 불러오기</button>
              <button type="button" className="button outline" data-testid="admin-draft-delete" onClick={deleteStoredDraft} disabled={!hasStoredDraft}>초안 삭제</button>
            </>
          )}
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
              <ProductDetailEditor key={editorResetKey} value={detailJson} onChange={updateDetailJson} />
            </div>

            <details className="admin-form-section" open>
              <summary>⑩ 저장</summary>
              <div className="admin-quality-panel" role="status" aria-label="상세페이지 품질 점수">
                <div className="admin-quality-score">
                  <span>상세페이지 품질</span>
                  <strong>{qualityScore}%</strong>
                </div>
                <div className="admin-quality-meter" aria-hidden="true">
                  <span style={{ width: `${qualityScore}%` }} />
                </div>
                <div className="admin-quality-grid">
                  {qualityItems.map((item) => (
                    <span key={item.label} className={item.done ? "done" : ""} title={item.hint}>
                      <b>{item.label}</b>
                      <em>{item.value}</em>
                    </span>
                  ))}
                </div>
              </div>
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
              <div className="admin-publish-panel" data-admin-section="publish">
                <div>
                  <strong>상품 공개 설정</strong>
                  <span>저장과 동시에 공개할지, 검수용으로 숨길지 선택합니다.</span>
                </div>
                <div className="admin-publish-options" role="radiogroup" aria-label="상품 공개 상태">
                  {[
                    { value: "public", label: "즉시 공개", hint: "고객 상품 목록과 상세페이지에 노출" },
                    { value: "private", label: "비공개 저장", hint: "관리자만 상세페이지 검수" },
                    { value: "reserved", label: "예약 준비", hint: "비공개로 저장 후 예약일에 공개" }
                  ].map((item) => (
                    <label key={item.value} className={publishMode === item.value ? "active" : ""}>
                      <input
                        type="radio"
                        name="publishMode"
                        value={item.value}
                        checked={publishMode === item.value}
                        onChange={() => setPublishMode(item.value as AdminProductPublishMode)}
                      />
                      <b>{item.label}</b>
                      <small>{item.hint}</small>
                    </label>
                  ))}
                </div>
                {publishMode === "reserved" && (
                  <label className="admin-reserved-at">
                    예약 공개 예정일
                    <input type="datetime-local" value={reservedAt} onChange={(event) => setReservedAt(event.target.value)} />
                  </label>
                )}
              </div>
              <div className="admin-save-panel">
                <p>필수 정보와 상세페이지 자동 생성 정보를 확인한 뒤 저장합니다.</p>
                <button
                  type="button"
                  className="button teal"
                  disabled={saving || saveCompleted}
                  aria-busy={saving}
                  data-testid="admin-product-submit"
                  data-save-state={saving ? "saving" : saveCompleted ? "completed" : "idle"}
                  onPointerDown={recordPointerDown}
                  onClick={clickSave}
                >
                  {saving ? savingLabel : saveCompleted ? "상품 등록완료" : submitLabel}
                </button>
              </div>
              {showSubmitDebug && (
                <div className="admin-submit-debug" data-testid="admin-submit-debug" aria-live="polite">
                  <strong>Submit Debug</strong>
                  <dl>
                    <div><dt>mounted</dt><dd>{submitDebug.mountedAt}</dd></div>
                    <div><dt>pointerdown</dt><dd>{submitDebug.lastPointerDownAt ?? "-"}</dd></div>
                    <div><dt>click</dt><dd>{submitDebug.lastClickAt ?? "-"}</dd></div>
                    <div><dt>click count</dt><dd>{submitDebug.clickCount}</dd></div>
                    <div><dt>disabled</dt><dd>{String(submitDebug.buttonDisabled ?? false)}</dd></div>
                    <div><dt>form found</dt><dd>{String(submitDebug.formFound ?? false)}</dd></div>
                    <div><dt>top element</dt><dd>{submitDebug.topElementAtButton ?? "-"}</dd></div>
                    <div><dt>submit</dt><dd>{submitDebug.submitStartedAt ?? "-"}</dd></div>
                    <div><dt>validation</dt><dd>{submitDebug.validationStatus ?? "-"}</dd></div>
                    <div><dt>api</dt><dd>{submitDebug.apiStatus ?? "-"}</dd></div>
                    <div><dt>api start</dt><dd>{submitDebug.apiStartedAt ?? "-"}</dd></div>
                    <div><dt>api finish</dt><dd>{submitDebug.apiFinishedAt ?? "-"}</dd></div>
                    <div><dt>navigation</dt><dd>{submitDebug.navigationScheduledAt ?? "-"}</dd></div>
                    <div className="wide"><dt>message</dt><dd>{submitDebug.apiMessage ?? "-"}</dd></div>
                  </dl>
                </div>
              )}
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
