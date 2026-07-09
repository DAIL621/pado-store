# PADO STORY AI Evaluation Guide

## Evaluation Metrics

`scoreAiDataset()` calculates:

- Role Accuracy
- Hero Accuracy
- Caption Accuracy
- Section Accuracy
- Quality Accuracy
- Warning Accuracy
- Total Score

## Accuracy Logic

Role and section are exact matches.

Hero accuracy checks whether the expected `expectedHeroRank` matches the predicted `heroRank`.

Quality accuracy allows a tolerance around the human label because visual quality has some subjective range.

Caption accuracy currently uses text overlap. When real datasets grow, this can be replaced with embedding similarity.

## Misclassification Storage

Running:

```bash
pnpm run evaluate:dataset
```

creates:

```text
reports/ai-errors/
reports/prompt-history/
```

`reports/ai-errors` stores images where AI prediction differs from the human label.

`reports/prompt-history` stores each evaluation run so prompt improvements can be compared over time.

## Improvement Loop

1. Add or correct labels.
2. Run `pnpm run evaluate:dataset`.
3. Review `reports/ai-errors`.
4. Improve prompt or fallback rules.
5. Run evaluation again.
6. Compare `reports/prompt-history`.

## Current Target

For fixture-level verification:

- Role Accuracy: 85%+
- Total Score: 85%+

For production use with real images:

- Role Accuracy: 90%+
- Section Accuracy: 90%+
- Hero Accuracy: 90%+

## Review Center Scoring

Dataset evaluation measures AI classification accuracy.

Review Center scoring measures operating usefulness:

```bash
pnpm run score:review-center
```

Important review metrics:

- Auto approval rate
- Operator correction rate
- Rule usage rate
- Confidence accuracy
- Average review time estimate

Use dataset evaluation and review scoring together before changing prompts or rules.

## Real Dataset Verification

For real abalone images:

```bash
pnpm run verify:real-abalone-dataset
```

This verifies:

- actual images exist under `datasets/abalone/images`
- metadata JSON exists
- label JSON exists
- latest analysis report exists
- Review Center route is accessible
- Dataset route is accessible
- label update API persists `reviewed=true`
- screenshots are generated

## Operator Review Evaluation

Use this command when the operator has reviewed or approved real labels:

```bash
pnpm run evaluate:review -- --category=abalone
```

This compares:

- AI original role in `datasets/abalone/metadata`
- operator final role in `datasets/abalone/labels`
- AI original section
- operator final section
- title changes
- description changes
- quality score changes

Latest report path:

```text
reports/ai-evaluation/abalone-review-latest.json
```

Current abalone review baseline:

- Total images: `30`
- Approved labels: `7`
- Pending labels: `23`
- Role accuracy: `43%`
- Section accuracy: `57%`

Operator next steps:

1. Open `/admin/ai/review?filter=pending`.
2. Approve or correct the remaining `23` images.
3. Use `/admin/ai/review?filter=roleMismatch` to focus on role disagreements.
4. Use `/admin/ai/review?filter=sectionMismatch` to focus on section placement disagreements.
5. Rerun `evaluate:review` after each review batch.
