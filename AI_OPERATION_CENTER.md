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

