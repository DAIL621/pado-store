export function isPublicProductSlug(slug: string) {
  const normalized = slug.toLowerCase();
  const isGeneratedTestDetailSlug = /-test-\d{8}-\d{4,6}$/.test(normalized);
  return !normalized.startsWith("ops-") && (isGeneratedTestDetailSlug || !normalized.includes("test"));
}
