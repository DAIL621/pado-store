import type { ProductDetail } from "@/lib/products/detail";

export function getVisibleProductDetailSections(detail?: ProductDetail) {
  return {
    heroImages: detail?.heroImages.filter((image) => image.url) ?? [],
    benefits: detail?.benefits.filter(Boolean) ?? [],
    journey: detail?.journey.filter((step) => step.description || step.image) ?? [],
    packaging: detail?.packaging.filter(Boolean) ?? [],
    recipes: detail?.recipes.filter((recipe) => recipe.title || recipe.description || recipe.image) ?? [],
    components: detail?.components.filter(Boolean) ?? [],
    faq: detail?.faq.filter((item) => item.question || item.answer) ?? [],
    videos: detail?.videos.filter((video) => video.title || video.url) ?? [],
    certificates: detail?.certificates.filter((certificate) => certificate.title || certificate.image) ?? [],
    extraSections: detail?.extraSections.filter((section) => section.title || section.type) ?? []
  };
}

export function hasVisibleProductDetailContent(sections: ReturnType<typeof getVisibleProductDetailSections>) {
  return Object.values(sections).some((items) => items.length > 0);
}
