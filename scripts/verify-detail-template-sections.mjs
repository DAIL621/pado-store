const fullDetail = {
  schemaVersion: 1,
  heroImages: [{ label: "대표사진", url: "/images/products/wando-abalone.webp", description: "대표 이미지" }],
  benefits: ["산지 선별", "신선 포장", "당일 출고"],
  journey: [{ key: "origin", title: "산지", image: "", description: "산지에서 준비합니다." }],
  packaging: ["아이스팩 동봉", "냉장 포장"],
  recipes: [{ title: "구이", description: "노릇하게 구워 드세요.", image: "" }],
  components: ["본품", "아이스팩"],
  faq: [{ question: "언제 출고되나요?", answer: "평일 오후 1시 이전 당일 출고됩니다." }],
  videos: [{ title: "상품 영상", url: "https://example.com/video" }],
  certificates: [{ title: "인증서", image: "/images/products/wando-abalone.webp" }],
  extraSections: [{ type: "notice", title: "추가 안내" }]
};

function visibleSections(detail = {}) {
  return {
    heroImages: (detail.heroImages ?? []).filter((image) => image.url),
    benefits: (detail.benefits ?? []).filter(Boolean),
    journey: (detail.journey ?? []).filter((step) => step.description || step.image),
    packaging: (detail.packaging ?? []).filter(Boolean),
    recipes: (detail.recipes ?? []).filter((recipe) => recipe.title || recipe.description || recipe.image),
    components: (detail.components ?? []).filter(Boolean),
    faq: (detail.faq ?? []).filter((item) => item.question || item.answer),
    videos: (detail.videos ?? []).filter((video) => video.title || video.url),
    certificates: (detail.certificates ?? []).filter((certificate) => certificate.title || certificate.image),
    extraSections: (detail.extraSections ?? []).filter((section) => section.title || section.type)
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const empty = visibleSections({});
assert(Object.values(empty).every((items) => items.length === 0), "empty detail should hide every optional section");

const partial = visibleSections({ benefits: ["산지 선별"], heroImages: [{ label: "빈 사진", url: "" }] });
assert(partial.benefits.length === 1, "partial benefits should be visible");
assert(partial.heroImages.length === 0, "empty image url should be hidden");

const full = visibleSections(fullDetail);
assert(Object.values(full).every((items) => items.length > 0), "full detail should expose every master template section");

console.log(JSON.stringify({ ok: true, emptyHidden: true, partialVisible: true, fullVisible: true }, null, 2));
