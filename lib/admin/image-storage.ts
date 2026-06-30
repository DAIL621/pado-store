import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminImageUploadResult = {
  url: string;
  storage: "local" | "supabase";
};

export const allowedAdminImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const maxAdminImageSize = 5 * 1024 * 1024;

export function createUploadFilename(originalName: string) {
  const extension = originalName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

export async function uploadAdminProductImage(file: File): Promise<AdminImageUploadResult> {
  const filename = createUploadFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.PADO_PRODUCT_IMAGE_STORAGE === "supabase") {
    const bucket = process.env.SUPABASE_PRODUCT_IMAGE_BUCKET;
    if (!bucket) {
      throw new Error("SUPABASE_PRODUCT_IMAGE_BUCKET 환경변수가 필요합니다.");
    }
    return uploadToSupabaseStorage(bucket, filename, bytes, file.type);
  }

  return uploadToLocalPublic(filename, bytes);
}

async function uploadToLocalPublic(filename: string, bytes: Buffer): Promise<AdminImageUploadResult> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  const uploadPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, bytes);

  return {
    url: `/uploads/products/${filename}`,
    storage: "local"
  };
}

async function uploadToSupabaseStorage(bucket: string, filename: string, bytes: Buffer, contentType: string): Promise<AdminImageUploadResult> {
  const client = createAdminClient();
  const objectPath = `products/${filename}`;
  const { error } = await client.storage.from(bucket).upload(objectPath, bytes, {
    contentType,
    upsert: false
  });

  if (error) {
    throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return {
    url: data.publicUrl,
    storage: "supabase"
  };
}
