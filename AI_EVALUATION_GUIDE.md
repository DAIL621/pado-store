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

