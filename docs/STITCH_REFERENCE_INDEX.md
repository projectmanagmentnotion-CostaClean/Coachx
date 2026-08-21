# Stitch Reference Index

This document records the supplied Stitch reference screens without dumping prototype HTML into production.

## Known Stitch Artifacts

- The Stitch YAML olive palette is not canonical.
- Some screenshots were generated at prototype-specific dimensions.
- Fullscreen Media capture was malformed or cropped.
- Some animated screenshots can capture blank intermediary states.
- CDN Tailwind and GSAP in Stitch HTML are references only.
- External demo imagery is not a production dependency.
- Hardcoded demo metrics are not production data.

## Slice 22 Reference Index

| Reference screen | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Active Workout | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Prototype dimensions may differ from mobile production widths. |
| Workout Start | `app/workout/[sessionId]/page.tsx` | Implemented | Prototype timing must not override runtime timing. |
| Set Success | `motion/workout.ts` + workout exercise route | Implemented | Animated captures may show intermediate blank frames. |
| Rest Timer | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Reference timers are visual, not authoritative data. |
| Rest Ready | `motion/workout.ts` | Implemented | Timing should remain shorter in product. |
| Exercise Complete | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Prototype hero framing may be cropped. |
| Next Exercise | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Prototype spacing may be wider than production. |
| Workout Paused | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Focused overlay reference only. |
| Finish Confirmation | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Confirmation should stay concise in production. |
| Workout Summary | `app/workout/[sessionId]/summary/page.tsx` | Implemented | Summary reveal should stay lifecycle-safe. |
| Resume Workout | `app/workout/[sessionId]/page.tsx` | Implemented | Resume state must recover from persisted session truth. |
| Exercise Actions | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented | Action affordances must remain tappable on 390px. |
| Summary Cinematic Reveal | `app/workout/[sessionId]/summary/page.tsx` | Implemented | Use restrained motion only. |

## Slice 23 Reference Index

| Reference screen | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Exercise Detail Hip Thrust | `app/exercises/[exerciseId]/page.tsx` and `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Partial / Next | Reference is a prototype screen, not a separate product shell yet. |
| Exercise Detail END | `app/exercises/[exerciseId]/page.tsx` | Partial / Next | Fullscreen framing may be cropped. |
| Muscle Intent | `app/exercises/[exerciseId]/page.tsx` | Partial / Next | Use semantic anatomy only. |
| Alternatives | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` | Implemented / Partial | Prototype dimensions vary. |
| Alternative Preview | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` | Partial / Next | Preview cards should remain product-led. |
| Replace Confirmation | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` | Partial / Next | Confirmation must not rewrite actual history. |
| Swap Success | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` | Partial / Next | Keep the success state brief. |
| Coach Request Change | `components/program-change-proposal-panel.tsx` | Partial / Next | Coach-request language must not imply privilege. |
| Coach Request Success | `components/program-change-proposal-panel.tsx` | Partial / Next | Success copy should remain bounded. |
| Report Discomfort | `app/workout/[sessionId]/exercise/[exerciseId]/safety/page.tsx` | Implemented / Partial | Safety copy must remain plain and calm. |
| Exercise Actions Sheet | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` | Implemented / Partial | Sheet layout must respect safe areas. |
| Fullscreen Media | `app/exercises/[exerciseId]/page.tsx` | Future | This is the screen most affected by malformed Stitch crops. |
| No-Media Fallback | `app/exercises/[exerciseId]/page.tsx` | Future | Use a neutral semantic placeholder, not a decorative fake. |

## Slice 24 Reference Index

| Reference screen | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Daily Nutrition 2.0 | `app/nutrition/page.tsx` + `components/nutrition-screen.tsx` | In progress | Prototype hero blocks were too large and needed a compact daily summary. |
| Meal Detail / Options | `components/nutrition-meal-sheet.tsx` | In progress | Use a single sheet for detail, preview, and replacement confirmation. |
| Hydration / Supplements | `components/nutrition-screen.tsx` | In progress | Keep compact and avoid a generic calorie tracker look. |

## Usage Rule

- Treat this index as a reference map only.
- Do not copy prototype defects into the production app.
- Use the canonical design and motion docs when there is any conflict.

## Slice 25 Reference Index

| Reference screen | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Exercise Media Families | `lib/media/*` | Complete | Stitch boards are art direction only; no prototype URLs or HTML should ship. |
| Exercise Fallback | `components/athlex-media.tsx` | Complete | Fallback must remain branded and intentional, not like a broken image. |
| Meal Media Families | `lib/media/*` + `components/nutrition-screen.tsx` + `components/nutrition-meal-sheet.tsx` | Complete | Meal media must preserve identity and avoid recipe drift. |

## Slice 26 Reference Index

| Reference package | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| AthlexForce Global Interaction Authority Board | `docs/INTERACTION_FEEDBACK_SYSTEM.md` + `motion/feedback.ts` + shared feature surfaces | Complete | Treat the approved board as visual/reference authority only. |
| Interaction & Motion Spec v2.1 | `docs/ATHLEXFORCE_CINEMATIC_MOTION_SYSTEM.md` + shared feedback motion helpers | Complete | Stale olive prototype `DESIGN.md` metadata is ignored. |
| interaction_component_tokens.json | `lib/feedback.ts` + component feedback states | Complete | Use canonical AthlexForce tokens and persistence-first behavior. |

## Slice 27 Reference Index

| Reference package | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Slice 27 visual authority package | `Slice 27 inputs and intensity refinement` | Implementation in progress | Imported canonical handoff is in `docs/design-references/slice-27/`. Treat the authority note and source audit there as the source of truth for numeric controls, actual-vs-plan behavior, and discrete RIR/RPE families. |

## Slice 28 Reference Index

| Reference package | Production target | Status | Known artifact |
| --- | --- | --- | --- |
| Slice 28 notification authority package | `Slice 28 web / PWA notifications` | Implementation in progress | Imported canonical handoff is in `docs/design-references/slice-28/`. Treat the authority note, source audit, and boards there as the source of truth for browser capability, permission, quiet hours, and fallback delivery behavior. |
