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
2. PADO STORY Brand Promise
3. Why PADO STORY Trust Cards
4. Brand Story
5. Product Selling Points
6. Product Overview
7. Origin to Table Journey
8. Emotional Full-Bleed Banner
9. Gallery
10. Cooking / Serving
11. Components
12. Packaging and Delivery
13. FAQ
14. Review Ready
15. Final CTA

Sections with empty data must be hidden automatically.

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

