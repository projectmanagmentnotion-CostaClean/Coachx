# Live Product Audit

Audit date: 2026-08-11  
Branch: `codex/phase-1-foundation`  
HEAD: `36c86b8`

## What Was Verified Live

The following production flows were opened and read in the live browser:

- Today
- Calendar
- Day detail
- Nutrition
- Workout
- Progress home
- Weekly check-in
- Measurement update
- Progress photos
- Phase review
- Photo compare

## Verified Behavior

- Today renders a real athlete experience with program context, workout entry, and movement access.
- Calendar renders a month view with month navigation and a day detail CTA.
- Day detail opens workout and nutrition subflows.
- Nutrition is interactive and shows meal, hydration, and supplement controls.
- Workout flow supports set logging, rest timing, alternatives, and exercise swap persistence.
- Progress contains real analytics surfaces, weekly check-in, measurements, photos, and phase review.

## Primary Audit Findings

| ID | Area | Severity | Status | Summary |
| --- | --- | --- | --- | --- |
| CAL-001 | Calendar | P2 | Open | The calendar grid is not directly navigable by day; the live surface exposes one `Ver día` CTA for the selected date. |
| WORKOUT-001 | Workout | P2 | Open | `Close workout` is present as a button, but the live flow does not clearly exit the workout shell. |
| NAV-001 | Navigation | P3 | Open | Nutrition is real but hidden behind day detail instead of a primary destination. |
| FEEDBACK-001 | Feedback state | P3 | Resolved | Stale feedback toasts are cleared on route transitions in the live runtime. |
| PROGRESS-001 | Progress copy | P3 | Open | Some analytics wording still implies missing persistence while the page already shows live metrics. |

## Locale Note

The first-auth English render is explained by locale bootstrap order, not by profile settings.

- Client bootstrap uses `getInitialLocale()` with no profile override.
- `getInitialLocale()` resolves `localStorage` first, then cookie, then browser locale, then `es`.
- On authenticated server routes, `app/layout.tsx` and progress pages read the `athlexforce-locale` cookie first.
- Onboarding starts from `getInitialLocale()` with no explicit locale input, so browser locale is the likely source of an initial `en` render when there is no saved cookie or localStorage yet.

## Recommendation

No code change is recommended for locale bootstrap unless product wants authenticated profile locale to override browser/device language on first entry.
