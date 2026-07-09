# AI Review Center

AI Review Center is the operating layer between AI image analysis and product registration.

The goal is not to make the operator label every image. The goal is:

1. AI analyzes images first.
2. High-confidence results are auto approved.
3. Ambiguous results enter a review queue.
4. Operator corrections are saved as rules.
5. Future analysis uses operator rules before Vision or mock fallback.

## Admin Route

- `/admin/ai/review`

Menu path:

- AI Operation Center
  - AI Image Analysis
  - AI Dataset
  - AI Dashboard
  - AI Review Center

## Confidence Policy

| Confidence | Status | Operator Action |
| --- | --- | --- |
| 95-100 | Auto approved | No action needed unless warning exists |
| 90-95 | Review recommended | Quick scan recommended |
| 70-90 | Needs review | Operator should confirm role and section |
| Under 70 | Operator required | Manual review required |

## Review Queue Status

- `auto-approved`
- `review-recommended`
- `needs-review`
- `operator-required`
- `corrected`
- `held`
- `misclassified`

## Rule Priority

Rules are applied in this order:

1. Operator rules
2. AI Vision result
3. Mock rule
4. Fallback

Operator rules override model output because they represent real operating decisions.

## Current V1 Storage

V1 is file-backed and fixture-driven.

- Rule report path: `reports/ai-review-center`
- History examples: generated from `lib/admin/ai-review-center.ts`
- Dataset source: `datasets/*/labels/fixtures.json`

Future production version should move rules and history to Supabase tables.

## Commands

```bash
pnpm run verify:ai-review-center
pnpm run score:review-center
```

## Score Metrics

- Auto approval rate
- Operator correction rate
- Rule usage rate
- Average confidence
- Confidence accuracy
- Review queue size

## Production TODO

1. Save review queue items to Supabase.
2. Save operator approval/correction history with admin user ID.
3. Promote repeated corrections into rules through an approval workflow.
4. Compare OpenAI Vision output against reviewed labels.
5. Feed confirmed rules back into the image analysis API.

## Real Abalone Dataset Connection

The Review Center now reads real analyzed files when available.

Source:

- `datasets/abalone/images`
- `datasets/abalone/metadata`
- `datasets/abalone/labels`

Analyze command:

```bash
pnpm run analyze:dataset -- --category=abalone
```

Review route:

- `/admin/ai/review`

Operator actions now save back to label JSON through:

- `POST /api/admin/ai/review/update-label`

Review history path:

- `reports/ai-review-history`

V1 remains file-based. Supabase persistence is the next production step.
