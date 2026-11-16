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
const MAX_METADATA_BYTES = 16 * 1024;
// Files go directly from the browser to Supabase Storage. This endpoint
// receives only small JSON metadata, keeping uploads below the Vercel
// Function request-body limit.
const IMAGE_PATH = /^home-hero\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

type BannerRequest = {
  desktop_image_path?: unknown;
  mobile_image_path?: unknown;
  clear_mobile?: unknown;
  show_text?: unknown;
  image_alt?: unknown;
  eyebrow?: unknown;
  headline?: unknown;
  description?: unknown;
  cta_label?: unknown;
  cta_href?: unknown;
};

function readText(data: BannerRequest, key: keyof BannerRequest, label: string, maxLength: number, allowEmpty = false) {
  const raw = data[key];
  if (typeof raw !== "string") throw new Error(label + " 값을 확인해주세요.");
  const value = raw.trim();
  if ((!allowEmpty && !value) || value.length > maxLength) {
    throw new Error(label + "을(를) 확인해주세요. 최대 " + maxLength + "자입니다.");
  }
  return value;
}

async function verifyUploadedImage(supabase: ReturnType<typeof createAdminClient>, value: unknown, label: string) {
  if (value == null) return null;
  if (typeof value !== "string" || !IMAGE_PATH.test(value)) {
    throw new Error(label + " 경로가 유효하지 않습니다.");
  }

  const { data, error } = await supabase.storage.from(BUCKET).info(value);
  if (error || !data) throw new Error(label + " 업로드 파일을 확인할 수 없습니다. 이미지를 다시 선택해주세요.");
  if (!Number.isFinite(data.size) || data.size <= 0 || data.size > MAX_IMAGE_BYTES) {
    throw new Error(label + " 파일은 6MB 이하로 등록해주세요.");
  }

  const ext = value.split(".").pop();
  if (data.contentType && MIME_EXT[data.contentType] !== ext) {
    throw new Error(label + " 파일 형식이 올바르지 않습니다.");
  }
  return supabase.storage.from(BUCKET).getPublicUrl(value).data.publicUrl;
}

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  const limited = await enforceRateLimit(request, "adminUpload", { userId: admin.session.user.id });
  if (!limited.ok) return limited.response;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_METADATA_BYTES) {
    return NextResponse.json({ ok: false, message: "배너 설정 내용이 너무 큽니다." }, { status: 413 });
  }

  try {
    const data: BannerRequest = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("배너 요청 형식이 잘못되었습니다.");
    }
    const imageAlt = readText(data, "image_alt", "이미지 설명", 120);
    const eyebrow = readText(data, "eyebrow", "상단 문구", 80, true);
    const headline = readText(data, "headline", "제목", 70, true);
    const description = readText(data, "description", "소개 문구", 240, true);
    const ctaLabel = readText(data, "cta_label", "버튼 문구", 36, true);
    const ctaHref = readText(data, "cta_href", "연결 주소", 300, true);
    const showText = data.show_text !== false;

    if (showText && !headline) throw new Error("문구를 표시할 때는 메인 제목이 필요합니다.");
    if (ctaHref && sanitizeNextPath(ctaHref, "/") !== ctaHref) {
      throw new Error("연결 주소는 /products/상품주소처럼 사이트 내부 경로만 입력해주세요.");
    }
    if (ctaLabel && !ctaHref) throw new Error("버튼을 표시하려면 연결 주소를 입력해주세요.");
    if (!ctaLabel && ctaHref) throw new Error("연결 주소를 사용하려면 버튼 문구를 입력해주세요.");

    const supabase = createAdminClient();
    const current = await getHomeBanner();
    const desktopUploadedUrl = await verifyUploadedImage(supabase, data.desktop_image_path, "PC 메인사진");
    const mobileUploadedUrl = await verifyUploadedImage(supabase, data.mobile_image_path, "모바일 메인사진");

    const { error } = await supabase.from("site_banners").upsert({
      id: "home",
      desktop_image_url: desktopUploadedUrl ?? current.desktopImageUrl,
      mobile_image_url: mobileUploadedUrl ?? (data.clear_mobile === true ? null : current.mobileImageUrl),
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
    return NextResponse.json({ ok: true, banner: await getHomeBanner() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "배너 변경에 실패했습니다." },
      { status: 400 }
    );
  }
}
