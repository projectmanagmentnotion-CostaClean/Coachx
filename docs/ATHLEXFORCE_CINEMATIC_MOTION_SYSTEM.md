# AthlexForce Cinematic Motion System

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

Baseline commit: `750947236c04479e23d2174a71c19e8946ab663d`

## Purpose

This is the canonical AthlexForce motion language for premium but safe product motion.

It merges the live workout motion work with the remaining documented exercise-detail motion so future work does not fragment the choreography.

## Source of Truth Order

1. Production security and data invariants
2. Current working application architecture
3. This canonical motion system
4. Canonical design system
5. Approved Stitch motion reference
6. Stitch prototype code

## Motion Principles

- motion clarifies state, it does not become decoration
- keep transitions interruptible
- prefer opacity and transform over layout-heavy animation
- keep all motion mobile-safe
- keep reduced-motion behavior first-class
- use hero motion only for meaningful state change

## Timing Scale

| Tier | Duration |
| --- | --- |
| Micro | 100-180ms |
| Component | 220-380ms |
| State | 400-650ms |
| Hero | 550-850ms max |

Do not copy long Stitch prototype delays blindly.

## Easing

- Default easing: `power2.out`
- Use slightly faster timing for confirmations and ready states
- Avoid elastic or playful easing

## Motion Catalog

| ID | Trigger | Shared elements | Start -> end | Duration | Easing | Stagger | Reduced-motion equivalent | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Workout Overview -> Workout Start | start hero, start meta, start CTA | overview shell -> start view | 280-480ms | power2.out | small overlap | set visible state immediately | Implemented |
| T2 | Workout Start -> Active Workout | active shell, active hero, active logger | start view -> active shell | 280-560ms | power2.out | small overlap | set visible state immediately | Implemented |
| T3 | Set Complete -> Rest | set complete overlay, rest card, rest ring | success overlay -> rest state | 240-340ms | power2.out | none | show rest state without choreo | Implemented |
| T4 | Rest Ready -> Active Set | rest ready marker | rest state -> active set | 220-260ms | power2.out | none | snap to active state | Implemented |
| T5 | Workout Finish -> Summary | complete hero, KPIs, breakdown | active flow -> summary | 320-360ms | power2.out | restrained stagger | show summary sections immediately | Implemented |
| E1 | Active Workout -> Exercise Detail | active shell, exercise hero, exercise logger | workout shell -> detail shell | 360-560ms | power2.out | small overlap | simple fade | Partial |
| E2 | START <-> END media | media hero, media crop | media start -> media end | 220-380ms | power2.out | none | static image handoff | Future |
| E3 | Exercise Detail -> Alternatives | detail card, alternatives sheet | detail -> alternatives | 300-420ms | power2.out | small list stagger | direct sheet open | Partial |
| E4 | Exercise replacement base transition | current card, replacement row | exercise -> replacement flow | 300-420ms | power2.out | small overlap | static swap state | Future |
| E5 | Exercise Detail -> Active Workout | exercise hero, workout shell | detail -> active workout | 240-320ms | power2.out | none | direct render | Partial |
| E6 | Alternative Preview -> Replace Confirmation | preview card, confirm sheet | preview -> confirmation | 240-320ms | power2.out | none | static confirm state | Future |
| E7 | Replace -> Swap Success -> Workout | swap card, success chip | replace -> success -> workout | 280-360ms | power2.out | small overlap | inline success state | Future |
| E8 | Coach Request -> Success -> Original Workout Exercise | request sheet, success message | request -> success -> return | 280-360ms | power2.out | none | inline state changes | Future |
| E9 | Exercise Hero -> Fullscreen Media | exercise hero, fullscreen media | hero -> fullscreen | 280-420ms | power2.out | none | direct route change | Future |
| E10 | Fullscreen Media -> Exercise Detail | fullscreen media, detail shell | fullscreen -> detail | 220-340ms | power2.out | none | direct route change | Future |
| E11 | Muscle Map Reveal | muscle map, emphasis chips | neutral -> revealed map | 240-360ms | power2.out | subtle cascade | immediate reveal | Future |

## Reduced Motion

- Respect `prefers-reduced-motion`.
- Remove large shared movement and clip-heavy transitions.
- Keep state changes clear with short opacity transitions.
- Never rely on motion alone to communicate state.

## Implementation Map

### Runtime Sources

- `motion/workout.ts` is the runtime source for the current workout timelines.
- `motion/transitions.ts` provides the shared screen and card entry baseline.
- `motion/useReducedMotion.ts` gates motion behavior.

### Current Code Coverage

| Documented motion | Current code | Status |
| --- | --- | --- |
| T1-T5 | `motion/workout.ts` + `app/workout/[sessionId]/page.tsx` + `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` + `app/workout/[sessionId]/summary/page.tsx` | Implemented |
| E1-E5 | workout exercise shell and alternatives routes | Partial |
| E6-E11 | future exercise media / replacement / coach-request surfaces | Future |

## Current Motion Rules

- Workout motion should feel faster than the prototype.
- Keep shared-element style continuity only when the route architecture supports it safely.
- Do not duplicate timelines unnecessarily.
- Keep every animation lifecycle-safe and reversible.

## Legacy Supporting References

- `docs/WORKOUT_CINEMATIC_MOTION_SYSTEM.md`
- `docs/MOTION_REFERENCE_LOG.md`
- `docs/FRONTEND_MOTION_AUDIT.md`
- `docs/MOTIVATIONAL_MOTION_RULES.md`

## Drift Policy

- If a transition is already implemented and safe, keep it.
- If a documented transition is not yet implemented, mark it future instead of inventing it.
- Do not let Stitch prototype timing override the working product.

## Slice 26 Motion Delta

Slice 26 adds a shared feedback layer on top of the existing motion language.

### Added runtime helpers

- `motion/feedback.ts`

### Canonical behavior

- Keep feedback motion interruptible.
- Prefer compact contextual success over full-screen overlays.
- Use the same canonical easing family already defined here.
- Do not introduce playful easing or new timing families.
- Keep reduced-motion end states identical.

### Scope note

- This slice centralizes confirmation-sheet, contextual success, KPI update, and preparing-workout choreography.
- It does not replace the existing workout motion system.
- It does not change production architecture beyond shared feedback centralization.
