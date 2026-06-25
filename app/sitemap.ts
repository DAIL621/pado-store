import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pado-story.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
