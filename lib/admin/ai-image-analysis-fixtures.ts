import type { AiImageAnalysisInput, AiImageRole } from "@/lib/admin/ai-image-analysis";

export type AiImageAnalysisFixture = AiImageAnalysisInput & {
  expectedRole: AiImageRole;
  minQualityScore?: number;
  shouldWarn?: boolean;
};

const fixtureImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#0a7f83"/><circle cx="320" cy="210" r="110" fill="#ffffff"/><text x="130" y="390" fill="white" font-size="34" font-family="Arial">PADO FIXTURE</text></svg>`
  );

export const AI_IMAGE_ANALYSIS_FIXTURES: AiImageAnalysisFixture[] = [
  {
    imageUrl: fixtureImage,
    originalName: "wando-abalone-main-clean-hero.jpg",
    index: 0,
    category: "abalone",
    expectedRole: "hero",
    minQualityScore: 80
  },
  {
    imageUrl: fixtureImage,
    originalName: "abalone-hand-size-compare.jpg",
    index: 1,
    category: "abalone",
    expectedRole: "sizeComparison",
    minQualityScore: 70
  },
  {
    imageUrl: fixtureImage,
    originalName: "abalone-porridge-cooking-recipe.jpg",
    index: 2,
    category: "abalone",
    expectedRole: "cooking",
    minQualityScore: 70
  },
  {
    imageUrl: fixtureImage,
    originalName: "icepack-cold-shipping-box.jpg",
    index: 3,
    category: "seafood",
    expectedRole: "shipping",
    minQualityScore: 70
  },
  {
    imageUrl: fixtureImage,
    originalName: "vacuum-package-pouch-bag.jpg",
    index: 4,
    category: "seafood",
    expectedRole: "package",
    minQualityScore: 70
  },
  {
    imageUrl: fixtureImage,
    originalName: "sorting-workshop-process-cleaning.jpg",
    index: 5,
    category: "seafood",
    expectedRole: "process",
    minQualityScore: 65
  },
  {
    imageUrl: fixtureImage,
    originalName: "blurry-dark-background-detail.jpg",
    index: 6,
    category: "seafood",
    expectedRole: "detail",
    shouldWarn: true
  },
  {
    imageUrl: fixtureImage,
    originalName: "random-unrelated-photo.jpg",
    index: 7,
    category: "seafood",
    expectedRole: "detail",
    minQualityScore: 50
  }
];
