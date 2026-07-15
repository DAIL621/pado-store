"use client";

import type { ClipboardEvent, DragEvent } from "react";
import { useEffect, useState } from "react";
import {
  DEFAULT_PACKAGING,
  type ProductDetail,
  type ProductDetailFaq,
  type ProductDetailImage,
  type ProductDetailRecipe,
  type ProductDetailVideo
} from "@/lib/products/detail";
import {
  formatUploadSize,
  MAX_LEGACY_DETAIL_IMAGE_SIZE,
  MAX_PRODUCT_IMAGE_SIZE,
  MAX_PRODUCT_VIDEO_SIZE,
  type AdminUploadPurpose
} from "@/lib/admin/upload-limits";

type Props = {
  value: ProductDetail;
  onChange: (value: ProductDetail) => void;
  onUploadStateChange?: (uploading: boolean) => void;
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const PHOTO_ROLE_OPTIONS = ["대표사진", "크기 비교", "신선도/질감", "구성품", "포장 상태", "산지/생산자", "작업 과정", "조리 후 모습", "배송 상태", "기타"];

type LegacyUploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "waiting" | "uploading" | "success" | "error";
  error?: string;
};

export function ProductDetailEditor({ value, onChange, onUploadStateChange }: Props) {
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [uploadCompleteTarget, setUploadCompleteTarget] = useState<string | null>(null);
  const [dragOverHeroIndex, setDragOverHeroIndex] = useState<number | null>(null);
  const [dragOverLegacyIndex, setDragOverLegacyIndex] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadMessageTone, setUploadMessageTone] = useState<"info" | "success" | "error">("info");
  const [legacyUploadItems, setLegacyUploadItems] = useState<LegacyUploadItem[]>([]);

  useEffect(() => {
    onUploadStateChange?.(Boolean(uploadingTarget));
  }, [onUploadStateChange, uploadingTarget]);

  const update = <K extends keyof ProductDetail>(key: K, nextValue: ProductDetail[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const updateLegacy = (index: number, key: keyof ProductDetailImage, nextValue: string) => {
    update(
      "legacyDetailImages",
      value.legacyDetailImages.map((image, imageIndex) => (imageIndex === index ? { ...image, [key]: nextValue } : image))
    );
  };

  const moveLegacy = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.legacyDetailImages.length) return;
    const next = [...value.legacyDetailImages];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    update("legacyDetailImages", next);
  };

  const removeLegacy = (index: number) => {
    update("legacyDetailImages", value.legacyDetailImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const updateHero = (index: number, key: keyof ProductDetailImage, nextValue: string) => {
    update(
      "heroImages",
      value.heroImages.map((image, imageIndex) => (imageIndex === index ? { ...image, [key]: nextValue } : image))
    );
  };

  const updateHeroRole = (index: number, nextRole: string) => {
    const cleanedRole = nextRole.trim();
    const currentRole = value.heroImages[index]?.label;
    if (!cleanedRole) return;

    let nextImages = value.heroImages.map((image, imageIndex) => {
      if (imageIndex === index) return { ...image, label: cleanedRole };
      if (cleanedRole === "대표사진" && image.label === "대표사진") return { ...image, label: "기타" };
      return image;
    });

    if (currentRole === "대표사진" && cleanedRole !== "대표사진" && !nextImages.some((image) => image.label === "대표사진")) {
      const replacementIndex = nextImages.findIndex((image, imageIndex) => imageIndex !== index && image.url.trim());
      if (replacementIndex < 0) return;
      nextImages = nextImages.map((image, imageIndex) => imageIndex === replacementIndex ? { ...image, label: "대표사진" } : image);
    }
    update("heroImages", nextImages);
  };

  const updateHeroFields = (index: number, fields: Partial<ProductDetailImage>) => {
    update(
      "heroImages",
      value.heroImages.map((image, imageIndex) => (imageIndex === index ? { ...image, ...fields } : image))
    );
  };

  const moveHero = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.heroImages.length) return;
    const next = [...value.heroImages];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    update("heroImages", next);
  };

  const handleHeroDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleLegacyDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.setData("text/plain", `legacy:${index}`);
  };

  const handleLegacyDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    setDragOverLegacyIndex(null);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length) {
      uploadLegacyFiles(files, index);
      return;
    }
    const payload = event.dataTransfer.getData("text/plain");
    if (payload.startsWith("legacy:")) {
      const fromIndex = Number(payload.replace("legacy:", ""));
      if (Number.isInteger(fromIndex)) moveLegacy(fromIndex, index);
    }
  };

  const handleHeroDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    setDragOverHeroIndex(null);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length) {
      uploadHeroFiles(index, files);
      return;
    }
    if (event.dataTransfer.files?.length) {
      setUploadMessageTone("error");
      setUploadMessage("이미지 파일만 업로드할 수 있습니다. JPG, PNG, WebP 파일을 선택해주세요.");
      return;
    }
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(fromIndex)) moveHero(fromIndex, index);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    event.preventDefault();
    const firstEmptyIndex = value.heroImages.findIndex((image) => !image.url.trim());
    const startIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
    setUploadMessageTone("info");
    setUploadMessage(`붙여넣은 이미지 ${files.length}개를 대표사진에 업로드합니다.`);
    uploadHeroFiles(startIndex, files);
  };

  const uploadHeroFile = async (index: number, file: File) => {
    await uploadHeroFiles(index, [file]);
  };

  const uploadHeroFiles = async (startIndex: number, files: File[]) => {
    let nextImages = [...value.heroImages];
    for (const [offset, file] of files.entries()) {
      const targetIndex = startIndex + offset;
      if (targetIndex >= value.heroImages.length) break;
      const previousImage = nextImages[targetIndex];
      const description = nextImages[targetIndex]?.description || file.name.replace(/\.[^.]+$/, "");
      const previewUrl = URL.createObjectURL(file);
      nextImages = nextImages.map((image, imageIndex) =>
        imageIndex === targetIndex ? { ...image, url: previewUrl, description } : image
      );
      onChange({ ...value, heroImages: nextImages });

      const uploaded = await uploadImageFile(`hero-${targetIndex}`, file, (url) => {
        nextImages = nextImages.map((image, imageIndex) =>
          imageIndex === targetIndex ? { ...image, url, description } : image
        );
        onChange({ ...value, heroImages: nextImages });
      });
      URL.revokeObjectURL(previewUrl);
      if (!uploaded) {
        nextImages = nextImages.map((image, imageIndex) =>
          imageIndex === targetIndex && previousImage ? previousImage : image
        );
        onChange({ ...value, heroImages: nextImages });
      }
    }
  };

  const uploadJourneyFile = async (index: number, file: File) => {
    uploadImageFile(`journey-${index}`, file, (url) => updateJourney(index, "image", url));
  };

  const uploadRecipeFile = async (index: number, file: File) => {
    uploadImageFile(`recipe-${index}`, file, (url) => updateRecipe(index, "image", url));
  };

  const uploadVideoFile = async (index: number, file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setUploadMessageTone("error");
      setUploadMessage("동영상은 mp4 또는 webm 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_PRODUCT_VIDEO_SIZE) {
      setUploadMessageTone("error");
      setUploadMessage("동영상은 80MB 이하 파일로 업로드해주세요.");
      return;
    }
    const target = `video-${index}`;
    setUploadingTarget(target);
    setUploadCompleteTarget(null);
    setUploadMessageTone("info");
    setUploadMessage("동영상을 업로드하고 있습니다...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "video");
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) {
        setUploadMessageTone("error");
        setUploadMessage(result.message ?? "동영상 업로드에 실패했습니다.");
        return;
      }
      updateVideo(index, "url", result.url);
      setUploadCompleteTarget(target);
      setUploadMessageTone("success");
      setUploadMessage("동영상 업로드가 완료되었습니다.");
      window.setTimeout(() => setUploadCompleteTarget((current) => (current === target ? null : current)), 2200);
    } catch {
      setUploadMessageTone("error");
      setUploadMessage("동영상 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const uploadLegacyFiles = async (files: File[], insertIndex = value.legacyDetailImages.length) => {
    let nextImages = [...value.legacyDetailImages];
    let successfulCount = 0;
    const queue = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      status: "waiting" as const
    }));
    setLegacyUploadItems((current) => [...current.filter((item) => item.status === "uploading"), ...queue]);

    for (const item of queue) {
      const { file } = item;
      const targetIndex = Math.min(insertIndex + successfulCount, nextImages.length);
      const description = file.name.replace(/\.[^.]+$/, "");
      if (file.size > MAX_LEGACY_DETAIL_IMAGE_SIZE) {
        const error = "상세페이지 이미지는 파일당 최대 20MB까지 업로드할 수 있습니다.";
        setLegacyUploadItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error } : entry));
        setUploadMessageTone("error");
        setUploadMessage(`${file.name}: ${error}`);
        continue;
      }

      setLegacyUploadItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading", error: undefined } : entry));
      const previewUrl = URL.createObjectURL(file);
      nextImages.splice(targetIndex, 0, {
        label: `기존 상세페이지 ${targetIndex + 1}`,
        url: previewUrl,
        description
      });
      onChange({ ...value, legacyDetailImages: nextImages });

      const uploaded = await uploadImageFile(`legacy-${targetIndex}`, file, (url) => {
        nextImages = nextImages.map((image, imageIndex) =>
          imageIndex === targetIndex ? { ...image, url, description } : image
        );
        onChange({ ...value, legacyDetailImages: nextImages });
      }, "legacy-detail");
      URL.revokeObjectURL(previewUrl);
      if (!uploaded) {
        nextImages = nextImages.filter((_, imageIndex) => imageIndex !== targetIndex);
        onChange({ ...value, legacyDetailImages: nextImages });
        setLegacyUploadItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: "업로드에 실패했습니다. 다시 시도해주세요." } : entry));
      } else {
        successfulCount += 1;
        setLegacyUploadItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "success", error: undefined } : entry));
      }
    }
  };

  const retryLegacyUpload = (item: LegacyUploadItem) => {
    setLegacyUploadItems((current) => current.filter((entry) => entry.id !== item.id));
    void uploadLegacyFiles([item.file]);
  };

  const uploadImageFile = async (target: string, file: File, onUploaded: (url: string) => void, purpose: AdminUploadPurpose = "product") => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadMessageTone("error");
      setUploadMessage("지원하지 않는 이미지 형식입니다. JPG, PNG, WebP, GIF 파일을 사용해주세요.");
      return false;
    }
    const maxSize = purpose === "legacy-detail" ? MAX_LEGACY_DETAIL_IMAGE_SIZE : MAX_PRODUCT_IMAGE_SIZE;
    if (file.size > maxSize) {
      setUploadMessageTone("error");
      setUploadMessage(purpose === "legacy-detail"
        ? `${file.name}: 상세페이지 이미지는 파일당 최대 20MB까지 업로드할 수 있습니다.`
        : `${file.name}: 일반 상품 이미지는 파일당 최대 5MB까지 업로드할 수 있습니다.`);
      return false;
    }

    setUploadingTarget(target);
    setUploadCompleteTarget(null);
    setUploadMessageTone("info");
    setUploadMessage("이미지를 업로드하고 있습니다...");
    const slowTimer = window.setTimeout(() => {
      setUploadMessageTone("info");
      setUploadMessage("업로드가 평소보다 오래 걸리고 있습니다. 창을 닫지 말고 잠시만 기다려주세요.");
    }, 6000);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        setUploadMessageTone("error");
        setUploadMessage(result.message ?? "이미지 업로드에 실패했습니다.");
        return false;
      }
      onUploaded(result.url);
      setUploadCompleteTarget(target);
      setUploadMessageTone("success");
      setUploadMessage(
        result.storage === "supabase"
          ? "이미지가 Supabase Storage에 업로드되었습니다."
          : "이미지가 업로드되었습니다. 현재는 로컬 개발 저장소를 사용 중입니다."
      );
      window.setTimeout(() => setUploadCompleteTarget((current) => (current === target ? null : current)), 2200);
      return true;
    } catch {
      setUploadMessageTone("error");
      setUploadMessage("이미지 업로드 중 오류가 발생했습니다.");
      return false;
    } finally {
      window.clearTimeout(slowTimer);
      setUploadingTarget(null);
    }
  };

  const updateBenefit = (index: number, nextValue: string) => {
    update(
      "benefits",
      value.benefits.map((benefit, benefitIndex) => (benefitIndex === index ? nextValue : benefit))
    );
  };

  const addBenefit = () => {
    if (value.benefits.length >= 5) return;
    update("benefits", [...value.benefits, ""]);
  };

  const removeBenefit = (index: number) => {
    update("benefits", value.benefits.length <= 1 ? [""] : value.benefits.filter((_, benefitIndex) => benefitIndex !== index));
  };

  const updateJourney = (index: number, key: "title" | "image" | "description", nextValue: string) => {
    update(
      "journey",
      value.journey.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: nextValue } : step))
    );
  };

  const updateTextList = (key: "packaging" | "components", index: number, nextValue: string) => {
    update(
      key,
      value[key].map((item, itemIndex) => (itemIndex === index ? nextValue : item))
    );
  };

  const addTextListItem = (key: "packaging" | "components", fallback = "") => {
    update(key, [...value[key], fallback]);
  };

  const removeTextListItem = (key: "packaging" | "components", index: number) => {
    update(key, value[key].length <= 1 ? [""] : value[key].filter((_, itemIndex) => itemIndex !== index));
  };

  const updateRecipe = (index: number, key: keyof ProductDetailRecipe, nextValue: string) => {
    update(
      "recipes",
      value.recipes.map((recipe, recipeIndex) => (recipeIndex === index ? { ...recipe, [key]: nextValue } : recipe))
    );
  };

  const addRecipe = () => update("recipes", [...value.recipes, { title: "", description: "", image: "" }]);
  const removeRecipe = (index: number) =>
    update("recipes", value.recipes.length <= 1 ? [{ title: "", description: "", image: "" }] : value.recipes.filter((_, recipeIndex) => recipeIndex !== index));

  const updateVideo = (index: number, key: keyof ProductDetailVideo, nextValue: string | boolean) => {
    update(
      "videos",
      value.videos.map((video, videoIndex) => {
        if (videoIndex !== index) return video;
        const nextVideo = { ...video, [key]: nextValue };
        return key === "autoplay" && nextValue === true ? { ...nextVideo, muted: true } : nextVideo;
      })
    );
  };

  const addVideo = () =>
    update("videos", [
      ...value.videos,
      { title: "", url: "", thumbnail: "", placement: "bottom", autoplay: false, muted: true, loop: false, controls: true }
    ]);
  const removeVideo = (index: number) => update("videos", value.videos.filter((_, videoIndex) => videoIndex !== index));
  const moveVideo = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.videos.length) return;
    const next = [...value.videos];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    update("videos", next);
  };

  const updateFaq = (index: number, key: keyof ProductDetailFaq, nextValue: string) => {
    update(
      "faq",
      value.faq.map((faq, faqIndex) => (faqIndex === index ? { ...faq, [key]: nextValue } : faq))
    );
  };

  const addFaq = () => update("faq", [...value.faq, { question: "", answer: "" }]);
  const removeFaq = (index: number) =>
    update("faq", value.faq.length <= 1 ? [{ question: "", answer: "" }] : value.faq.filter((_, faqIndex) => faqIndex !== index));

  const completedHeroCount = value.heroImages.filter((image) => image.url.trim()).length;
  const completedLegacyCount = value.legacyDetailImages.filter((image) => image.url.trim()).length;
  const completedBenefitCount = value.benefits.filter((benefit) => benefit.trim()).length;
  const completedJourneyCount = value.journey.filter((step) => step.description.trim() || step.image.trim()).length;

  return (
    <div className="wide admin-detail-editor" onPaste={handlePaste}>
      <div className="admin-detail-editor-head">
        <div>
          <strong>상세페이지 자동 생성 정보</strong>
          <small>DB 컬럼 적용 후 이 데이터가 `products.detail_json`에 저장되고 상품 상세페이지에 자동 표시됩니다.</small>
        </div>
        <span className="admin-detail-version">v{value.schemaVersion}</span>
      </div>

      <details open>
        <summary>상세페이지 출력 방식</summary>
        <div className="admin-detail-mode">
          <label className={value.detailDisplayMode === "legacy" ? "active" : ""}>
            <input
              type="radio"
              name="detailDisplayMode"
              checked={value.detailDisplayMode === "legacy"}
              onChange={() => update("detailDisplayMode", "legacy")}
            />
            <strong>기존 상세페이지</strong>
            <span>대표가 제작한 PNG/JPG/WebP 이미지를 순서대로 우선 출력합니다.</span>
          </label>
          <label className={value.detailDisplayMode === "ai" ? "active" : ""}>
            <input
              type="radio"
              name="detailDisplayMode"
              checked={value.detailDisplayMode === "ai"}
              onChange={() => update("detailDisplayMode", "ai")}
            />
            <strong>AI 자동생성</strong>
            <span>MASTER Template 기반 자동 상세페이지를 출력합니다.</span>
          </label>
        </div>
      </details>

      <details open>
        <summary>기존 상세페이지 이미지</summary>
        <p className="admin-detail-help">PNG, JPG, WebP 이미지를 업로드하면 상품 상세페이지에서 원본 비율을 유지해 순서대로 출력합니다. 등록된 기존 상세페이지가 있으면 AI 자동생성보다 우선 표시됩니다.</p>
        <div
          className={`admin-legacy-dropzone ${dragOverLegacyIndex === -1 ? "drag-over" : ""}`}
          onDragEnter={() => setDragOverLegacyIndex(-1)}
          onDragLeave={() => setDragOverLegacyIndex((current) => (current === -1 ? null : current))}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setDragOverLegacyIndex(null);
            const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
            if (files.length) uploadLegacyFiles(files);
          }}
        >
          <strong>기존 상세페이지 이미지 업로드</strong>
          <span>여러 장을 한 번에 드롭하거나 클릭해서 추가하세요. 순서는 아래 카드에서 조정할 수 있습니다.</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            aria-label="기존 상세페이지 이미지 업로드"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length) uploadLegacyFiles(files);
              event.currentTarget.value = "";
            }}
          />
        </div>
        <div className="admin-detail-progress" aria-label="기존 상세페이지 이미지 수">
          <span>기존 상세 {completedLegacyCount}장</span>
          <span>출력 {value.detailDisplayMode === "legacy" ? "기존 상세페이지" : "AI 자동생성"}</span>
        </div>
        <p className="admin-detail-help">상세페이지 이미지는 JPG · PNG · WebP 파일당 최대 20MB까지 업로드할 수 있습니다.</p>
        {uploadMessage && <p className={`admin-detail-upload-message ${uploadMessageTone}`} role="status">{uploadMessage}</p>}
        {legacyUploadItems.length > 0 && (
          <div className="admin-upload-file-list" aria-label="상세페이지 이미지 업로드 상태">
            {legacyUploadItems.map((item) => (
              <div className={`admin-upload-file-item ${item.status}`} key={item.id}>
                <span><b>{item.name}</b><small>{formatUploadSize(item.size)}</small></span>
                <em>{item.status === "waiting" ? "대기" : item.status === "uploading" ? "업로드 중" : item.status === "success" ? "업로드 완료" : item.error}</em>
                {item.status === "error" && <button type="button" onClick={() => retryLegacyUpload(item)}>실패 파일 재시도</button>}
              </div>
            ))}
          </div>
        )}
        {value.legacyDetailImages.length > 0 && (
          <div className="admin-legacy-detail-list">
            {value.legacyDetailImages.map((image, index) => (
              <div
                className={`admin-legacy-detail-card ${dragOverLegacyIndex === index ? "drag-over" : ""}`}
                draggable
                key={`${image.url}-${index}`}
                onDragStart={(event) => handleLegacyDragStart(event, index)}
                onDragEnter={() => setDragOverLegacyIndex(index)}
                onDragLeave={() => setDragOverLegacyIndex((current) => (current === index ? null : current))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleLegacyDrop(event, index)}
              >
                <div className="admin-legacy-detail-preview">
                  <img src={image.url} alt={image.label || `기존 상세페이지 ${index + 1}`} />
                </div>
                <div className="admin-legacy-detail-fields">
                  <div className="admin-detail-card-head">
                    <b>{index + 1}. {image.label || "기존 상세페이지"}</b>
                    <span>
                      <button type="button" onClick={() => moveLegacy(index, index - 1)} disabled={index === 0}>위</button>
                      <button type="button" onClick={() => moveLegacy(index, index + 1)} disabled={index === value.legacyDetailImages.length - 1}>아래</button>
                      <button type="button" onClick={() => removeLegacy(index)}>삭제</button>
                    </span>
                  </div>
                  <label>
                    이미지 라벨
                    <input value={image.label} onChange={(event) => updateLegacy(index, "label", event.target.value)} placeholder="상세페이지 이미지 라벨" />
                  </label>
                  <label>
                    이미지 경로
                    <input value={image.url} onChange={(event) => updateLegacy(index, "url", event.target.value)} placeholder="/uploads/detail/sample.webp" />
                  </label>
                  <label>
                    설명 optional
                    <input value={image.description ?? ""} onChange={(event) => updateLegacy(index, "description", event.target.value)} placeholder="관리자 메모 또는 alt 설명" />
                  </label>
                  {uploadingTarget === `legacy-${index}` && <small className="admin-upload-progress">업로드 중...</small>}
                  {uploadCompleteTarget === `legacy-${index}` && <small className="admin-upload-progress">업로드 완료</small>}
                </div>
              </div>
            ))}
          </div>
        )}
      </details>

      <div className="admin-detail-progress" aria-label="상세페이지 입력 진행률">
        <span>사진 {completedHeroCount}/6</span>
        <span>장점 {completedBenefitCount}/5</span>
        <span>여정 {completedJourneyCount}/5</span>
      </div>

      <details open>
        <summary>상세페이지 대표사진 6장</summary>
        <p className="admin-detail-help">카드를 드래그하거나 위/아래 버튼으로 순서를 조정할 수 있습니다. 여러 이미지를 한 번에 드롭하거나 복사한 이미지를 붙여넣으면 빈 칸부터 채워집니다.</p>
        <div className="admin-detail-grid">
          {value.heroImages.map((image, index) => (
            <div
              className="admin-detail-card draggable"
              draggable
              key={`${image.label}-${index}`}
              onDragEnter={() => setDragOverHeroIndex(index)}
              onDragLeave={() => setDragOverHeroIndex((current) => (current === index ? null : current))}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={(event) => handleHeroDragStart(event, index)}
              onDrop={(event) => handleHeroDrop(event, index)}
            >
              <div className="admin-detail-card-head">
                <b>{index + 1}. {image.label}</b>
                <span>
                  {index === 0 && <em className="admin-main-photo-badge">대표사진</em>}
                  <button type="button" onClick={() => moveHero(index, index - 1)} disabled={index === 0}>위</button>
                  <button type="button" onClick={() => moveHero(index, index + 1)} disabled={index === value.heroImages.length - 1}>아래</button>
                </span>
              </div>
              <div className={`admin-image-upload-box ${image.url ? "has-image" : ""} ${dragOverHeroIndex === index ? "drag-over" : ""}`}>
                {image.url ? (
                  <img src={image.url} alt={`${image.label} 미리보기`} />
                ) : (
                  <span>
                    이미지를 드롭하거나 클릭해 업로드
                    <small>JPG · PNG · WebP · GIF / 최대 5MB</small>
                  </span>
                )}
                {uploadCompleteTarget === `hero-${index}` && <strong className="admin-upload-check" aria-label="업로드 완료">✓</strong>}
                <input
                  type="file"
                  accept="image/*"
                  aria-label={`${image.label} 업로드`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadHeroFile(index, file);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
              {uploadingTarget === `hero-${index}` && (
                <small className="admin-upload-progress">
                  업로드 중...
                  <span><i /></span>
                </small>
              )}
              <label>
                사진 역할
                <input
                  list="product-photo-role-options"
                  value={image.label}
                  onChange={(event) => event.target.value === "대표사진" ? updateHeroRole(index, event.target.value) : updateHero(index, "label", event.target.value)}
                  onBlur={() => {
                    if (!value.heroImages.some((item) => item.label === "대표사진")) updateHeroRole(index, "대표사진");
                  }}
                  placeholder="표준 역할 선택 또는 직접 입력"
                />
              </label>
              <label>
                사진 경로
                <input value={image.url} onChange={(event) => updateHero(index, "url", event.target.value)} placeholder="/images/products/sample.webp" />
              </label>
              <label>
                사진 설명
                <input value={image.description ?? ""} onChange={(event) => updateHero(index, "description", event.target.value)} placeholder="상세페이지 보조 설명" />
              </label>
              <button type="button" className="admin-delete-image-button" onClick={() => updateHero(index, "url", "")} disabled={!image.url}>이미지 삭제</button>
            </div>
          ))}
        </div>
        <datalist id="product-photo-role-options">
          {PHOTO_ROLE_OPTIONS.map((role) => <option value={role} key={role} />)}
        </datalist>
      </details>

      <details>
        <summary>상품 장점</summary>
        <p className="admin-detail-help">최대 5개까지 입력됩니다. 비어 있는 항목은 상세페이지에서 표시하지 않습니다.</p>
        <div className="admin-detail-list">
          {value.benefits.map((benefit, index) => (
            <div className="admin-detail-inline" key={index}>
              <label>
                장점 {index + 1}
                <input value={benefit} onChange={(event) => updateBenefit(index, event.target.value)} placeholder="예: 당일 선별" />
              </label>
              <button type="button" onClick={() => removeBenefit(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addBenefit} disabled={value.benefits.length >= 5}>+ 장점 추가</button>
        </div>
      </details>

      <details>
        <summary>산지에서 식탁까지</summary>
        <div className="admin-journey-preview" aria-label="여정 미리보기">
          {value.journey.map((step, index) => (
            <span key={step.key} className={step.description || step.image ? "filled" : ""}>
              {index + 1}. {step.title || "단계"}
            </span>
          ))}
        </div>
        <div className="admin-detail-grid">
          {value.journey.map((step, index) => (
            <div className="admin-detail-card" key={step.key}>
              <b>{index + 1}. {step.title || "단계"}</b>
              {step.image && (
                <div className="admin-small-preview">
                  <img src={step.image} alt={`${step.title} 미리보기`} />
                </div>
              )}
              <label>
                단계 제목
                <input value={step.title} onChange={(event) => updateJourney(index, "title", event.target.value)} />
              </label>
              <label className="admin-file-chip">
                사진 업로드
                <input
                  type="file"
                  accept="image/*"
                  aria-label={`${step.title || `여정 ${index + 1}`} 사진 업로드`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadJourneyFile(index, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {uploadingTarget === `journey-${index}` && <small className="admin-upload-progress">업로드 중...</small>}
              <label>
                사진 경로
                <input value={step.image} onChange={(event) => updateJourney(index, "image", event.target.value)} placeholder="/images/story/sample.webp" />
              </label>
              <label>
                한 줄 설명
                <textarea value={step.description} onChange={(event) => updateJourney(index, "description", event.target.value)} rows={2} />
              </label>
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary>포장 / 배송 정보</summary>
        <div className="admin-detail-list">
          {value.packaging.map((item, index) => (
            <div className="admin-detail-inline" key={index}>
              <label>
                안내 {index + 1}
                <input value={item} onChange={(event) => updateTextList("packaging", index, event.target.value)} />
              </label>
              <button type="button" onClick={() => removeTextListItem("packaging", index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={() => addTextListItem("packaging", DEFAULT_PACKAGING[value.packaging.length % DEFAULT_PACKAGING.length] ?? "")}>+ 안내 추가</button>
        </div>
      </details>

      <details>
        <summary>맛있게 먹는 방법</summary>
        <div className="admin-detail-grid">
          {value.recipes.map((recipe, index) => (
            <div className="admin-detail-card" key={index}>
              <b>방법 {index + 1}</b>
              {recipe.image && (
                <div className="admin-small-preview">
                  <img src={recipe.image} alt={`${recipe.title || `방법 ${index + 1}`} 미리보기`} />
                </div>
              )}
              <label>
                제목
                <input value={recipe.title} onChange={(event) => updateRecipe(index, "title", event.target.value)} placeholder="예: 전복버터구이" />
              </label>
              <label>
                설명
                <textarea value={recipe.description} onChange={(event) => updateRecipe(index, "description", event.target.value)} rows={2} />
              </label>
              <label className="admin-file-chip">
                이미지 업로드
                <input
                  type="file"
                  accept="image/*"
                  aria-label={`${recipe.title || `방법 ${index + 1}`} 이미지 업로드`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadRecipeFile(index, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {uploadingTarget === `recipe-${index}` && <small className="admin-upload-progress">업로드 중...</small>}
              <label>
                이미지 경로 optional
                <input value={recipe.image ?? ""} onChange={(event) => updateRecipe(index, "image", event.target.value)} placeholder="/images/recipes/sample.webp" />
              </label>
              <button type="button" onClick={() => removeRecipe(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addRecipe}>+ 방법 추가</button>
        </div>
      </details>

      <details>
        <summary>구성품</summary>
        <div className="admin-detail-list">
          {value.components.map((item, index) => (
            <div className="admin-detail-inline" key={index}>
              <label>
                구성품 {index + 1}
                <input value={item} onChange={(event) => updateTextList("components", index, event.target.value)} placeholder="예: 활전복 1kg" />
              </label>
              <button type="button" onClick={() => removeTextListItem("components", index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={() => addTextListItem("components")}>+ 구성품 추가</button>
        </div>
      </details>

      <details>
        <summary>FAQ</summary>
        <div className="admin-detail-list">
          {value.faq.map((item, index) => (
            <div className="admin-detail-card" key={index}>
              <b>FAQ {index + 1}</b>
              <label>
                질문
                <input value={item.question} onChange={(event) => updateFaq(index, "question", event.target.value)} placeholder="예: 언제 출고되나요?" />
              </label>
              <label>
                답변
                <textarea value={item.answer} onChange={(event) => updateFaq(index, "answer", event.target.value)} rows={2} />
              </label>
              <button type="button" onClick={() => removeFaq(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addFaq}>+ FAQ 추가</button>
        </div>
      </details>

      <details>
        <summary>향후 확장 슬롯</summary>
        <p className="admin-detail-help">동영상, 인증서, 추가 섹션은 JSON 구조에 준비되어 있습니다. 이번 단계에서는 저장 구조만 유지하고 UI는 이후 운영 데이터가 준비되면 확장합니다.</p>
      </details>
      <details>
        <summary>동영상</summary>
        <p className="admin-detail-help">mp4 또는 webm 파일을 업로드할 수 있습니다. 고객 화면에서는 자동재생 없이 클릭 재생만 지원합니다.</p>
        <div className="admin-detail-list">
          {value.videos.map((video, index) => (
            <div className="admin-detail-card" key={`${video.url}-${index}`}>
              <div className="admin-detail-card-head">
                <b>동영상 {index + 1}</b>
                <span>
                  <button type="button" onClick={() => moveVideo(index, index - 1)} disabled={index === 0}>위</button>
                  <button type="button" onClick={() => moveVideo(index, index + 1)} disabled={index === value.videos.length - 1}>아래</button>
                  <button type="button" onClick={() => removeVideo(index)}>삭제</button>
                </span>
              </div>
              {video.url && (
                <div className="admin-video-preview">
                  <video src={video.url} controls preload="metadata" poster={video.thumbnail || undefined} />
                </div>
              )}
              <label>
                제목
                <input value={video.title} onChange={(event) => updateVideo(index, "title", event.target.value)} placeholder="상품 소개 영상" />
              </label>
              <label>
                출력 위치
                <select value={video.placement ?? "bottom"} onChange={(event) => updateVideo(index, "placement", event.target.value)}>
                  <option value="bottom">상세 이미지 아래</option>
                  <option value="top">상세 이미지 위</option>
                </select>
              </label>
              <div className="admin-video-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={video.autoplay === true}
                    onChange={(event) => updateVideo(index, "autoplay", event.target.checked)}
                  />
                  자동재생 사용
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={video.loop === true}
                    onChange={(event) => updateVideo(index, "loop", event.target.checked)}
                  />
                  반복재생
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={video.controls !== false}
                    onChange={(event) => updateVideo(index, "controls", event.target.checked)}
                  />
                  재생 컨트롤 표시
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={video.autoplay === true || video.muted !== false}
                    disabled={video.autoplay === true}
                    onChange={(event) => updateVideo(index, "muted", event.target.checked)}
                  />
                  음소거 시작
                </label>
              </div>
              <label className="admin-file-chip">
                동영상 업로드
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  aria-label={`동영상 ${index + 1} 업로드`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadVideoFile(index, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {uploadingTarget === `video-${index}` && <small className="admin-upload-progress">업로드 중...</small>}
              {uploadCompleteTarget === `video-${index}` && <small className="admin-upload-progress">업로드 완료</small>}
              <label>
                동영상 URL
                <input value={video.url} onChange={(event) => updateVideo(index, "url", event.target.value)} placeholder="/uploads/products/sample.mp4" />
              </label>
              <label>
                썸네일 URL optional
                <input value={video.thumbnail ?? ""} onChange={(event) => updateVideo(index, "thumbnail", event.target.value)} placeholder="/uploads/products/sample-thumb.webp" />
              </label>
            </div>
          ))}
          <button type="button" onClick={addVideo}>+ 동영상 추가</button>
        </div>
      </details>
    </div>
  );
}
