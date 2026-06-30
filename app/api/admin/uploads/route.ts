import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { allowedAdminImageTypes, maxAdminImageSize, uploadAdminProductImage } from "@/lib/admin/image-storage";

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "업로드할 이미지 파일을 선택해주세요." }, { status: 400 });
  }

  if (!allowedAdminImageTypes.has(file.type)) {
    return NextResponse.json({ ok: false, message: "jpg, png, webp, gif 이미지만 업로드할 수 있습니다." }, { status: 400 });
  }

  if (file.size > maxAdminImageSize) {
    return NextResponse.json({ ok: false, message: "이미지는 5MB 이하로 업로드해주세요." }, { status: 400 });
  }

  try {
    const uploaded = await uploadAdminProductImage(file);

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      storage: uploaded.storage,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "이미지 업로드에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
