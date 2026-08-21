# Functional Gap Register

| ID | Severity | Area | Live Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| CAL-001 | P2 | Calendar | Live calendar shows month controls and a single `Ver día` CTA for the selected date. | Users cannot browse arbitrary days directly from the grid. | Make each day cell a link/button or add richer day navigation. |
| WORKOUT-001 | P2 | Workout | Live workout exercise page exposes `Close workout`, but the click does not visibly exit the workout experience. | Exit/back behavior is unclear and may trap the user in an exercise shell. | Wire the control to a visible exit destination, likely summary or Today. |
| NAV-001 | P3 | Navigation | Nutrition is only reachable through day detail. Bottom nav exposes Today, Calendar, Progress, and Profile only. | Core nutrition content is discoverable but not easy to reach. | Consider a persistent shortcut or stronger day-level entry point. |
| FEEDBACK-001 | P3 | Feedback | Stale `Signed out` / `Onboarding complete` toasts were visible after session changes in the live browser. | Distracting, misleading feedback state. | Cleared on route transitions in `components/feedback-provider.tsx`; verify in live browser. |
| PROGRESS-001 | P3 | Progress copy | Progress surfaces show live metrics, but some copy still says no analytics are persisted. | Mixed messaging reduces confidence in the analytics layer. | Align empty-state copy with the actual data coverage. |

## Not Counted As Gaps

- Real Today, Day, Nutrition, Workout, Progress, Check-in, Measurements, Photos, and Phase Review flows all exist and are functional.
- Locale selection is consistent with the current bootstrap order; no defect was proven from the live evidence.

## Count

- Open findings: 4
- High severity blockers: 0
- Mutations performed for audit: 0
