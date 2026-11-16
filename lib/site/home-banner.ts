import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export type HomeBanner = {
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  description: string;
  showText: boolean;
  ctaLabel: string;
  ctaHref: string;
  updatedAt: string | null;
};

export const DEFAULT_HOME_BANNER: HomeBanner = {
  desktopImageUrl: "/images/story/reference-fishing-boat-hero-v2.png",
  mobileImageUrl: null,
  imageAlt: "거제도 푸른 바다를 달리는 실제 어선",
  eyebrow: "PADO STORY · FROM THE COAST",
  headline: "산지 직송 상품",
  description: "파도스토리는 산지에서 직접 확인하고\n선별한 신선한 수산물만을 전해드립니다.",
  showText: true,
  ctaLabel: "",
  ctaHref: "",
  updatedAt: null
};

export async function getHomeBanner(): Promise<HomeBanner> {
  if (!hasSupabaseAdminEnv()) return DEFAULT_HOME_BANNER;

  try {
    const { data, error } = await createAdminClient()
      .from("site_banners")
      .select("desktop_image_url,mobile_image_url,image_alt,eyebrow,headline,description,show_text,cta_label,cta_href,updated_at")
      .eq("id", "home")
      .maybeSingle();

    if (error || !data) return DEFAULT_HOME_BANNER;
    return {
      desktopImageUrl: data.desktop_image_url || DEFAULT_HOME_BANNER.desktopImageUrl,
      mobileImageUrl: data.mobile_image_url || null,
      imageAlt: data.image_alt || DEFAULT_HOME_BANNER.imageAlt,
      eyebrow: data.eyebrow ?? DEFAULT_HOME_BANNER.eyebrow,
      headline: data.headline ?? DEFAULT_HOME_BANNER.headline,
      description: data.description ?? DEFAULT_HOME_BANNER.description,
      showText: data.show_text !== false,
      ctaLabel: data.cta_label || "",
      ctaHref: data.cta_href || "",
      updatedAt: data.updated_at || null
    };
  } catch {
    // Keep the storefront functional if an environment is missing its migration.
    return DEFAULT_HOME_BANNER;
  }
}
