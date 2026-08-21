# Slice 17 Recommended Scope

## Goal

Convert the current live product into a cleaner, less ambiguous athlete experience without changing the already-working core data flows.

## Recommended Scope

1. Fix workout exit behavior so `Close workout` clearly leaves the exercise shell.
2. Improve calendar usability so users can open days directly from the grid.
3. Add a clearer Nutrition entry point, or explicitly promote it from the day flow.
4. Clear stale feedback/toast state on auth and route transitions.
5. Normalize progress copy so live metrics do not sit beside "no analytics persisted" wording.

## Nice-To-Have If Time Remains

- Improve coach route clarity and confirm role-gated behavior with a coach account.
- Tighten locale precedence if product wants authenticated profile locale to override browser locale on first entry.
- Add stronger empty-state and success-state consistency across progress screens.

## Out Of Scope For Slice 17

- New Supabase projects
- Schema migrations unrelated to the observed gaps
- Deployment changes
- Large visual redesign
- Reworking the already-functional workout logging and progress capture flows

## Acceptance Bar

- Core athlete navigation is clear.
- Workout exit is predictable.
- Calendar browsing is direct.
- Progress feedback copy is internally consistent.
- No regression in the verified live flows.

