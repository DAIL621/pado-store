# PADO STORY Color System

## Core Tokens

| Token | Value | Usage |
|---|---:|---|
| `--pado-navy` | `#052f36` | Premium background, footer CTA, strong headings |
| `--pado-teal` | `#087f83` | Primary brand action, trust UI |
| `--pado-coral` | `#ef725e` | CTA accent, discount, urgency |
| `--pado-amber` | `#f6b948` | Best badge, warm highlight |
| `--pado-mint` | `#eaf7f5` | Soft trust background |
| `--pado-soft` | `#f3faf8` | Page background |
| `--pado-line` | `#d7e9e6` | Borders |
| `--pado-text` | `#123f44` | Main text |
| `--pado-muted` | `#5f7679` | Secondary text |
| `--pado-white` | `#ffffff` | Cards and surfaces |

## Usage Rules

- Use navy for premium weight.
- Use teal for brand trust and main actions.
- Use coral only for purchase pressure: discount, CTA, warning, important badge.
- Use amber sparingly for BEST or recommendation.
- Avoid pages dominated by one hue. Teal and navy must be balanced with white and product imagery.

## Detail Page Mapping

`.detail-master-v4` maps its local CSS variables to PADO tokens:

- `--detail-navy: var(--pado-navy)`
- `--detail-teal: var(--pado-teal)`
- `--detail-accent: var(--pado-coral)`
- `--detail-soft: var(--pado-soft)`
- `--detail-line: var(--pado-line)`

