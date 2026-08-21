# Data Visualization System

## Purpose

The Progress area now uses a dedicated analytics layer for real athlete data. The goal is clear signal, bounded history, and deliberate motion without inventing scores.

## Architecture

### Data Loader

- Server-side loader fetches bounded rows from Supabase.
- The loader composes:
  - workout volume series
  - body measurement series
  - nutrition adherence series
  - recovery / check-in series
- If no authenticated user is present, the UI falls back to an explicit empty state.

### View Model

- The analytics view model contains:
  - localized copy
  - range metadata
  - hero summary / next focus
  - metric cards
  - chart series
  - data coverage counts
  - recent session summaries

### UI Layer

- Progress overview and detailed trends use the same underlying data model.
- SVG is the primary chart layer.
- Chart point inspection is touch-friendly.
- Empty states are visible and not disguised as data.

## Motion

- GSAP is used only for chart reveal and card entry.
- Motion is scoped and cleaned up with the screen lifecycle.
- `prefers-reduced-motion` disables decorative chart animation.

## Localization

- Supported locales:
  - `es`
  - `ca`
  - `en`
  - `de`
- Static labels and copy are localized before render.
- Numeric formatting and date labels follow the current locale.

## Visual Rules

- Mobile-first cards
- No fake fitness score
- No radar chart unless future data semantics justify it
- Avoid chart clutter on small screens
- Keep legends, summaries, and data points readable at 375–430px

## Accessibility

- Charts expose a readable selected point state
- Point chips remain keyboard and touch accessible
- No information is encoded only by color
- Reduced-motion users still get the full view

