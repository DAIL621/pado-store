export function isPublicProductSlug(slug: string) {
  const normalized = slug.toLowerCase();
  return !/(^ops-|test|verification|diagnose|debug|e2e|duplicate|stock-check|admin-edit|detail-auto|legacy-detail|private-detail)/i.test(normalized);
}
