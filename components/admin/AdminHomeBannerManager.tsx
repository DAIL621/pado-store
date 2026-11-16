"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { HomeBanner } from "@/lib/site/home-banner";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 6 * 1024 * 1024;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function usePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

export function AdminHomeBannerManager({ initial }: { initial: HomeBanner }) {
  const router = useRouter();
  const [current, setCurrent] = useState(initial);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [clearMobile, setClearMobile] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showText, setShowText] = useState(initial.showText);
  const [eyebrow, setEyebrow] = useState(initial.eyebrow);
  const [headline, setHeadline] = useState(initial.headline);
  const [description, setDescription] = useState(initial.description);
  const [imageAlt, setImageAlt] = useState(initial.imageAlt);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaHref, setCtaHref] = useState(initial.ctaHref);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);
  const desktopPreview = usePreviewUrl(desktopFile);
  const mobilePreview = usePreviewUrl(mobileFile);

  const desktopUrl = desktopPreview || current.desktopImageUrl;
  const mobileUrl = mobilePreview || (clearMobile ? null : current.mobileImageUrl) || desktopUrl;
  const previewUrl = previewDevice === "mobile" ? mobileUrl : desktopUrl;

  const selectImage = (file: File | undefined, device: "desktop" | "mobile") => {
    setErrorMessage("");
    setStatus("");
    if (!file) return;
    if (!MIME_TYPES.has(file.type)) {
      setErrorMessage("JPG, PNG 또는 WebP 이미지로 등록해주세요.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrorMessage("이미지는 파일당 6MB 이하로 등록해주세요.");
      return;
    }
    if (device === "desktop") {
      setDesktopFile(file);
      setPreviewDevice("desktop");
    } else {
      setMobileFile(file);
      setClearMobile(false);
      setPreviewDevice("mobile");
    }
  };

  const applyBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus("");
    setErrorMessage("");

    try {
      // Upload images directly to Supabase Storage; sending the bytes through a
      // Vercel Function fails with 413 Request Entity Too Large for large files.
      // Existing Storage RLS grants INSERT only to the administrator role.
      const supabase = createClient();
      const uploadImage = async (file: File, label: string) => {
        const path = "home-hero/" + crypto.randomUUID() + "." + MIME_EXT[file.type];
        setStatus(label + " 업로드 중...");
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false
        });
        if (error) throw new Error(label + " 업로드 실패: " + error.message);
        return path;
      };

      const desktopPath = desktopFile ? await uploadImage(desktopFile, "PC 메인사진") : null;
      const mobilePath = mobileFile ? await uploadImage(mobileFile, "모바일 메인사진") : null;
      setStatus("홈페이지에 배너를 적용하는 중...");

      const response = await fetch("/api/admin/home-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktop_image_path: desktopPath,
          mobile_image_path: mobilePath,
          clear_mobile: clearMobile,
          show_text: showText,
          image_alt: imageAlt,
          eyebrow,
          headline,
          description,
          cta_label: ctaLabel,
          cta_href: ctaHref
        })
      });
      // Platform errors (413, 502, etc.) may be HTML or plain text, not JSON.
      // Never leak a raw JSON parser exception into the admin UI.
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(response.status === 413
          ? "업로드 요청이 서버 용량을 초과했습니다. 페이지를 새로고침한 후 다시 시도해주세요."
          : "서버 응답에 문제가 발생했습니다 (HTTP " + response.status + "). 다시 시도해주세요.");
      }
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "배너 변경에 실패했습니다.");
      }

      setCurrent(result.banner as HomeBanner);
      setDesktopFile(null);
      setMobileFile(null);
      setClearMobile(false);
      if (desktopInput.current) desktopInput.current.value = "";
      if (mobileInput.current) mobileInput.current.value = "";
      setStatus("메인 배너가 적용되었습니다. 홈페이지를 열어 확인해 보세요.");
      router.refresh();
    } catch (error) {
      setStatus("");
      setErrorMessage(error instanceof Error ? error.message : "배너 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-home-banner" onSubmit={applyBanner}>
      <div className="admin-banner-intro">
        <strong>홈페이지 메인 배너 관리</strong>
        <span>파일 선택 → 미리보기 → 홈페이지에 적용. 변경 전까지 기존 배너가 유지됩니다.</span>
      </div>

      <section className="admin-banner-section" aria-labelledby="banner-upload-title">
        <h2 id="banner-upload-title"><b>1</b> 이미지 선택</h2>
        <p>PC용 사진을 등록하고, 필요하면 모바일 사진도 별도로 등록하세요. JPG · PNG · WebP, 파일당 6MB 이하.</p>
        <div className="admin-banner-file-grid">
          <label>
            <strong>PC 메인사진</strong>
            <input ref={desktopInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files?.[0], "desktop")} disabled={saving} />
            <small>{desktopFile ? desktopFile.name : "현재 이미지 유지 또는 새 파일 선택"}</small>
          </label>
          <label>
            <strong>모바일 메인사진 (선택)</strong>
            <input ref={mobileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files?.[0], "mobile")} disabled={saving} />
            <small>{mobileFile ? mobileFile.name : current.mobileImageUrl && !clearMobile ? "현재 모바일 이미지 사용 중" : "미등록 시 PC 사진을 사용합니다."}</small>
            {(current.mobileImageUrl || mobileFile) && (
              <span className="admin-banner-checkbox">
                <input type="checkbox" checked={clearMobile} onChange={(event) => { setClearMobile(event.target.checked); if (event.target.checked) setMobileFile(null); }} disabled={saving} />
                모바일 전용 이미지 제거
              </span>
            )}
          </label>
        </div>
      </section>

      <section className="admin-banner-section" aria-labelledby="banner-copy-title">
        <h2 id="banner-copy-title">배너 문구 및 연결 설정</h2>
        <label className="admin-banner-checkbox">
          <input type="checkbox" checked={showText} onChange={(event) => setShowText(event.target.checked)} disabled={saving} />
          사진 위에 파도스토리 소개 문구와 배송 안내 표시
        </label>
        <div className="admin-banner-form-grid">
          <label><strong>상단 작은 문구</strong><input value={eyebrow} maxLength={80} onChange={(event) => setEyebrow(event.target.value)} disabled={saving} /></label>
          <label><strong>메인 제목</strong><input value={headline} maxLength={70} onChange={(event) => setHeadline(event.target.value)} disabled={saving} /></label>
          <label className="full"><strong>설명 문구</strong><textarea value={description} rows={2} maxLength={240} onChange={(event) => setDescription(event.target.value)} disabled={saving} /></label>
          <label className="full"><strong>이미지 설명 (접근성)</strong><input value={imageAlt} maxLength={120} onChange={(event) => setImageAlt(event.target.value)} disabled={saving} required /></label>
          <label><strong>연결 버튼 문구 (선택)</strong><input value={ctaLabel} maxLength={36} placeholder="예: 과메기 만나보기" onChange={(event) => setCtaLabel(event.target.value)} disabled={saving} /></label>
          <label><strong>버튼 클릭 주소 (선택)</strong><input value={ctaHref} maxLength={300} placeholder="/products/상품주소" onChange={(event) => setCtaHref(event.target.value)} disabled={saving} /></label>
        </div>
        <p>홍보 문구가 이미 포함된 완성형 이미지라면 위의 ‘사진 위에 문구 표시’를 해제하면 됩니다.</p>
      </section>

      <section className="admin-banner-section" aria-labelledby="banner-preview-title">
        <h2 id="banner-preview-title"><b>2</b> 미리보기</h2>
        <div className="admin-banner-preview-tabs" role="group" aria-label="미리보기 화면 선택">
          <button type="button" className={previewDevice === "desktop" ? "selected" : ""} onClick={() => setPreviewDevice("desktop")}>PC 미리보기</button>
          <button type="button" className={previewDevice === "mobile" ? "selected" : ""} onClick={() => setPreviewDevice("mobile")}>모바일 미리보기</button>
        </div>
        <div className={previewDevice === "mobile" ? "admin-banner-preview mobile" : "admin-banner-preview desktop"}>
          {/* Native img supports temporary blob: URLs before upload. */}
          <img src={previewUrl} alt={imageAlt || "메인 배너 미리보기"} />
          {showText && <div className="admin-banner-preview-copy">
            {eyebrow && <small>{eyebrow}</small>}
            <strong>{headline}</strong>
            {description && <p>{description}</p>}
            {ctaLabel && ctaHref && <span className="admin-banner-preview-cta">{ctaLabel}</span>}
          </div>}
        </div>
        <small className="admin-banner-preview-note">위 화면은 간이 미리보기입니다. 실제 홈페이지의 글자 크기와 사진 잘림은 화면 너비에 따라 달라질 수 있습니다.</small>
      </section>

      <section className="admin-banner-section admin-banner-apply" aria-labelledby="banner-apply-title">
        <h2 id="banner-apply-title"><b>3</b> 홈페이지에 적용</h2>
        <p>버튼을 누른 뒤에만 실제 홈페이지 이미지와 문구가 변경됩니다.</p>
        {errorMessage && <p className="admin-banner-feedback error" role="alert">{errorMessage}</p>}
        {status && <p className="admin-banner-feedback success" role="status">{status}</p>}
        <div className="admin-banner-actions">
          <button className="admin-ui-button md" type="submit" disabled={saving}>
            {saving ? "이미지 업로드 · 적용 중..." : "메인 배너 적용하기"}
          </button>
          <a className="admin-ui-button outline md" href="/" target="_blank" rel="noreferrer">홈페이지 확인</a>
        </div>
        {current.updatedAt && <small>마지막 적용: {new Date(current.updatedAt).toLocaleString("ko-KR")}</small>}
      </section>
    </form>
  );
}
