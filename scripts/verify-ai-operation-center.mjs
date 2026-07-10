import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const adminLayout = read("components/admin/AdminLayout.tsx");
const aiPage = read("app/admin/ai/images/page.tsx");
const aiComponent = read("components/admin/AdminAiImageAnalyzer.tsx");
const aiEngine = read("lib/admin/ai-image-analysis.ts");
const aiProvider = read("lib/admin/ai-image-analysis-provider.ts");
const aiRoute = read("app/api/admin/ai/images/analyze/route.ts");
const productBuilder = read("components/admin/AdminProductBuilder.tsx");
const styles = read("app/globals.css");
const guide = fs.existsSync("AI_OPERATION_CENTER.md") ? read("AI_OPERATION_CENTER.md") : "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(adminLayout.includes("/admin/ai/images"), "admin AI image route should be linked");
assert(aiPage.includes("AdminAiImageAnalyzer"), "AI image page should render analyzer component");
assert(aiPage.includes("getAdminSession"), "AI image page should require admin session");
assert(aiComponent.includes("handleDrop") && aiComponent.includes("dragOver"), "AI image analyzer should support drag and drop");
assert(aiComponent.includes("multiple"), "AI image analyzer should allow multiple image upload");
assert(aiComponent.includes("startAnalysis"), "AI image analyzer should expose analysis action");
assert(aiComponent.includes("moveDraft"), "AI image analyzer should support ordering");
assert(aiComponent.includes("removeDraft"), "AI image analyzer should support deletion");
assert(aiComponent.includes("fetch(\"/api/admin/ai/images/analyze\""), "AI image analyzer should call server analysis API");
assert(aiComponent.includes("providerInfo") && aiComponent.includes("providerLabel"), "AI image analyzer should display provider");
assert(aiComponent.includes("fallbackUsed"), "AI image analyzer should display fallback state");
assert(aiComponent.includes("reasoningSummary"), "AI image analyzer should display reasoning summary");
assert(aiComponent.includes("resultFilter"), "AI image analyzer should include result filters");
assert(aiComponent.includes("sortByAiRecommendation"), "AI image analyzer should include AI recommendation sorting");
assert(aiComponent.includes("summarizeAiImageAnalysis"), "AI image analyzer should show analysis summary");
assert(aiComponent.includes("heroCandidates"), "AI image analyzer should show hero candidates");
assert(aiComponent.includes("convertImageAnalysisToDetailJson"), "AI image analyzer should preview detail_json conversion");
assert(aiComponent.includes("sendToProductRegistration"), "AI image analyzer should send result to product registration");
assert(aiComponent.includes("localStorage.setItem"), "AI image analyzer should store analysis draft");
assert(aiComponent.includes("AI_IMAGE_ANALYSIS_DRAFT_KEY"), "AI image analyzer should use shared AI draft key");

assert(aiEngine.includes("AiImageAnalysisResult"), "AI image analysis data type is missing");
assert(aiEngine.includes("AiImageAnalysisDraft"), "AI image analysis draft type is missing");
assert(aiEngine.includes("suggestedRole"), "AI image analysis should include suggestedRole");
assert(aiEngine.includes("confidence"), "AI image analysis should include confidence");
assert(aiEngine.includes("recommendedSection"), "AI image analysis should include recommendedSection");
assert(aiEngine.includes("qualityScore"), "AI image analysis should include qualityScore");
assert(aiEngine.includes("warningMessage"), "AI image analysis should include warningMessage");
assert(aiEngine.includes("reasoningSummary"), "AI image analysis should include reasoningSummary");
assert(aiEngine.includes("qualityFactors"), "AI image analysis should include qualityFactors");
assert(aiEngine.includes("heroRank"), "AI image analysis should include heroRank");
assert(aiEngine.includes("analyzeImageWithMockEngine"), "Mock image analysis engine is missing");
assert(aiEngine.includes("convertImageAnalysisToDetailJson"), "detail_json converter is missing");
assert(aiEngine.includes("ai-gallery"), "detail_json converter should preserve gallery/caption metadata");
assert(aiEngine.includes("ai-faq-draft"), "detail_json converter should create FAQ draft");
assert(aiEngine.includes("ai-seo-draft"), "detail_json converter should create SEO draft");
assert(aiEngine.includes("ai-quality-summary"), "detail_json converter should create quality summary");

