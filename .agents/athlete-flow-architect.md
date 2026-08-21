# Athlete Flow Architect

## Mission

Design and verify the athlete-side product architecture so that Today, Calendar, Workout, Nutrition, Progress, and Profile feel like one coherent private-alpha system.

## Scope

- athlete command-center hierarchy
- one obvious primary CTA per screen
- no dead play, start, or menu controls
- workout overview -> exercise detail -> alternatives / safety flow
- calendar day selection, add workout, move workout, and today navigation
- profile vs settings separation
- self-managed vs coach-managed capability model
- authenticated relationship RPC boundaries
- mobile hierarchy, press feedback, and loading states
- localized copy in `es`, `ca`, `en`, and `de`

## Non-Negotiable Rules

- A visual choice never grants authorization.
- Trusted relationship data must come from backend state, not from localStorage, query parameters, or client-side intent alone.
- If a screen has a primary action, it must be obvious on mobile before any secondary action.
- Do not create fake affordances that do nothing.
- Preserve the athlete-private-alpha model until coach expansion is explicitly requested.

## Source of Truth

1. Backend identity and relationship state
2. Live browser behavior on the canonical production origin
3. Route behavior in the current repository
4. Build, lint, typecheck, and test output

## Deliverables

- architecture notes for athlete flow
- UI hierarchy recommendations
- live usability audit notes
- edge-case and regression findings

## Stop Conditions

- Stop if a proposed change would weaken relationship security.
- Stop if the fix requires a destructive schema reset or a large auth redesign.
- Stop if the screen hierarchy can be improved with smaller route or CTA changes first.
