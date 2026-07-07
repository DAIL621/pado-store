# PADO STORY AI Operation Center

Last updated: 2026-07-06

## Purpose

AI 운영센터는 파도스토리 관리자 안에서 상품 운영자가 사진, 문구, SEO, 상세페이지 생성 작업을 더 빠르게 준비하기 위한 운영 도구입니다.

이번 v1 범위는 `AI 사진분석`입니다. 실제 AI API 연결 전에도 파일명, 업로드 순서, 상품 카테고리를 기준으로 Mock 분석을 수행하여 상세페이지 생성에 필요한 사진 역할을 정리합니다.

## Admin Route

- `/admin/ai/images`

관리자 로그인 후 접근 가능합니다.

## Menu Structure

관리자 사이드바:

- AI 운영센터

향후 하위 기능:

- AI 상품등록
- AI 사진분석
- AI 상세페이지 생성
- AI SEO 생성
- AI 콘텐츠 생성

현재 구현:

- AI 사진분석

## Image Analysis Data Structure

Each uploaded image can be represented as:

```ts
type AiImageAnalysisResult = {
  imageUrl: string;
  originalName: string;
  suggestedRole:
    | "hero"
    | "origin"
    | "sizeComparison"
    | "freshness"
    | "package"
    | "shipping"
    | "cooking"
    | "components"
    | "detail"
    | "unknown";
  confidence: number;
  title: string;
  description: string;
  recommendedSection:
    | "heroImages"
    | "journey"
    | "gallery"
    | "packaging"
    | "recipes"
    | "components"
    | "extraSections";
  qualityScore: number;
  warningMessage: string;
};
```

## Mock Analysis Rules

The first engine is implemented in:

- `lib/admin/ai-image-analysis.ts`

Inputs:

- File name
- Upload order
- Selected product category

Examples:

- First image with unclear filename -> `hero`
- `box`, `package`, `ice`, `포장` -> `package`
- `delivery`, `ship`, `택배` -> `shipping`
- `cook`, `recipe`, `구이`, `요리` -> `cooking`
- `size`, `compare`, `hand`, `크기` -> `sizeComparison`
- `fresh`, `live`, `선도`, `신선` -> `freshness`

## Detail Page Connection

The converter is prepared:

- `convertImageAnalysisToDetailJson(results)`

Current mapping:

- `hero` -> `detail_json.heroImages`
- `origin` -> `detail_json.journey`
- `package`, `shipping` -> `detail_json.packaging`
- `cooking` -> `detail_json.recipes`
- `components` -> `detail_json.components`
- all results -> `detail_json.extraSections`

The current v1 screen previews the converted JSON. Saving into product detail data will be handled in the next phase.

## v2 Product Registration Draft Flow

The AI image analysis result can now be sent into product registration.

Flow:

1. Open `/admin/ai/images`.
2. Upload images.
3. Run analysis.
4. Click `상품등록으로 보내기`.
5. The browser stores an AI draft in `localStorage`.
6. `/admin/new` opens and automatically imports the AI draft.
7. The product registration screen shows `AI 사진분석 결과를 불러왔습니다.`
8. Admin can edit every imported field before saving.
9. Admin can clear the AI draft with `AI draft 초기화`.

Storage key:

```ts
AI_IMAGE_ANALYSIS_DRAFT_KEY = "pado-ai-image-analysis-draft";
```

Imported fields:

- Representative images
- Packaging
- Recipes
- Components
- Extra sections
- Image titles/descriptions/captions through `ai-gallery` metadata

Verification:

```bash
pnpm run verify:ai-draft-flow
```

## Future AI Provider Plan

Mock engine can later be replaced by:

- OpenAI Vision
- Supabase Edge Function
- Internal image classifier

Recommended interface:

```ts
type AiImageAnalyzerProvider = {
  analyzeImages(input: AiImageAnalysisInput[]): Promise<AiImageAnalysisResult[]>;
};
```

