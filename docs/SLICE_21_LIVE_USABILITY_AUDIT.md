# Slice 21 Live Usability Audit

## Audit Frame

This audit captures the athlete-side UX baseline for Slice 21. It is focused on private-alpha flow clarity rather than new product scope.

## Observed Surfaces

| Surface | Observation | Status |
| --- | --- | --- |
| Today | The current day is the command center. Workout entry is present and should lead into the real workout route. | Verified in source, to be re-checked live |
| Calendar | Month navigation, Today jump, selected day, and add/move actions are available. | Verified in source, to be re-checked live |
| Workout overview | The session hierarchy exists and exercise-level navigation is required to make the rows feel tappable. | Verified in source |
| Workout exercise | Set logging, rest controls, and safety actions exist. Top-bar overflow should resolve to a real route. | Verified in source |
| Profile | Identity and settings are separated conceptually, with relationship state shown separately from preferences. | Verified in source |
| Identity gateway | Coach-managed invite entry exists and uses the private relationship RPC path. | Verified in source and live browser snapshot |

## Live Browser Notes

- The onboarding identity gateway exposes coach-managed invitation entry.
- A bad invitation token returns a safe business error instead of mutating state.
- The app is already using the athlete-private model and does not need a coach redesign for this slice.

## UX Risks to Watch

- Any icon-only control that does not navigate or trigger a meaningful action.
- Calendar actions that feel visually available but do not change the user's state.
- Workout overview rows that look interactive but do not open the detail flow.
- Copy that exposes internal RPC or schema terminology in normal athlete views.

## Slice 21 UX Goals

- Keep Today as the first screen that answers "what should I do now?"
- Make the workout overview feel like a real drill-down hierarchy.
- Preserve a clean profile/settings split.
- Keep the private relationship surface secure and understandable.
- Remove dead controls from the athlete journey.
