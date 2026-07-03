# PADO STORY Component Guide

## Card

- Radius: `16px` to `22px`
- Border: `1px solid var(--pado-line)`
- Background: white or soft mint
- Shadow: subtle, never heavy black
- Hover desktop: `translateY(-3px to -4px)`
- Mobile: use touch feedback, avoid hover-only meaning

## Product Hero

Required:

- Product image
- Product name
- Rating or review-ready signal
- Discount rate if available
- Sale price
- Delivery promise
- Option selector
- Quantity
- Cart and purchase CTA

Do not overload Hero with long origin, packaging, FAQ, or brand philosophy. Move them below.

## Trust Cards

Use six-card standard:

1. 산지직송
2. 당일출고
3. 신선포장
4. 선별
5. 실물촬영
6. 품질검수

## Gallery Card

Required:

- Image
- Role badge
- Caption title
- One short explanation

## Final CTA

Required:

- Product name
- Price
- Stock or status
- Anchor to purchase box

## Premium Conversion Layouts

### Split Story

Use for origin, production, and freshness persuasion.

- One large image
- One focused headline
- One short paragraph
- Optional quote chip

### Mid Conversion CTA

Use after the customer understands the product value but before the full gallery.

- Price
- Stock
- Delivery promise
- Anchor to purchase box

### Comparison

Use to reduce uncertainty.

- Two columns maximum
- Keep copy factual
- Highlight PADO STORY's process, not vague superiority

### Review Highlight

Use even when real reviews are not ready.

- Show review-ready placeholder
- Mention photo reviews and purchase verification
- Replace with live data later without layout changes
## Auto Generated Detail Components

- `detail-auto-engine` generates category-aware copy and fallback data before the MASTER template renders.
- `ProductDetailTemplate` should consume generated data instead of hardcoding product-specific sections.
- Gallery cards may include `role`, `badge`, `title`, and `caption`; these should be rendered when present.
- Review placeholders should look like future real review modules and must not block later replacement with real review data.
- Admin Preview must use the same `ProductDetailTemplate` component as the customer page and support mobile, tablet, and desktop checks.
