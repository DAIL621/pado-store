import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomeBanner } from "@/lib/site/home-banner";

export const runtime = "nodejs";

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_REQUEST_BYTES = 2 * MAX_IMAGE_BYTES + 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function requiredText(form: FormData, key: string, label: string, maxLength: number, allowEmpty = false) {
  const value = String(form.get(key) ?? "").trim();
  if ((!allowEmpty && !value) || value.length > maxLength) {
    throw new Error(label + "을(를) 확인해주세요. 최대 " + maxLength + "자입니다.");
  }
  return value;
}

function asImage(value: FormDataEntryValue | null, label: string): File | null {
  if (value == null) return null;
  if (!(value instanceof File) || !value.size) throw new Error(label + " 파일을 선택해주세요.");
  if (!MIME_EXT[value.type]) throw new Error(label + ": JPG, PNG, WebP만 업로드할 수 있습니다.");
  if (value.size > MAX_IMAGE_BYTES) throw new Error(label + ": 이미지 크기는 6MB 이하로 제한됩니다.");
  return value;
}

async function storeImage(supabase: ReturnType<typeof createAdminClient>, file: File, uploadedPaths: string[]) {
  const path = "home-hero/" + Date.now() + "-" + randomUUID() + "." + MIME_EXT[file.type];
  const { error } = await supabase.storage.from(BUCKET).upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type, cacheControl: "31536000", upsert: false }
  );
  if (error) throw new Error("이미지 저장 실패: " + error.message);
  uploadedPaths.push(path);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const limited = await enforceRateLimit(request, "adminUpload", { userId: admin.session.user.id });
  if (!limited.ok) return limited.response;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, message: "이미지 합계 용량이 너무 큽니다." }, { status: 413 });
  }

  let uploadedPaths: string[] = [];
  const supabase = createAdminClient();

  try {
    const form = await request.formData();
    const desktopFile = asImage(form.get("desktop_image"), "PC 메인사진");
    const mobileFile = asImage(form.get("mobile_image"), "모바일 메인사진");
    const current = await getHomeBanner();
    const imageAlt = requiredText(form, "image_alt", "이미지 설명", 120);
    const eyebrow = requiredText(form, "eyebrow", "상단 문구", 80, true);
    const headline = requiredText(form, "headline", "제목", 70, true);
    const description = requiredText(form, "description", "소개 문구", 240, true);
    const ctaLabel = requiredText(form, "cta_label", "버튼 문구", 36, true);
    const ctaHref = requiredText(form, "cta_href", "연결 주소", 300, true);
    const showText = form.get("show_text") !== "false";

    if (showText && !headline) throw new Error("문구를 표시할 때는 메인 제목이 필요합니다.");
    if (ctaHref && sanitizeNextPath(ctaHref, "/") !== ctaHref) {
      throw new Error("연결 주소는 /products/상품주소처럼 사이트 내부 경로만 입력해주세요.");
    }
    if (ctaLabel && !ctaHref) throw new Error("버튼을 표시하려면 연결 주소도 입력해주세요.");
    if (!ctaLabel && ctaHref) throw new Error("연결 주소를 사용하려면 버튼 문구를 입력해주세요.");

    const desktopImageUrl = desktopFile
      ? await storeImage(supabase, desktopFile, uploadedPaths)
      : current.desktopImageUrl;
    const mobileImageUrl = mobileFile
      ? await storeImage(supabase, mobileFile, uploadedPaths)
      : form.get("clear_mobile") === "true" ? null : current.mobileImageUrl;

    const { error } = await supabase.from("site_banners").upsert({
      id: "home",
      desktop_image_url: desktopImageUrl,
      mobile_image_url: mobileImageUrl,
      image_alt: imageAlt,
      eyebrow,
      headline,
      description,
      show_text: showText,
      cta_label: ctaLabel,
      cta_href: ctaHref,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

    if (error) throw new Error("배너 적용 실패: " + error.message);

    uploadedPaths = [];
    const banner = await getHomeBanner();
    return NextResponse.json({ ok: true, banner });
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(BUCKET).remove(uploadedPaths).catch(() => undefined);
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "배너 변경에 실패했습니다." },
      { status: 400 }
    );
  }
}
