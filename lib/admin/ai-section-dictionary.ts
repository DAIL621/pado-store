import type { AiImageRecommendedSection } from "@/lib/admin/ai-image-analysis";

export type StandardAiSectionEntry = {
  value: AiImageRecommendedSection;
  label: string;
  aliases: string[];
};

export const STANDARD_AI_SECTION_DICTIONARY: StandardAiSectionEntry[] = [
  { value: "heroImages", label: "대표사진 영역", aliases: ["대표사진 영역", "대표사진", "hero", "heroImages"] },
  { value: "gallery", label: "상세 갤러리", aliases: ["상세 갤러리", "갤러리", "gallery"] },
  { value: "gallery", label: "상품 특징", aliases: ["상품 특징", "특징", "benefit", "feature"] },
  { value: "recipes", label: "먹는 방법", aliases: ["먹는 방법", "먹는법", "how to eat", "serving"] },
  { value: "recipes", label: "조리법", aliases: ["조리법", "레시피", "recipe", "cooking"] },
  { value: "packaging", label: "포장/배송 안내", aliases: ["포장/배송 안내", "포장", "배송", "packaging", "shipping"] },
  { value: "components", label: "상품 구성", aliases: ["상품 구성", "구성품", "components"] },
  { value: "process", label: "선별 과정", aliases: ["선별 과정", "공정", "process", "sorting"] },
  { value: "journey", label: "브랜드 소개", aliases: ["브랜드 소개", "산지", "브랜드", "journey", "origin"] },
  { value: "extraSections", label: "기타", aliases: ["기타", "확인 필요", "unknown", "other", "extraSections"] }
];

const SECTION_BY_VALUE = new Map<AiImageRecommendedSection, StandardAiSectionEntry>();
for (const entry of STANDARD_AI_SECTION_DICTIONARY) {
  if (!SECTION_BY_VALUE.has(entry.value)) SECTION_BY_VALUE.set(entry.value, entry);
}

function compact(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function getStandardAiSectionLabel(section: AiImageRecommendedSection) {
  return SECTION_BY_VALUE.get(section)?.label ?? "기타";
}

export function normalizeAiSection(value: unknown): AiImageRecommendedSection {
  const target = compact(value);
  for (const entry of STANDARD_AI_SECTION_DICTIONARY) {
    if (compact(entry.value) === target || compact(entry.label) === target || entry.aliases.some((alias) => compact(alias) === target)) {
      return entry.value;
    }
  }
  return "extraSections";
}

export function getAiSectionPromptList() {
  return STANDARD_AI_SECTION_DICTIONARY.map((entry) => `- ${entry.value}: ${entry.label}`).join("\n");
}
