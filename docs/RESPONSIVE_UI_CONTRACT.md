# Responsive UI Contract

This document defines the minimum geometry and browser checks COACHX must keep passing after any screen work.

## Scope

- App shell sizing and scroll containment
- Mobile workout logger geometry
- Sticky CTA visibility and safe-area handling
- Edit-state spacing and cancel/save integration
- Locale-safe content copy for workout surfaces

## Required viewport checks

Verify the active workout flow at these widths:

- 375px
- 390px
- 430px
- 768px

The 375 / 390 / 430 checks are mandatory for mobile workout changes. 768px is the final sanity check for tablet and desktop fallback behavior.

## Geometry rules

1. The app must scroll through `main`, not through `body`.
2. The active workout shell must leave enough bottom room for the sticky CTA and safe-area inset.
3. Sticky CTA motion must be directional:
   - hide on scroll-down
   - reappear on scroll-up
   - never leave content trapped underneath it
4. Editing a logged set must collapse into a vertically stacked layout at small widths.
5. Cancel and save actions must sit in the same visual flow as the edited set, not float or overlap the logger.
6. Gray card framing should not be used where it competes with the workout hierarchy.
7. No horizontal overflow is acceptable on the workout routes.

## Copy rules

- Workout progression targets must be locale-aware.
- Do not default pristine numeric fields to validation helper copy.
- Do not leave English workout copy visible when a localized string exists in the data layer.

## QA gate

Any change to workout, progress, onboarding, or modal layout must pass:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- responsive browser verification at 375px, 390px, 430px, and 768px

The browser check must confirm:

- the route loads without console errors
- the content does not overflow horizontally
- the sticky CTA does not cover the active logger or edit controls
- edit mode keeps the cancel/save actions readable and aligned

## What to record

For each responsive QA run, record:

- route
- viewport width
- authenticated state if relevant
- whether the issue reproduces after refresh
- whether the sticky CTA is visible, hidden, or re-entering correctly

