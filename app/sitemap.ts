import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { CATEGORY_PAGES } from "@/lib/products/categories";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pado-story.vercel.app";

function productUrl(slug: string) {
  return `${siteUrl}/products/${encodeURIComponent(slug)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORY_PAGES.map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82
    })),
    ...products.map((product) => ({
      url: productUrl(product.slug),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
