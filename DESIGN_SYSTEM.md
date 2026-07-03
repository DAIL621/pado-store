# PADO STORY Design System

## Purpose

PADO STORY is a premium seafood commerce service. Every page must help customers trust the product, understand freshness, and move toward purchase without confusion.

This system is the source of truth for all new pages and generated product detail pages.

## Design Principles

1. Product first
   - The product image, price, option, delivery promise, and purchase CTA must be visible before long brand explanations.
2. Trust before decoration
   - Use design to explain origin, freshness, packaging, delivery, and inspection.
3. Mobile first
   - iPhone width is the primary layout target. Desktop should enhance, not redefine, the flow.
4. Calm premium tone
   - Use whitespace, clear typography, restrained motion, and strong product photography.
5. Conversion clarity
   - Every section should answer one customer question: what is it, why trust it, how fresh is it, what do I receive, how do I buy?

## Page Structure Standard

### Product Detail

1. Product Hero
2. Brand Story
3. Why This Product
4. Production Story
5. Freshness
6. Gallery
7. How To Eat
8. Package
9. FAQ
10. Review
11. Final CTA

Sections with empty data must be hidden automatically.

## Section Layout Engine

Do not repeat only card grids. Product detail pages should automatically combine these layout types:

- Full Width Banner
- Image Left / Text Right
- Text Left / Image Right
- 2 Column Story
- Full Image
- Quote Section
- Timeline
- Icon Grid
- Comparison Section
- Review Highlight

Every generated product detail page should use at least five distinct layout types before it is considered premium-ready.

## Conversion Quality Rules

- Include at least three CTA opportunities: Hero purchase, mid-page CTA, final CTA.
- Include review readiness even before real review data exists.
- Put the strongest image before long text.
- Use comparison only to reduce customer uncertainty, not to attack competitors.
- Keep story sections short. The product image and CTA must still feel close.

## Implementation Rules

- Use shared design tokens from `COLOR_SYSTEM.md`.
- Use shared typography rules from `TYPOGRAPHY_GUIDE.md`.
- Use shared CTA rules from `CTA_GUIDE.md`.
- Use mobile spacing and touch rules from `MOBILE_GUIDE.md`.
- Use image role rules from `IMAGE_GUIDE.md`.
- Do not hardcode product-specific layouts in components.
- Do not create one-off styling unless it becomes a reusable pattern.

## Required Validation

- `pnpm run build`
- `pnpm run verify:detail-template`
- `pnpm run verify:detail-json`
- `pnpm run dev:ensure`
- `pnpm run capture:detail:after -- --slug={slug}`
