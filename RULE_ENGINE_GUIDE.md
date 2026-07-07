# AI Rule Engine Guide

The AI Rule Engine turns operator corrections into reusable operating knowledge.

## Rule Shape

```json
{
  "id": "rule-abalone-hand-size",
  "name": "Abalone held in hand means size comparison",
  "productCategory": "abalone",
  "filenameIncludes": ["hand", "size", "compare"],
  "targetRole": "sizeComparison",
  "targetSection": "gallery",
  "priority": 100,
  "source": "operator",
  "usageCount": 5,
  "description": "When abalone is held by hand, customers use it to understand real size."
}
```

## Rule Matching

A rule matches when:

- `productCategory` is empty or equals the current product category.
- At least one `filenameIncludes` keyword appears in the normalized file name.

## Priority

Higher priority wins.

Current default rules:

1. Abalone held in hand -> `sizeComparison` / `gallery`
2. Ice pack, cold box, delivery box -> `shipping` / `packaging`
3. Cooked dish, recipe, porridge, grill -> `cooking` / `recipes`

## Rule Suggestions

When the same correction appears repeatedly in review history, the system creates a suggested rule.

V1 uses fixture history. Production should count real operator corrections.

## Safe Operating Policy

- Rules should improve placement, not invent product facts.
- Rules must never claim origin, harvest date, certification, or same-day shipping unless confirmed by product data.
- Rules should remain explainable to operators.

## Future Supabase Tables

Recommended future tables:

- `ai_review_rules`
- `ai_review_queue`
- `ai_review_history`
- `ai_prompt_versions`
- `ai_review_rule_suggestions`