assert(aiProvider.includes("AiImageAnalysisProvider"), "AI image provider interface is missing");
assert(aiProvider.includes("OpenAiVisionImageAnalysisProvider"), "OpenAI Vision provider is missing");
assert(aiProvider.includes("PADO_AI_IMAGE_PROVIDER"), "AI provider env var is missing");
assert(aiProvider.includes("OPENAI_API_KEY"), "OpenAI API key env var is missing");
assert(aiProvider.includes("PADO_AI_IMAGE_MODEL"), "OpenAI model env var is missing");
assert(aiProvider.includes("chat/completions"), "OpenAI Vision API call is missing");
assert(aiProvider.includes("categoryGuide"), "OpenAI Vision prompt should include product-group criteria");
assert(aiProvider.includes("qualityFactors"), "OpenAI Vision prompt should request qualityFactors");
assert(aiProvider.includes("fallbackUsed"), "provider fallback response is missing");
assert(aiProvider.includes("analyzeImagesWithSelectedProvider"), "provider selector function is missing");
assert(aiProvider.includes("getAiRolePromptList"), "provider should use the standard role dictionary");
assert(aiProvider.includes("getAiSectionPromptList"), "provider should use the standard section dictionary");
assert(aiProvider.includes("normalizeAiRole"), "provider should validate roles against dictionary");
assert(aiProvider.includes("normalizeAiSection"), "provider should validate sections against dictionary");

assert(aiRoute.includes("requireAdminApi"), "AI analysis API should require admin authorization");
assert(aiRoute.includes("analyzeImagesWithSelectedProvider"), "AI analysis API should use provider selector");
assert(aiRoute.includes("results"), "AI analysis API should return results");
assert(aiRoute.includes("provider"), "AI analysis API should return provider");
assert(aiRoute.includes("fallbackUsed"), "AI analysis API should return fallbackUsed");

assert(productBuilder.includes("AI_IMAGE_ANALYSIS_DRAFT_KEY"), "product registration should read AI image analysis draft");
assert(productBuilder.includes("clearAiDraft"), "product registration should expose AI draft clear action");
assert(productBuilder.includes("createProductDetailFormValue"), "product registration should normalize AI detail_json draft");
assert(productBuilder.includes("extraSections"), "product registration should preserve AI extra sections");

["hero", "origin", "sizeComparison", "freshness", "package", "shipping", "cooking", "components", "process", "review", "detail", "unknown"].forEach((role) => {
  assert(aiEngine.includes(`"${role}"`), `AI image role missing: ${role}`);
});
["sharpness", "brightness", "composition", "productFocus", "backgroundCleanliness", "usability", "heroSuitability", "trustSignal"].forEach((factor) => {
  assert(aiEngine.includes(factor), `AI quality factor missing: ${factor}`);
});

assert(styles.includes(".admin-ai-page"), "AI operation center styles are missing");
assert(styles.includes(".admin-ai-draft-notice"), "AI draft loaded notice styles are missing");
assert(styles.includes(".admin-ai-provider-badge"), "AI provider badge styles are missing");
assert(styles.includes(".admin-ai-reasoning"), "AI reasoning styles are missing");
assert(guide.includes("AI"), "AI operation center guide should document image analysis");

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
        "server-provider-api",
        "openai-vision-provider",
        "standard-role-section-dictionary",
        "quality-factor-scoring",
        "hero-ranking",
        "operator-summary-filters",
        "mock-fallback-provider",
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
