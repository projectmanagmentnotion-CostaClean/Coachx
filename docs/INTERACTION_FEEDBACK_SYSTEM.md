# AthlexForce Interaction Feedback System

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

Slice: `26`

## Purpose

This document defines the canonical interaction feedback system for AthlexForce. The system ensures athlete actions feel immediate, truthful, accessible, and consistent without introducing a second design language.

## Core Invariant

Persistence truth always wins.

Mutation flow:

`PRESS -> immediate tactile acknowledgement -> PENDING -> real persistence succeeds -> SUCCESS -> dependent UI/KPI update`

Never:

`PRESS -> SUCCESS -> persistence attempt`

If persistence fails, the previous truthful state stays visible and the user gets a calm retry path.

## Feedback Levels

### L1 - Micro

- 100-180ms
- button press
- toggle
- small selection
- water quick-add
- START / END switch
- increment / decrement

Use immediate surface response only. No toast.

### L2 - Inline

- 220-380ms
- set logging
- field saving
- supplement completion
- small row or card mutation
- local profile save

Feedback stays inside the affected component.

### L3 - Contextual

- 400-650ms
- progress saved
- profile saved when broader confirmation helps
- meal replacement
- exercise swap
- check-in sent

Use a small contextual success treatment that does not take over the screen.

### L4 - Cinematic

- 550-850ms maximum
- workout complete
- nutrition complete
- major program or recommendation application

Reserved for milestones only.

## Canonical CTA States

- DEFAULT
- PRESSED
- PENDING
- SUCCESS
- ERROR

Button dimensions stay stable during pending and success.

## Error / Retry

- `PENDING -> ERROR -> RETRY -> PENDING -> SUCCESS`
- Retry must genuinely re-enter pending.
- Retry must not duplicate the mutation.
- Show calm product copy, not backend stack text.

## Canonical Success / Failure Language

Preferred examples:

- `SAVED`
- `COULDN'T SAVE`
- `TRY AGAIN`
- `PROGRESS SAVED`
- `CHECK-IN SENT`
- `PREPARING WORKOUT`

Avoid technical copy such as:

- Supabase
- PostgREST
- HTTP 500
- network stack details

## Toast Policy

- Toast is not the default mutation feedback.
- If the changed component is visible, prefer local or contextual feedback.
- Use toast only when there is no natural visible surface.
- Dedupe repeated messages.
- Keep the queue small.

## Motion Policy

- Centralize GSAP feedback motion helpers.
- Keep motion interruptible.
- Reduced motion must preserve the same end state.
- Do not block the athlete behind animation completion.
- Do not scatter new animation choreography into every feature component.

## Canonical Motion Uses

- press feedback
- pending feedback
- contextual success
- error feedback
- card completion
- KPI update
- confirmation sheet
- preparing workout

## Accessibility

- Minimum touch target: 44px
- Keep visible focus
- Do not rely on color alone
- Use polite aria-live for nonblocking messages
- Avoid screen reader spam for micro interactions
- Keep dialogs and sheets keyboard-friendly

## Cross-Feature Usage Matrix

| Surface | Typical feedback |
| --- | --- |
| Today | L1 or L2 |
| Calendar | L1 or L2 |
| Workout | L1, L2, F4, F9, F10 |
| Exercise Detail | L2 or L3 |
| Nutrition | L1, L2, L3 |
| Progress | L2, L3, KPI continuity |
| Check-in | L3 and L4 where needed |
| Profile | L2 or L3 |

## Related Files

- `motion/feedback.ts`
- `components/feedback-provider.tsx`
- `lib/feedback.ts`
- `docs/ATHLEXFORCE_CINEMATIC_MOTION_SYSTEM.md`
- `docs/DESIGN_IMPLEMENTATION_MAP.md`
- `docs/STITCH_REFERENCE_INDEX.md`
