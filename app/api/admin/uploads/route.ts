import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import {
  allowedAdminImageTypes,
  allowedAdminVideoTypes,
  maxAdminVideoSize,
  uploadAdminProductImage
} from "@/lib/admin/image-storage";
import {
  getAdminUploadLimit,
  MAX_PRODUCT_VIDEO_SIZE,
  type AdminUploadPurpose
} from "@/lib/admin/upload-limits";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_MULTIPART_REQUEST_SIZE = MAX_PRODUCT_VIDEO_SIZE + 2 * 1024 * 1024;

export async function POST(request: Request) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  const limited = await enforceRateLimit(request, "adminUpload", { userId: admin.session.user.id });
  if (!limited.ok) return limited.response;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_MULTIPART_REQUEST_SIZE) {
    return NextResponse.json({ ok: false, message: "업로드 요청 용량이 서버 제한을 초과했습니다." }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const rawPurpose = String(formData.get("purpose") || "product");
  const purpose: AdminUploadPurpose = ["product", "legacy-detail", "video-thumbnail", "video"].includes(rawPurpose)
    ? rawPurpose as AdminUploadPurpose
    : "product";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "업로드할 이미지 또는 동영상 파일을 선택해주세요." }, { status: 400 });
  }

  const isImage = allowedAdminImageTypes.has(file.type);
  const isVideo = allowedAdminVideoTypes.has(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { ok: false, message: "jpg, png, webp, gif 이미지 또는 mp4, webm 동영상만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }

  const imageLimit = getAdminUploadLimit(purpose);
  if (isImage && file.size > imageLimit) {
    const message = purpose === "legacy-detail"
      ? "상세페이지 이미지는 파일당 최대 20MB까지 업로드할 수 있습니다."
      : purpose === "video-thumbnail"
        ? "동영상 썸네일은 파일당 최대 10MB까지 업로드할 수 있습니다."
        : "일반 상품 이미지는 파일당 최대 5MB까지 업로드할 수 있습니다.";
    return NextResponse.json({ ok: false, message }, { status: 413 });
  }

  if (isVideo && file.size > maxAdminVideoSize) {
    return NextResponse.json({ ok: false, message: "동영상은 80MB 이하 mp4 또는 webm 파일로 업로드해주세요." }, { status: 400 });
  }

  try {
    const uploaded = await uploadAdminProductImage(file);

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      storage: uploaded.storage,
      size: file.size,
      type: file.type,
      mediaType: isVideo ? "video" : "image",
      purpose,
      maxSize: isVideo ? maxAdminVideoSize : imageLimit
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "파일 업로드에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
