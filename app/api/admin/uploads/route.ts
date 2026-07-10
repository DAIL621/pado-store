import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import {
  allowedAdminImageTypes,
  allowedAdminVideoTypes,
  maxAdminImageSize,
  maxAdminVideoSize,
  uploadAdminProductImage
} from "@/lib/admin/image-storage";

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const formData = await request.formData();
  const file = formData.get("file");

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

  if (isImage && file.size > maxAdminImageSize) {
    return NextResponse.json({ ok: false, message: "이미지는 5MB 이하로 업로드해주세요." }, { status: 400 });
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
      mediaType: isVideo ? "video" : "image"
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
