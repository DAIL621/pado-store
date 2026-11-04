const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
    }
    return url.origin;
  }
  // Next.js builds use NODE_ENV=production even for Vercel Preview deployments.
  // Keep production strict, but allow Preview metadata to use the canonical shop URL.
  const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
  if (isPreview) {
    return "https://www.padostory.com";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }
  return LOCAL_SITE_URL;
}
