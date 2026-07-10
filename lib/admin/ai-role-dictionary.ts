import type { AiImageRole } from "@/lib/admin/ai-image-analysis";

export type StandardAiRoleEntry = {
  value: AiImageRole;
  label: string;
  aliases: string[];
};

export const STANDARD_AI_ROLE_DICTIONARY: StandardAiRoleEntry[] = [
  { value: "hero", label: "대표사진", aliases: ["대표사진", "메인사진", "대표 이미지", "hero", "main", "cover"] },
  { value: "freshness", label: "신선도/질감", aliases: ["신선도", "질감", "신선한 상태", "전복 상태", "freshness", "texture", "detail texture"] },
  { value: "cooking", label: "조리 예시", aliases: ["조리사진", "먹는방법", "요리", "레시피", "cooking", "recipe", "dish", "grill", "porridge"] },
  { value: "components", label: "구성품", aliases: ["구성", "구성품", "내용물", "components", "set", "inside"] },
  { value: "shipping", label: "포장/배송", aliases: ["포장", "배송", "배송사진", "아이스팩", "박스", "package", "shipping", "delivery", "icepack", "box"] },
  { value: "process", label: "선별 과정", aliases: ["선별", "작업", "공정", "손질 공정", "process", "sorting", "workshop"] },
  { value: "detail", label: "손질 방법", aliases: ["손질", "손질 방법", "손질사진", "cleaning", "trim", "prepare"] },
  { value: "sizeComparison", label: "크기 비교", aliases: ["크기", "크기 비교", "손에 든", "비교", "size", "compare", "hand", "ruler"] },
  { value: "origin", label: "브랜드", aliases: ["브랜드", "산지 이야기", "생산자", "현장", "origin", "brand", "producer"] },
  { value: "unknown", label: "기타", aliases: ["기타", "알 수 없음", "확인 필요", "unknown", "other"] }
];

const ROLE_BY_VALUE = new Map(STANDARD_AI_ROLE_DICTIONARY.map((entry) => [entry.value, entry]));

function compact(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function getStandardAiRoleLabel(role: AiImageRole | "gallery") {
  if (role === "gallery") return "상세 갤러리";
  if (role === "package") return "포장/배송";
  if (role === "review") return "기타";
  return ROLE_BY_VALUE.get(role)?.label ?? "기타";
}

export function normalizeAiRole(value: unknown): AiImageRole {
  const target = compact(value);
  for (const entry of STANDARD_AI_ROLE_DICTIONARY) {
    if (compact(entry.value) === target || compact(entry.label) === target || entry.aliases.some((alias) => compact(alias) === target)) {
      return entry.value;
    }
  }
  return "unknown";
}

export function getAiRolePromptList() {
  return STANDARD_AI_ROLE_DICTIONARY.map((entry) => `- ${entry.value}: ${entry.label}`).join("\n");
}
