# PADO STORY AI Dataset Guide

## Purpose

The AI Dataset measures how well the AI image analyzer classifies seafood product photos.

The goal is not "the AI seems good." The goal is measurable evaluation:

1. Human label
2. AI result
3. Automatic comparison
4. Accuracy score
5. Misclassification report
6. Prompt improvement
7. Re-evaluation

## Folder Structure

```text
datasets/
  abalone/
    images/
    labels/
    metadata/
  eel/
  octopus/
  oyster/
  shrimp/
  fish/
  meal-kit/
  gift-set/
```

## Label Schema

Each image label uses:

```json
{
  "imageId": "abalone-hero-001",
  "fileName": "wando-abalone-main-clean-hero.jpg",
  "productCategory": "abalone",
  "expectedRole": "hero",
  "expectedSection": "heroImages",
  "expectedHeroRank": 1,
  "expectedQualityScore": 90,
  "expectedWarnings": [],
  "expectedCaption": "상품의 첫인상을 만드는 대표 후보 사진입니다.",
  "expectedTitle": "대표 상품 사진",
  "expectedDescription": "상품이 가장 크게 보이는 사진입니다.",
  "notes": "전복 대표 fixture"
}
```

## Roles

- `hero`
- `origin`
- `process`
- `freshness`
- `sizeComparison`
- `package`
- `shipping`
- `components`
- `cooking`
- `gallery`
- `detail`
- `review`
- `unknown`

## Current Fixture Coverage

- 전복 대표
- 전복 크기비교
- 전복 조리사진
- 전복 흐린 사진
- 장어 대표
- 장어 손질
- 문어 대표
- 굴 대표
- 새우 대표
- 아이스팩/배송
- 밀키트 조리
- 선물세트 포장

## Admin UI

- Dataset page: `/admin/ai/dataset`
- Dashboard: `/admin/ai/dashboard`

The current UI reads fixture labels and displays them for review. Later, actual image upload and DB-backed label saving can reuse this schema.

## Commands

```bash
pnpm run verify:ai-dataset
pnpm run evaluate:dataset
```

