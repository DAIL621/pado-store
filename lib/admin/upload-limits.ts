export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_LEGACY_DETAIL_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_THUMBNAIL_SIZE = 10 * 1024 * 1024;
export const MAX_PRODUCT_VIDEO_SIZE = 80 * 1024 * 1024;

export type AdminUploadPurpose = "product" | "legacy-detail" | "video-thumbnail" | "video";

export function getAdminUploadLimit(purpose: AdminUploadPurpose) {
  if (purpose === "legacy-detail") return MAX_LEGACY_DETAIL_IMAGE_SIZE;
  if (purpose === "video-thumbnail") return MAX_VIDEO_THUMBNAIL_SIZE;
  if (purpose === "video") return MAX_PRODUCT_VIDEO_SIZE;
  return MAX_PRODUCT_IMAGE_SIZE;
}

export function formatUploadSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
