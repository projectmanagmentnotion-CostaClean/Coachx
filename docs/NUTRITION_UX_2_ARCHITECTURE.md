# Nutrition UX 2.0 Architecture

## Purpose

Nutrition UX 2.0 is the athlete daily performance surface.
It should answer:

- what to eat today
- what to eat next
- when to eat it
- how much is complete
- how much remains
- how much water remains
- what supplements remain

## Current Runtime Shape

- `app/nutrition/page.tsx` resolves the date and mode.
- `components/nutrition-screen.tsx` renders the daily nutrition shell.
- `components/nutrition-meal-sheet.tsx` handles meal detail, option comparison, and replacement confirmation.
- `components/nutrition-provider.tsx` owns hydration, snapshot hydration, local persistence, and identity mode.
- `lib/nutrition-service.ts` owns snapshot creation, hydration, completion math, meal state resolution, and option ranking.

## Truth Rules

- Visible calories and macros must come from snapshot-derived state.
- Meal completion must persist before success is shown.
- Completed actuals must not be rewritten by future prescription changes.
- Hydration and supplement logs are owned by the same nutrition day snapshot.
- No broken media is allowed. Fall back to semantic blocks.

## Meal State Model

- `NEXT`
- `UPCOMING`
- `COMPLETED`
- `PAST_INCOMPLETE` when a meal already has a selection but is not complete

## Replacement Rules

- Self-managed athletes can replace an allowed meal option directly.
- Coach-managed athletes must not bypass governance.
- If no safe request infrastructure exists, show truthful unavailable UI instead of fake success.

## Data Flow

1. Hydrate a nutrition snapshot for the selected date.
2. Derive progress and the next meal from the snapshot.
3. Render the daily summary and the next meal first.
4. Open the meal sheet for detail, options, preview, and confirmation.
5. Persist the mutated snapshot.
6. Refresh should revive the same completed state without duplication.

## Mobile Priority

- Keep the next meal visible in the first viewport on 390px widths.
- Keep hydration and supplements compact.
- Keep the sheet readable and safe-area aware.

