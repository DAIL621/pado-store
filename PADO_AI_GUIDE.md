# PADO STORY AI Generation Guide

## Purpose

AI-generated copy must sound like a trustworthy premium seafood shop, not a generic advertisement.

## Voice

- Clear
- Calm
- Specific
- Freshness-focused
- Korean commerce friendly

## Avoid

- Overpromising health effects
- Unsupported superlatives
- Vague luxury phrases
- Long paragraphs
- Artificially cute wording

## Product Detail Copy Formula

### Hero Subtitle

Use:

`{origin}에서 준비한 {productName}. 선별, 포장, 출고 기준을 지켜 신선하게 보냅니다.`

### Benefits

Each benefit must be short:

- 산지직송
- 당일 선별
- 냉장 신선 포장
- 평일 13시 전 당일 출고
- 구성품 확인 가능

### Gallery Caption

Use image role:

- 대표사진: 실제 질감과 색감을 먼저 확인하세요.
- 크기비교: 받아보실 때의 크기감을 예상할 수 있습니다.
- 포장사진: 아이스팩과 냉장 포장으로 신선하게 배송합니다.
- 조리사진: 식탁에 올렸을 때의 모습을 미리 확인하세요.

## Section Length

- Hero subtitle: 1 sentence
- Card body: 1 to 2 short lines
- Story section: maximum 2 sentences
- FAQ answer: maximum 3 lines

## Data Safety

If data is missing, do not invent operational facts. Use safe placeholders such as:

- 상세 정보 준비중
- 상품별 포장 기준 확인중
- 실제 사진 업데이트 예정
## AI Operation Center v1

관리자 내부 AI 운영센터의 첫 구현 범위는 `AI 사진분석`입니다.

- Route: `/admin/ai/images`
- Engine: `lib/admin/ai-image-analysis.ts`
- UI: `components/admin/AdminAiImageAnalyzer.tsx`
- Guide: `AI_OPERATION_CENTER.md`

### Current Behavior

- Multiple image upload
- Drag & Drop
- Preview
- Delete
- Reorder
- Mock image role analysis
- Editable title/description/role/section fields
- `convertImageAnalysisToDetailJson()` preview
- Send analysis result into `/admin/new`
- Auto-import AI image draft into product registration
- Clear AI draft from product registration

### AI API Replacement Rule

Do not rewrite the admin UI when connecting a real Vision API.

Replace only the provider behind:

- `analyzeImageWithMockEngine()`
- `analyzeImagesWithMockEngine()`

The returned shape must remain compatible with `AiImageAnalysisResult`.

## AI Image Analysis Provider v3

The AI Operation Center uses a provider model.

- Default provider: `mock`
- Optional provider: `openai`
- Server API: `POST /api/admin/ai/images/analyze`

Environment variables:

```bash
PADO_AI_IMAGE_PROVIDER=mock
OPENAI_API_KEY=
PADO_AI_IMAGE_MODEL=gpt-4o-mini
```

Safety policy:

- Do not expose `OPENAI_API_KEY` to the browser.
- Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.
- Vision calls can create API cost.
- If OpenAI is not configured or fails, use Mock fallback.
- Never infer invisible facts from photos. Avoid unsupported claims like domestic origin, Wando origin, same-day harvest, live status, or certification unless the image visibly proves it.

Output policy:

- Keep titles short.
- Keep descriptions trustworthy.
- Include `reasoningSummary` so admins know why the role was recommended.
- Preserve compatibility with `convertImageAnalysisToDetailJson()` and the `/admin/new` AI draft handoff.

## Image Intelligence Quality Rules

When analyzing product photos, classify by visible use in the shopping detail page:

- Ice pack, cold box, delivery material -> `shipping` or `package`
- Pouch, vacuum pack, product bag -> `package` or `components`
- Porridge, grilled dish, soup, table-ready photo -> `cooking`
- Seafood held in hand or next to a ruler -> `sizeComparison` or `freshness`
- Workshop, cleaning, trimming, sorting -> `process` or `origin`
- Appetizing plated product with clean composition -> `hero` or `cooking`
- Blurry/dark/messy/watermarked image -> lower `qualityScore` and add `warningMessage`

Hero candidate rules:

- Product must be large and clear.
- Background should not distract.
- Avoid text-heavy or watermarked photos.
- Prefer photos that make the product understandable and appetizing.
- Assign `heroRank` to the top three candidates only.

Quality score:

- `90-100`: representative/core image.
- `75-89`: usable image.
- `60-74`: supporting image.
- `0-59`: needs review.

Draft generation:

- Generate benefits only from analysis-safe facts.
- Generate FAQ as a draft, not final truth.
- Generate SEO draft without unsupported origin or harvest claims.
- Preserve image title, description, caption, role, quality score, hero rank, and reasoning summary.
