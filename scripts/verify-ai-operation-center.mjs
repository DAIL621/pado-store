import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const adminLayout = read("components/admin/AdminLayout.tsx");
const aiPage = read("app/admin/ai/images/page.tsx");
const aiComponent = read("components/admin/AdminAiImageAnalyzer.tsx");
const aiEngine = read("lib/admin/ai-image-analysis.ts");
const productBuilder = read("components/admin/AdminProductBuilder.tsx");
const styles = read("app/globals.css");
const guide = fs.existsSync("AI_OPERATION_CENTER.md") ? read("AI_OPERATION_CENTER.md") : "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(adminLayout.includes("AI 운영센터"), "admin sidebar should expose AI operation center");
assert(adminLayout.includes("/admin/ai/images"), "admin AI image route should be linked");
assert(aiPage.includes("AdminAiImageAnalyzer"), "AI image page should render analyzer component");
assert(aiPage.includes("getAdminSession"), "AI image page should require admin session");
assert(aiComponent.includes("Drag & Drop"), "AI image analyzer should describe drag and drop");
assert(aiComponent.includes("multiple"), "AI image analyzer should allow multiple image upload");
assert(aiComponent.includes("분석 시작"), "AI image analyzer should expose analysis button");
assert(aiComponent.includes("moveDraft"), "AI image analyzer should support ordering");
assert(aiComponent.includes("removeDraft"), "AI image analyzer should support deletion");
assert(aiComponent.includes("convertImageAnalysisToDetailJson"), "AI image analyzer should preview detail_json conversion");
assert(aiComponent.includes("상품등록으로 보내기"), "AI image analyzer should send result to product registration");
assert(aiComponent.includes("localStorage.setItem"), "AI image analyzer should store analysis draft");
assert(aiComponent.includes("AI_IMAGE_ANALYSIS_DRAFT_KEY"), "AI image analyzer should use shared AI draft key");
assert(aiEngine.includes("AiImageAnalysisResult"), "AI image analysis data type is missing");
assert(aiEngine.includes("AiImageAnalysisDraft"), "AI image analysis draft type is missing");
assert(aiEngine.includes("suggestedRole"), "AI image analysis should include suggestedRole");
assert(aiEngine.includes("confidence"), "AI image analysis should include confidence");
assert(aiEngine.includes("recommendedSection"), "AI image analysis should include recommendedSection");
assert(aiEngine.includes("qualityScore"), "AI image analysis should include qualityScore");
assert(aiEngine.includes("warningMessage"), "AI image analysis should include warningMessage");
assert(aiEngine.includes("analyzeImageWithMockEngine"), "Mock image analysis engine is missing");
assert(aiEngine.includes("convertImageAnalysisToDetailJson"), "detail_json converter is missing");
assert(aiEngine.includes("ai-gallery"), "detail_json converter should preserve gallery/caption metadata");
assert(productBuilder.includes("AI_IMAGE_ANALYSIS_DRAFT_KEY"), "product registration should read AI image analysis draft");
assert(productBuilder.includes("AI 사진분석 결과를 불러왔습니다"), "product registration should show AI draft loaded message");
assert(productBuilder.includes("clearAiDraft"), "product registration should expose AI draft clear action");
assert(productBuilder.includes("createProductDetailFormValue"), "product registration should normalize AI detail_json draft");
assert(productBuilder.includes("extraSections"), "product registration should preserve AI extra sections");
["hero", "origin", "sizeComparison", "freshness", "package", "shipping", "cooking", "components", "detail", "unknown"].forEach((role) => {
  assert(aiEngine.includes(`"${role}"`), `AI image role missing: ${role}`);
});
assert(styles.includes(".admin-ai-page"), "AI operation center styles are missing");
assert(styles.includes(".admin-ai-draft-notice"), "AI draft loaded notice styles are missing");
assert(guide.includes("AI 사진분석"), "AI operation center guide should document image analysis");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "admin-ai-menu",
        "admin-ai-image-route",
        "admin-ai-auth-guard",
        "multi-image-upload-ui",
        "drag-drop-ui",
        "image-preview-delete-reorder",
        "mock-image-analysis-engine",
        "editable-analysis-result",
        "analysis-to-registration-draft",
        "admin-new-auto-ai-draft",
        "ai-draft-clear-action",
        "ai-gallery-extra-section",
        "detail-json-converter",
        "ai-operation-guide"
      ]
    },
    null,
    2
  )
);
