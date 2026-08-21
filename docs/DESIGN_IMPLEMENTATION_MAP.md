# Design Implementation Map

This map ties the canonical design system to the real repository code.

## Canonical Athlete Loop

`TRAIN -> TRACK -> CHECK-IN -> ADJUST`

## Screen Responsibilities

| Surface | Code path(s) | Status | Responsibility |
| --- | --- | --- | --- |
| Today | `app/page.tsx` | Implemented | Answers "What should I do now?" |
| Calendar | `app/calendar/page.tsx` | Implemented | Answers "What is planned?" |
| Day Detail | `app/day/[date]/page.tsx` | Implemented | Connects the day to workout and nutrition actions. |
| Day Nutrition | `app/day/[date]/nutrition/page.tsx` | Implemented | Day-level nutrition entry point. |
| Workout Overview | `app/workout/[sessionId]/page.tsx` + `components/workout-provider.tsx` | Implemented | Session shell and workout entry. |
| Active Workout | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` + `lib/workout-live-state.ts` + `lib/workout-session-service.ts` + `motion/workout.ts` | Live verified | Logs actual sets and preserves workout state truth. |
| Workout Summary | `app/workout/[sessionId]/summary/page.tsx` + `motion/workout.ts` | Live verified | Summarizes the real completed session. |
| Inputs & Intensity Controls | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` + `components/progress-measurements-screen.tsx` + `components/numeric-controls.tsx` + `lib/numeric-input.ts` | In progress | Shared numeric parsing, stepper controls, discrete RIR selection, and localized validation for workout and progress entry. |
| Exercise Alternatives | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` + `lib/workout-data.ts` | Implemented / partial | Offers swaps that preserve movement intent. |
| Exercise Safety | `app/workout/[sessionId]/exercise/[exerciseId]/safety/page.tsx` + subroutes | Implemented | Handles discomfort and safety responses. |
| Nutrition | `app/nutrition/page.tsx` + `app/day/[date]/nutrition/page.tsx` + `components/nutrition-screen.tsx` + `components/nutrition-meal-sheet.tsx` + `components/nutrition-provider.tsx` + `lib/nutrition-service.ts` | Implemented / upgrading | Answers "What do I need to eat or complete today?" |
| Progress | `app/progress/page.tsx` + `app/progress/*` + `components/progress-*.tsx` + `lib/progress-*.ts` | Implemented | Answers "How am I progressing?" |
| Check-in | `app/progress/check-in/page.tsx` + `app/progress/check-in/completion/page.tsx` + `components/checkin-flow.tsx` | Implemented | Answers "How am I responding?" |
| Profile / Settings | `app/profile/page.tsx` + `app/profile/preferences/*` + `components/profile-settings-flow.tsx` + `components/profile-settings-provider.tsx` | Implemented | Identity, preferences, account, and locale management. |
| Entry / Auth | `app/entry/page.tsx` + `app/login/page.tsx` + `app/auth/callback/route.ts` + `components/auth-provider.tsx` + `lib/auth/*` | Implemented | Secure entry, session restore, and redirect handling. |
| Identity / Relationship | `lib/auth/identity-resolver.ts` + `lib/auth/session-policy.ts` + `lib/coach/coach-relationship-service.ts` + `app/coach/*` | Secure / certified | Keeps capability and relationship data backend-derived. |
| Design Tokens | `app/globals.css` + `app/layout.tsx` | Canonical | Holds the runtime token and font source. |
| Core Motion | `motion/transitions.ts` + `motion/workout.ts` + `motion/useReducedMotion.ts` | Implemented | Shared motion vocabulary and workout choreography. |

## Slice 23 Next Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Exercise detail hero and media | `app/exercises/[exerciseId]/page.tsx` | Next | Add only what the canonical design and motion docs require. |
| Exercise media fullscreen | `app/exercises/[exerciseId]/page.tsx` | Next | Keep semantic fallback behavior when media is unavailable. |
| Alternatives preview and replace confirmation | `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` | Next | Preserve actual history vs prescription history. |
| Coach request / change proposal flow | `components/program-change-proposal-panel.tsx` + `app/api/program-change-proposals/*` | Next | Coach intent must remain authorization-free on the client. |
| No-media fallback | `app/exercises/[exerciseId]/page.tsx` | Next | Use a neutral semantic placeholder, not a fake muscle map. |

## Slice 24 Nutrition Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Daily Nutrition shell | `app/nutrition/page.tsx` + `components/nutrition-screen.tsx` | In progress | Compact daily totals, next meal, hydration, and supplements. |
| Nutrition detail / options sheet | `components/nutrition-meal-sheet.tsx` | In progress | Detail, option preview, and replacement confirmation live here. |
| Nutrition progress calculation | `lib/nutrition-service.ts` | In progress | Snapshot-derived totals must stay truthful after refresh. |
| Nutrition identity gating | `components/nutrition-provider.tsx` + `lib/auth/identity-resolver.ts` | Implemented / in use | Coach-managed vs self-managed behavior should be explicit. |
| Today nutrition teaser | `app/page.tsx` | Next | Keep it concise and derived from real nutrition state. |

## Architecture Invariants

### Prescription vs Actual

- Prescription is the planned training or program.
- Actual is what the athlete really performed.
- Replacing a prescription must never rewrite historical actuals.

### Self Managed vs Coach Managed

- Self-managed athletes can perform allowed direct changes.
- Coach-managed athletes log actual performance normally.
- Prescription-changing action becomes `REQUEST CHANGE`, not direct replacement.
- Selecting coach intent does not grant coach authorization.

### Design Constraints

- Keep one primary CTA per screen.
- Keep helper copy muted.
- Keep technical copy out of visible athlete flows.
- Reuse the same primitives across Slice 22 and Slice 23.

## Runtime Status Summary

- `Today`, `Calendar`, `Day Detail`, `Nutrition`, `Progress`, and `Profile` are implemented and live.
- `Workout` live flow is implemented and anchored by the Slice 22 runtime motion and persistence layer.
- `Exercise detail` and `replacement` work are documented as the next slice rather than merged into a second design system.
- Slice 25 media targets are complete and production ready.
- Slice 26 feedback and motion targets are complete and production ready.

## Slice 25 Media Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Central media resolver | `lib/media/*` | Complete | Single source for exercise and meal media resolution, fallback, and load-error handling. |
| Exercise media surfaces | `app/workout/[sessionId]/page.tsx` + `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` + `components/exercise-detail-experience.tsx` + `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx` + `app/exercises/page.tsx` | Complete | Workout hero, START / END, fullscreen, alternatives, and library thumbnails share the same resolver. |
| Meal media surfaces | `components/nutrition-screen.tsx` + `components/nutrition-meal-sheet.tsx` | Complete | Nutrition cards and meal detail sheet resolve from the same meal media families. |
| Media QA contract | `tests/*` + live browser QA | Complete | Validate missing-media, load-error, crop, and responsive fallback behavior. |

## Slice 26 Feedback and Motion Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Canonical interaction feedback system | `lib/feedback.ts` + `components/feedback-provider.tsx` + `docs/INTERACTION_FEEDBACK_SYSTEM.md` | Complete | Standardize persistence-first feedback, hierarchy, dedupe, and toast policy. |
| Shared feedback motion helpers | `motion/feedback.ts` + affected feature components | Complete | Centralize confirmation-sheet, KPI, contextual success, and preparing-motion choreography. |
| Feedback/motion specialist routing | `.agents/feedback-motion-system.md` + `AGENT_ROUTING.md` | Complete | Route slice-specific motion and feedback work through the shared specialist. |

## Slice 27 Inputs & Intensity Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Shared numeric control family | `components/numeric-controls.tsx` + `lib/numeric-input.ts` | In progress | Centralizes locale-aware parsing, stepper behavior, RIR chips, and discrete RPE wiring. |
| Workout logger inputs | `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx` + `components/workout-provider.tsx` + `lib/workout-session-service.ts` | In progress | Actual set logging now uses the shared input family and preserves editable logged sets. |
| Progress measurement inputs | `components/progress-measurements-screen.tsx` + `components/progress-provider.tsx` + `lib/progress-data.ts` + `lib/progress-service.ts` | In progress | Measurement entry now uses the same numeric parser and localized validation copy. |
| Slice 27 handoff import | `docs/design-references/slice-27/` + `docs/INPUTS_INTENSITY_SYSTEM.md` | Complete | Canonical authority package is now checked into the repo as the source of truth for this slice. |

## Slice 28 Notification Targets

| Next target | Code path(s) | Status | Notes |
| --- | --- | --- | --- |
| Notification settings surface | `app/profile/notifications/page.tsx` + `components/notification-settings-screen.tsx` | In progress | Canonical browser capability, permission, subscription, and per-category preference screen. |
| Notification persistence | `lib/notification-preference-service.ts` + `lib/supabase/database.types.ts` + `supabase/migrations/20260820_slice_28_notifications.sql` | In progress | Stores preferences, subscriptions, reminders, and delivery attempts. |
| Push delivery runtime | `public/notification-sw.js` + `supabase/functions/dispatch-notification-reminders/index.ts` | In progress | Service worker and dispatch path for authenticated push delivery. |
| Today fallback reminders | `app/page.tsx` | In progress | Keep a truthful in-app reminder fallback when push is blocked, unsupported, or not yet subscribed. |
| Design authority import | `docs/design-references/slice-28/` | Complete | Canonical Slice 28 authority package and boards are now imported into the repository. |