Keep the UI and converter stable. Swap only the provider implementation.

## Verification

Run:

```bash
pnpm run verify:ai-operation-center
pnpm run verify:admin
```

## v3 Vision Provider Connection

AI photo analysis now supports a provider architecture.

Providers:

- `mock`: default, file name/order/category based analysis.
- `openai`: server-side OpenAI Vision analysis when configured.

Environment variables:

```bash
PADO_AI_IMAGE_PROVIDER=mock
OPENAI_API_KEY=
PADO_AI_IMAGE_MODEL=gpt-4o-mini
```

Operational rules:

- `OPENAI_API_KEY` is server-only. Never expose it with `NEXT_PUBLIC_`.
- Vision API calls may incur cost.
- If the provider is not configured, the API returns Mock analysis.
- If OpenAI fails, parsing fails, or an image is too large, the UI does not stop. It falls back to Mock analysis and shows a fallback notice.
- The Vision prompt must not infer facts that are not visible in the photo. Do not claim origin, domestic origin, Wando/Tongyeong, same-day harvest, live status, or certification unless visible.

API:

- `POST /api/admin/ai/images/analyze`
- Requires admin session.
- Returns `results`, `provider`, `fallbackUsed`, and optional `fallbackReason`.

Verification:

```bash
pnpm run verify:ai-operation-center
pnpm run verify:ai-vision-provider
pnpm run verify:ai-draft-flow
```

## AI Image Intelligence Quality Upgrade

The analysis engine now targets an operator-ready first draft for 10+ uploaded product photos.

Role taxonomy:

- `hero`: main conversion image.
- `origin`: sea, producer, farm, boat, origin context.
- `sizeComparison`: hand, ruler, scale, size comparison.
- `freshness`: close-up texture, flesh, live/fresh condition.
- `package`: box, pouch, vacuum pack, product package.
- `shipping`: ice pack, cold-chain box, courier/shipping materials.
- `cooking`: grilled, porridge, soup, prepared dish, table scene.
- `components`: set contents, ingredients, included items.
- `process`: sorting, cleaning, trimming, workshop/factory process.
- `review`: unboxing or customer-like use scene.
- `detail`: cut surface, surface detail, supporting close-up.
- `unknown`: needs operator review.

Quality score criteria:

- Sharpness
- Brightness
- Composition
- Product focus
- Background cleanliness
- Detail-page usability
- Hero suitability
- Customer trust signal
- Penalty for blur, watermark/text, messy background, or darkness

Score interpretation:

- `90-100`: hero/core section candidate.
- `75-89`: usable for product detail page.
- `60-74`: supporting image.
- `0-59`: needs review or not recommended.

Hero selection:

- The engine calculates `heroRank` for up to three candidates.
- Ranking favors large product visibility, clean background, appetizing/product-focused composition, high quality score, and low penalty.

Operator UI:

- Provider and fallback status.
- Overall analysis summary.
- Role counts.
- Hero candidate ranking.
- Average quality score.
- Needs-review count.
- Filters for hero candidates, needs-review images, packaging, cooking, and components.
- `AI 추천 순서로 정렬` button.

Draft conversion:

- Representative images
- Journey/process images
- Gallery
- Packaging
- Recipes
- Components
- Benefits draft
- FAQ draft
- SEO draft
- AI quality summary

Quality scoring command:

```bash
pnpm run score:ai-image-analysis
```

## Dataset & Evaluation System V1

The AI Operation Center now has objective dataset evaluation.

Admin routes:

- `/admin/ai/dataset`
- `/admin/ai/dashboard`

Dataset structure:

- `datasets/{category}/images`
- `datasets/{category}/labels`
- `datasets/{category}/metadata`

Evaluation command:

```bash
pnpm run evaluate:dataset
pnpm run verify:ai-dataset
```

Reports:

- `reports/ai-errors`
- `reports/prompt-history`

The current system uses fixture labels first. Real product images can be added later without changing the label schema.
