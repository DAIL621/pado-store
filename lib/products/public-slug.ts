export function isPublicProductSlug(slug: string) {
  const normalized = slug.toLowerCase();
  return !normalized.startsWith("ops-") && !normalized.includes("test");
}
