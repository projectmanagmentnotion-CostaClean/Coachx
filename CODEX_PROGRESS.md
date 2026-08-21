# COACHX Codex Progress

## Completed

- Public product identity is now AthlexForce; internal repo and technical names remain CoachX where changing them adds no value.
- Bootstrapped a Next.js App Router + TypeScript foundation.
- Implemented the AthlexForce shell with mobile-first styling, safe-area handling, bottom navigation, and centralized design tokens.
- Added a GSAP motion layer with reduced-motion support.
- Implemented the core routes: `/`, `/calendar`, `/day/[date]`, `/progress`, and `/profile`.
- Added the Batch A workout foundation: workout overview, active log, alternatives, summary, adjust flows, exercise library/detail, and safety flows.
- Centralized the demo day and workout session so the public screens and workout routes share one fixture state.
- Added agent docs and routing guidance under `.agents/`, `AGENTS.md`, and `AGENT_ROUTING.md`.
- Slice 5 is now complete and live verified for progress persistence + private photos.
- Added the recommendation application engine boundary so AI recommendations now flow through typed change proposals, explicit preview, and transactional apply rather than mutating program state directly.
- Slice 9 is now complete and live verified for the coach panel foundation: coach login, assignment-scoped athlete access, bounded athlete detail, coach review actions, recommendation decisions, proposal decisions, and coach audit events.

## Visual Fidelity Pass

- `Today` — MATCHED TO STITCH
- `Calendar` — MATCHED TO STITCH
- `Day Detail` — MATCHED TO STITCH
- `Progress` — TEMPORARY
- `Profile` — MATCHED TO STITCH
- `Workout Overview` — MATCHED TO STITCH
- `Active Log` — MATCHED TO STITCH
- `Exercise Library` — MATCHED TO STITCH
- `Exercise Detail` — MATCHED TO STITCH
- `Adjust Workout` — MATCHED TO STITCH
- `Safety Flow` — MATCHED TO STITCH
- `Workout Summary` — MATCHED TO STITCH

## Visual corrections made

- Replaced the remote profile portrait with a local placeholder avatar asset so the UI renders reliably offline.
- Tightened mobile spacing and button widths to avoid overlap in the 390px viewport.
- Kept the black/charcoal section rhythm inside the Stitch layout instead of changing page composition.
- Added local favicon and Apple touch icon assets to remove the remaining public-brand 404 for standalone and browser installs.
- Added a semantic workout anatomy path so posterior lower-body work no longer resolves to an anterior torso visual.
- Removed duplicated fixture values by deriving all workout screens from one shared demo session.
- Added a temporary exercise placeholder asset for missing approved imagery.

## GSAP corrections

- Centralized screen and card entrances in `motion/transitions.ts`.
- Scoped transitions through `components/screen.tsx` instead of scattering motion calls.
- Added `prefers-reduced-motion` handling in `motion/useReducedMotion.ts`.
- Extended the shared motion targets to cover the new workout, library, and safety surfaces.

## Responsive corrections

- Preserved safe-area padding for iPhone-style bottom navigation.
- Kept sticky CTAs and the bottom nav aligned to the 390px mobile target.
- Verified no horizontal overflow in the implemented routes during the 390px pass.
- Kept the workout shell and new flows within the same 390px mobile grid as the existing Stitch-backed screens.

## Placeholder assets

- `public/coachx-avatar.svg` is a development placeholder, not final brand photography.
- `public/exercise-placeholder.svg` is a development placeholder, not final exercise imagery.

## Remaining differences

- `/progress` is still a synthesized temporary screen because the Stitch ZIP did not contain a dedicated Progress export or asset set.
- The avatar art is a temporary local placeholder until an approved athlete asset exists.
- The exercise placeholder art remains temporary until approved Stitch assets are available for every movement family.
- Coach Panel routes are now live verified for the assigned-athlete path; the remaining future work is broader coach operations expansion, not the Slice 9 foundation.

## Batch 9 — Coach Panel

- Verified with a disposable active coach, assigned athlete, and unassigned athlete.
- Confirmed `/coach`, `/coach/athletes`, `/coach/athletes/[athleteId]`, `/coach/athletes/[athleteId]/check-ins`, `/coach/athletes/[athleteId]/recommendations`, `/coach/reviews`, and `/coach/profile`.
- Confirmed anonymous users are redirected out of Coach Panel routes and unassigned athletes remain blocked.
- Confirmed `coach_mark_checkin_reviewed`, `coach_decide_recommendation`, and `coach_decide_program_change_proposal` work on assigned athletes and write `coach_action_events`.
- Confirmed coach review notes persist and athlete-submitted responses remain unchanged.
- Confirmed recommendation approval does not mutate the active program; proposal approval remains separate from apply.

## Stitch fidelity

- Used `coachx_today`, `coachx_calendar`, `coachx_day_detail`, and `coachx_profile_final_review` as the main visual references.
- Used `coachx_workout_overview` patterns for workout card treatment.
- Used the master `DESIGN.md` for shared color, spacing, and typography rules.
- Used the Batch A Stitch exports for workout overview, active log, alternatives, summary, adjust, exercise library/detail, and safety screens.

## Files changed

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/calendar/page.tsx`
- `app/day/[date]/page.tsx`
- `app/progress/page.tsx`
- `app/profile/page.tsx`
- `app/exercises/page.tsx`
- `app/exercises/[exerciseId]/page.tsx`
- `app/workout/[sessionId]/page.tsx`
- `app/workout/[sessionId]/exercise/[exerciseId]/page.tsx`
- `app/workout/[sessionId]/exercise/[exerciseId]/alternatives/page.tsx`
- `app/workout/[sessionId]/exercise/[exerciseId]/safety/page.tsx`
- `app/workout/[sessionId]/exercise/[exerciseId]/safety/location/page.tsx`
- `app/workout/[sessionId]/exercise/[exerciseId]/safety/resolution/page.tsx`
- `app/workout/[sessionId]/adjust/page.tsx`
- `app/workout/[sessionId]/adjust/shorter/page.tsx`
- `app/workout/[sessionId]/adjust/reorganize/page.tsx`
- `app/workout/[sessionId]/adjust/updated/page.tsx`
- `app/workout/[sessionId]/summary/page.tsx`
- `components/screen.tsx`
- `components/ui.tsx`
- `lib/coachx-data.ts`
- `lib/workout-data.ts`
- `motion/transitions.ts`
- `motion/useReducedMotion.ts`
- `AGENTS.md`
- `AGENT_ROUTING.md`
- `.agents/frontend-stitch.md`
- `.agents/visual-qa.md`
- `.agents/architecture-typescript.md`
- `.agents/qa-testing.md`
- `README.md`
- `ROADMAP.md`
- `CODEX_AUTONOMOUS_PHASE1.md`
- `docs/COACHX_VISUAL_SYSTEM_UPDATE.md`
- `CODEX_PROGRESS.md`
- `public/manifest.json`
- `public/coachx-icon.svg`
- `public/coachx-avatar.svg`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/icon.png`
- `public/stitch-assets/hip_thrust.png`
- `public/stitch-assets/romanian_deadlift.png`

## Routes implemented

- `/`
- `/calendar`
- `/day/[date]`
- `/progress`
- `/profile`
- `/exercises`
- `/exercises/[exerciseId]`
- `/workout/[sessionId]`
- `/workout/[sessionId]/exercise/[exerciseId]`
- `/workout/[sessionId]/exercise/[exerciseId]/alternatives`
- `/workout/[sessionId]/exercise/[exerciseId]/safety`
- `/workout/[sessionId]/exercise/[exerciseId]/safety/location`
- `/workout/[sessionId]/exercise/[exerciseId]/safety/resolution`
- `/workout/[sessionId]/adjust`
- `/workout/[sessionId]/adjust/shorter`
- `/workout/[sessionId]/adjust/reorganize`
- `/workout/[sessionId]/adjust/updated`
- `/workout/[sessionId]/summary`

## Components implemented

- `Screen`
- `BottomNav`
- `Card`
- `Section`
- `PrimaryButton`
- `SecondaryButton`
- `IconButton`
- `StatTile`
- `WorkoutShell`

## Mock data

- Centralized in `lib/coachx-data.ts`.
- Uses typed fixtures for today, calendar days, progress metrics, profile sections, and workout movements.
- Keeps the UI independent from production Supabase data.

## Validation

- `pnpm typecheck` via bundled Node: passed.
- `pnpm lint` via bundled Node: passed.
- `pnpm build` via bundled Node: passed.

## Slice 1 Live Supabase Verification

- Disposable authenticated user: `mywebproyectnow+coachx-1786268784498@gmail.com`.
- Sign-up now returns an immediate authenticated session with `user_id = 218224e2-9b87-480c-b453-f7e2e93269d0`.
- `athlete_profiles` and `athlete_preferences` each exist once for that user, and both rows share the same auth user ID.
- RLS allows the authenticated owner to read/write their own rows and blocks anonymous writes.
- Onboarding completes into Supabase, including `onboarding_status = completed` and a populated `onboarding_completed_at`.
- Remote profile and preference data now restore into the UI after refresh/re-sign-in; profile editors hydrate from the saved Supabase snapshot instead of staying on stale fixture state.
- Harmless profile edits persist to the same remote row without mutating the active program automatically.
- The authenticated owner can sign out and return to protected route redirects, then sign in again and restore the remote state.

## Slice 3 Live Supabase Verification

- Workout persistence is live against Supabase for the authenticated test user in project `zlblnezbbiimapruazvc`.
- `workout_sessions`, `workout_session_exercises`, `workout_sets`, and `complete_workout_session(...)` exist live.
- Starting a scheduled workout creates exactly one `in_progress` session and does not duplicate on refresh or repeat entry.
- Incremental set saves persist remote rows immediately and restore after refresh.
- Exercise swaps preserve prescribed identity while updating performed identity and retaining completed sets.
- Workout completion persists `workout_sessions.status = completed`, `completed_at`, and the linked `scheduled_workouts.status = completed`.
- Logout/login restore still retrieves the completed session history and previous-performance data from the persisted workout rows.
- Anonymous RLS blocks workout data writes, and the verified flow does not rely on any service-role bypass.
- Slice 3 is `COMPLETE + LIVE VERIFIED`.

## Slice 4 Live Supabase Verification

- Nutrition persistence is live against Supabase for the same authenticated test user in project `zlblnezbbiimapruazvc`.
- `nutrition_plans`, `nutrition_days`, `nutrition_meal_slots`, `nutrition_meal_options`, `nutrition_day_selections`, `nutrition_hydration_logs`, and `nutrition_supplement_logs` exist live.
- Training-day and rest-day nutrition contexts derive from the persisted program/calendar boundary.
- Nutrition plan targets, day snapshot targets, meal-slot options, meal selections, hydration logs, and supplement completion state persist remotely and restore after refresh.
- Historical day snapshots remain stable and are not rewritten by later plan changes.
- Anonymous RLS blocks private nutrition data writes, and the live browser flow restores from Supabase rather than treating localStorage as authoritative.
- localStorage remains a cache/fallback only for unauthenticated/demo scenarios.
- Slice 4 is `COMPLETE + LIVE VERIFIED`.

## Slice 8 Local Implementation

- Added `program_change_proposals` and `program_change_events` as the durable recommendation-application boundary.
- Implemented typed recommendation-to-proposal mapping for exercise swaps, set adjustments, rep-range adjustments, workout reschedules, and phase extensions.
- Added explicit preview and apply routes so accepting a recommendation remains separate from applying a program change.
- Added a shared proposal preview panel to the phase review flow.
- Added transactional application support through the `apply_program_change_proposal(...)` RPC boundary.
- Added local tests for typed previews, stale proposal rejection, idempotent apply behavior, and historical integrity.
- Validation currently passes locally with `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Live Supabase verification for Slice 8 is still pending.

## Batch A Live QA

- Preview URL: `https://coachx-33007opj6-projectmanagmentnotion-costacleans-projects.vercel.app`
- Flows verified in deployed HTML: `/`, `/calendar`, `/day/2026-08-08`, `/workout/coachx-demo-session`, `/exercises`, exercise detail, adjust flow, summary, and rest-day state.
- Viewport review: a 390px browser render exposed a Today CTA collision; the CTA now flows normally on Today/Day Detail while workout flows keep their sticky action.
- Issues fixed: Today page sticky CTA collision, plus the live preview was redeployed from commit `fda2b20`.
- Remaining temporary assets: `public/coachx-avatar.svg`, `public/exercise-placeholder.svg`, and the provisional `Progress` screen.

## Known differences from Stitch

- The `Progress` screen remains temporary until a dedicated Stitch export is available.
- The avatar art is a temporary local placeholder until an approved athlete asset exists.
- The exercise placeholder art remains temporary until approved Stitch assets are available for every movement family.

## Blockers

- None currently.

## Next autonomous action

- Refine shared primitives only if a newly implemented Stitch screen demands them, or connect the existing data layer to Supabase behind the current interfaces.

## Batch B — Nutrition

### Visual Fidelity Pass

- `Daily Nutrition` — MATCHED TO STITCH
- `Meal Options` — TEMPORARY / PROVISIONAL

### Visual corrections made

- Added a shared nutrition fixture layer so Today, Day Detail, and Nutrition all derive from the same demo day data.
- Implemented the physical `/day/[date]/nutrition` screen from the v2 export structure.
- Kept Meal Options provisional and lightweight, with a confirmable chooser flow instead of a redesigned surface.
- Reused the exported breakfast image locally as a hostable asset instead of relying on a remote dependency.

### GSAP corrections

- Extended the shared screen motion targets to include the nutrition surfaces and chooser.
- Added a restrained nutrition sheet entrance that respects `prefers-reduced-motion`.

### Responsive corrections

- Kept the nutrition shell inside the same iPhone-first 390px layout grid.
- Preserved safe-area-aware spacing for the sticky shell and chooser.
- Kept the nutrition cards and sheet touch targets at mobile-friendly sizes.

### Placeholder assets

- `public/stitch-assets/nutrition-breakfast.png` is a locally hosted export asset for the meal card image.

### Remaining differences

- `Meal Options` remains provisional until Stitch provides a dedicated physical export.
- `/progress` remains temporary.

### Batch B Live QA

- 375px, 390px, and 430px route sweeps showed no horizontal overflow.
- 390px routes tested: `/`, `/calendar`, `/day/2026-08-08`, `/day/2026-08-08/nutrition`, `/progress`, `/profile`.
- `390px` screenshots reviewed for `/day/2026-08-08` and `/day/2026-08-08/nutrition`.
- Local mobile render is clean after the nutrition typography fix.
- Preview deployment URL: `https://coachx-gn2kd2nb7-projectmanagmentnotion-costacleans-projects.vercel.app`
- Live preview is currently gated at `/login` in anonymous/headless browser sessions, so browser-side QA on the hosted preview remains blocked by external access protection.

## Batch C — Progress + Reviews

### Visual Fidelity Pass

- `Measurements Update` â MATCHED TO STITCH
- `Progress Photos` â MATCHED TO STITCH
- `Detailed Trends` â MATCHED TO STITCH
- `Phase Review` â MATCHED TO STITCH
- `Progress` â TEMPORARY / provisional hub only

### Visual corrections made

- Added a centralized progress data/provider layer so measurements, photos, trends, and phase review all share one fixture-backed state.
- Implemented the physical Batch C routes: `/progress/measurements`, `/progress/measurements/success`, `/progress/photos`, `/progress/photos/capture/[pose]`, `/progress/photos/compare`, `/progress/trends`, and `/progress/phase-review`.
- Kept `/progress` as the provisional entry hub and did not redesign it into a false Stitch match.
- Added local placeholder progress-photo SVG assets instead of relying on remote imagery.
- Added the measurement guidance modal, photo preparation guidance, accessible compare slider fallback, and review decision controls.
- Normalized the measurement decimal input so it renders as `72.8` instead of a locale comma variant.
- Fixed a stale localStorage photo asset reference that was producing a 404 on the capture screen.

### GSAP corrections

- Extended the shared motion targets to include the new progress surfaces, comparison cards, and review cards.
- Kept screen entry and card motion restrained and transform-based.
- Preserved reduced-motion handling across the new Batch C surfaces.

### Responsive corrections

- Verified 375px, 390px, and 430px layouts for the Batch C routes.
- Removed the measurement screen overflow caused by the numeric input width.
- Kept the capture, compare, and review flows inside the same iPhone-first shell with safe-area-aware fixed actions.

### Placeholder assets

- `public/progress-photo-front.svg` is a development placeholder.
- `public/progress-photo-side.svg` is a development placeholder.
- `public/progress-photo-back.svg` is a development placeholder.

### Remaining differences

- `/progress` is still provisional because the Stitch ZIP does not contain a dedicated physical export for the main dashboard.
- The progress-photo assets are local placeholders until approved production imagery exists.
- The review photos are fixture-backed mock comparisons, not camera captures.

### Batch C validation

- `pnpm typecheck` via bundled Node: passed.
- `pnpm lint` via bundled Node: passed.
- `pnpm build` via bundled Node: passed.
- 375px, 390px, and 430px browser sweeps: no horizontal overflow and no console errors on the implemented routes.
- 390px screenshots reviewed for `/progress/measurements`, `/progress/measurements/success`, `/progress/photos`, `/progress/photos/capture/front`, `/progress/photos/compare`, `/progress/trends`, and `/progress/phase-review`.


## Batch D ??? Onboarding + Program

### Screens implemented

- `Entry` ??? provisional login / entry flow
- `Onboarding` ??? intro
- `Profile` ??? name, age, height, weight, units
- `Goals` ??? main goal and reorderable priorities
- `Training Experience` ??? experience, confidence, loads, and movement familiarity
- `Training Preferences` ??? weekly structure, duration, equipment, style, and movement preferences
- `Schedule & Lifestyle` ??? work pattern, sleep, energy, hydration, and reminders
- `Health & Limitations` ??? calm private limitation capture with coach review detection
- `Nutrition Preferences` ??? safety-first preference capture with allergy priority preserved
- `Baseline` ??? measurements and optional private progress photo setup
- `Final Review` ??? edit-before-build summary
- `Building Your Plan` ??? deterministic processing state
- `Plan Reveal` ??? proposed phase, structure, and activation CTA
- `Program Overview` ??? active plan summary

### Routes

- `/entry`
- `/onboarding`
- `/onboarding/profile`
- `/onboarding/goals`
- `/onboarding/training-experience`
- `/onboarding/training-preferences`
- `/onboarding/schedule`
- `/onboarding/health`
- `/onboarding/nutrition`
- `/onboarding/baseline`
- `/onboarding/review`
- `/onboarding/building-plan`
- `/onboarding/plan-ready`
- `/program`

### Reused components

- `Screen`
- `Card`
- `PrimaryButton`
- `SecondaryButton`
- `ChoiceButton`
- `PillToggle`
- `OnboardingStepHeader`
- `OnboardingStickyActions`
- `ProgressProvider`
- `OnboardingProvider`

### Data models

- `AthleteProfile`
- `GoalProfile`
- `TrainingExperience`
- `TrainingPreferences`
- `ScheduleLifestyle`
- `HealthLimitations`
- `NutritionPreferences`
- `BaselineState`
- `OnboardingProgress`
- `ProgramState`
- `ProgramRecommendation`

### Conditional logic

- Progression through onboarding preserves state when moving Back or resuming later.
- `coachReviewRequired` becomes true for meaningful limitation language and remains calm/private in the UI.
- Allergy and restriction safety remain above preference and variety.
- `START MY PROGRAM` activates the fixture program state and seeds the progress baseline.
- `ENTRY` routes new users to onboarding, incomplete users to resume, and completed users back to Today.

### Baseline integration

- Onboarding baseline measurements and photos hydrate the existing progress fixture store.
- Baseline photos remain optional and private by default.
- No duplicate baseline architecture was introduced.

### Program activation

- `Plan Reveal` keeps the program in `proposed` state until confirmation.
- `START MY PROGRAM` transitions the fixture program to `active` and routes to Today.
- `Program Overview` reflects the same typed program state.

### Accessibility

- Semantic headings are present on each implemented route.
- Buttons remain real buttons with labels, not gesture-only controls.
- Browser Back / visible Back / iOS edge-back remain coherent where possible.
- Large-text wrapping and 44px touch targets were preserved.

### GSAP

- Reused the centralized motion layer for onboarding and program cards.
- Kept transitions restrained: fade/translate on enter and small card staggers.
- Preserved reduced-motion behavior.

### Viewport QA

- 375px, 390px, and 430px mobile passes were rerun on the onboarding and program routes.
- No horizontal overflow was found on `/`, `/entry`, `/onboarding`, `/onboarding/profile`, `/onboarding/review`, `/onboarding/plan-ready`, or `/program`.

### Remaining gaps

- `Entry` remains provisional because there is no standalone physical Stitch export for welcome/login.
- Production auth is not connected yet.
- `Meal Options` and the main `/progress` dashboard remain provisional from earlier batches.


## Batch E — Profile, Notifications & Athlete MVP QA

### Screens implemented

- `Profile Preferences` hub for the editorial profile sections
- `Personal Details` profile editor
- `Goals & Priorities` editor
- `Training Preferences` editor
- `Schedule & Lifestyle` editor
- `Nutrition Preferences` editor
- `Health & Limitations` editor
- `Program Impact Review`
- `Notifications & Reminders`
- `Profile` hub remains provisional and now links into the editing flow

### Routes

- `/profile`
- `/profile/preferences`
- `/profile/preferences/personal`
- `/profile/preferences/goals`
- `/profile/preferences/training`
- `/profile/preferences/schedule`
- `/profile/preferences/nutrition`
- `/profile/preferences/health`
- `/profile/notifications`
- `/profile/program-impact-review`

### Reused components and shared state

- `ProfileSettingsProvider`
- `useProfileSettingsStore`
- `Screen`
- `Card`
- `ChoiceButton`
- `PillToggle`
- `PrimaryButton`
- `SecondaryButton`
- `OnboardingProvider` data slices for:
  - `AthleteProfile`
  - `GoalProfile`
  - `TrainingPreferences`
  - `ScheduleLifestyle`
  - `HealthLimitations`
  - `NutritionPreferences`
- `ProfileSnapshot`
- `NotificationSettings`
- `ProfileImpactReview`

### Data and impact model

- Profile edits reuse the same underlying onboarding domain shapes instead of a second profile architecture.
- `PROFILE CHANGE → IMPACT DETECTED → RECOMMENDATION → VALIDATION / REVIEW → PROGRAM CHANGE` is now represented as a typed fixture flow.
- Impact classes are deterministic: `NO_IMPACT`, `MINOR_REVIEW`, `PROGRAM_ADJUSTMENT_RECOMMENDED`, `COACH_REVIEW_REQUIRED`.
- Nutrition safety keeps allergy / restriction / intolerance priority above preference and variety.
- Program mutation only happens after explicit confirmation; recommendation does not equal application.

### Notifications

- Master notification toggle preserves per-category selections when paused.
- Permission state is modeled explicitly as `NOT_REQUESTED`, `ALLOWED`, or `DENIED`.
- Quiet hours, reminder intensity, and per-category reminder scopes are fixture-backed and accessible.
- Reminder state is separated from the underlying task/program state.

### Accessibility and iOS navigation

- Semantic switches use `role="switch"` with `aria-checked`.
- Focus remains on visible controls and dialogs expose real headings/buttons.
- Browser Back / visible Back / iOS edge-back remain coherent where feasible.
- Large-text wrapping and 44px touch targets were preserved on the new screens.

### GSAP

- New profile screens reuse the centralized motion system.
- Motion stays restrained: fade/translate on enter and subtle card staggers.
- Reduced-motion behavior remains intact.

### Validation

- `pnpm typecheck` via bundled Node: passed.
- `pnpm lint` via bundled Node: passed.
- `pnpm build` via bundled Node: passed.
- `pnpm test` via bundled Node: passed.
- 375px, 390px, and 430px browser sweeps: no horizontal overflow and no console errors on `/`, `/calendar`, `/day/2026-08-08`, `/progress`, `/profile`, `/profile/preferences`, `/profile/notifications`, and `/profile/program-impact-review`.

### Remaining provisional / temporary states

- `/profile` is still the provisional hub because the main Profile & Settings screen does not have a standalone physical export.
- `Profile Preferences` editing screens are matched where a physical export exists; the hub itself remains an integration surface.
- The app still uses local fixture persistence for profile settings and notifications.
- Earlier Batch C limitations still apply: `/progress` remains provisional until its dedicated physical Stitch export exists.

## Batch E — Profile, Notifications & Athlete MVP QA

### Screens and routes

- Profile preferences hub: `/profile/preferences`
- Personal information editor: `/profile/preferences/personal`
- Goals and priorities editor: `/profile/preferences/goals`
- Training preferences editor: `/profile/preferences/training`
- Schedule and lifestyle editor: `/profile/preferences/schedule`
- Nutrition preferences editor: `/profile/preferences/nutrition`
- Health and limitations editor: `/profile/preferences/health`
- Notifications and reminders: `/profile/notifications`
- Program impact review: `/profile/program-impact-review`

### Shared state and models

- Reused the Batch D onboarding domains as the single source of truth:
  - `AthleteProfile`
  - `GoalProfile`
  - `TrainingExperience`
  - `TrainingPreferences`
  - `ScheduleLifestyle`
  - `HealthLimitations`
  - `NutritionPreferences`
- Added typed profile settings state for saved snapshot, draft review, notification settings, and save status.
- Added deterministic impact classification for `NO_IMPACT`, `MINOR_REVIEW`, `PROGRAM_ADJUSTMENT_RECOMMENDED`, and `COACH_REVIEW_REQUIRED`.

### Program safety

- Profile edits now flow through `PROFILE CHANGE â†’ IMPACT DETECTED â†’ RECOMMENDATION â†’ VALIDATION / REVIEW â†’ PROGRAM CHANGE`.
- Recommendation does not equal application.
- Goal, schedule, equipment, nutrition safety, and health changes can raise review states without mutating the active program.
- Allergy and restriction changes escalate to coach review instead of silently rewriting the meal plan.

### Notifications

- Implemented master notifications control with category-level reminder persistence.
- Modeled permission state, reminder intensity, and quiet hours as fixture-backed state.
- Reminder toggles remain separate from the underlying workout, measurement, or review tasks.

### Accessibility and iOS QA

- Semantic switches, dialog headings, labels, and status text were verified on the new flows.
- Focus management remains predictable across editor open, save, review, and unsaved-change confirmation states.
- Browser Back, visible Back, and iOS edge-back remain coherent where feasible.
- 375px, 390px, and 430px sweeps stayed within viewport with no horizontal overflow.

### Motion

- New flows reuse the shared GSAP motion layer.
- Animation remains restrained: enter fades, light translate, subtle stagger, and low-key success transitions.
- Reduced-motion support remains intact.

### Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.
- `pnpm test`: passed.
- Mobile smoke checks: passed on `/`, `/calendar`, `/day/2026-08-08`, `/progress`, `/profile`, and all Batch E editor routes.

### Remaining provisional / temporary states

- `/profile` stays provisional as the hub for the editing flows.
- `Notifications & Reminders` is fixture-backed until production permission and push delivery exist.
- Active program changes still require explicit confirmation; no automatic program rewrite was added.

## Batch F â€” Weekly Check-in + Notifications + Review Workflow

### Screens and routes

- Weekly check-in entry: `/progress/check-in`
- Weekly check-in completion: `/progress/check-in/completion`
- Notifications and reminders: `/profile/notifications`
- Program impact review: `/profile/program-impact-review`

### Shared state and models

- Added typed weekly check-in domains for:
  - weekly check-in window resolution
  - question definitions
  - response drafts
  - review summaries and recommendation signals
- Added typed notification preference helpers for:
  - master notifications toggle
  - category toggles
  - reminder intensity
  - quiet hours
- Reused the existing profile, program, and athlete state boundaries instead of introducing duplicate authorities.

### Workflow

- Weekly check-in now follows a single sequential review flow with deterministic summary signals.
- Check-in responses persist per question and restore on revisit.
- Completion creates a review summary without mutating the active program automatically.
- Notification preferences persist separately from device/browser permission state.
- Profile review keeps recommendation and application separate.

### Accessibility and motion

- Semantic headings, real buttons, switch roles, and status text were kept intact.
- The new flow reuses the shared GSAP motion layer with restrained entry, stagger, and completion motion.
- Reduced-motion support remains intact.
- Browser Back, visible Back, and iOS edge-back remain usable where feasible.

### Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.

### Remaining provisional / temporary states

- Live Supabase verification for Slice 6 is now complete for the current disposable athlete:
  - `weekly_checkins`
  - `weekly_checkin_responses`
  - `weekly_checkin_reviews`
  - `notification_preferences`
- Submitted check-ins, check-in reviews, and notification preferences are now authoritative in Supabase for authenticated athletes.
- LocalStorage remains only a fallback/demo cache for legacy fixture state; it is not authoritative for submitted check-ins or notification preferences.


## Batch F ??? Supabase Migration Slice 2 ??? Program + Calendar Persistence

### Persistence scope

- Added Supabase persistence for the active program graph:
  - `programs`
  - `program_phases`
  - `workout_templates`
  - `workout_template_exercises`
  - `scheduled_workouts`
- Introduced a dedicated `ProgramProvider` so Today, Calendar, Day Detail, Profile, Program, and Workout hydrate from the same bundle.
- Added a single service boundary in `lib/program-service.ts` for loading, saving, activating, and rescheduling program data.
- Added migration SQL for the five program/calendar tables with ownership policies and active-program constraints.

### Routes and flows

- `Today`, `Calendar`, `Day Detail`, `Program`, and the workout session route now derive from the same program bundle.
- Workout sessions hydrate from the scheduled workout record instead of a hardcoded day/session fixture.
- The onboarding completion path seeds the active program bundle through the shared service boundary.

### Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.
- `pnpm test`: passed.

### Environment

- Local Supabase environment variables are present in `.env.local` for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Live verification

- The authenticated browser session now hydrates from the live Supabase-backed program bundle.
- `Today`, `Calendar`, `Day Detail`, and `Program` all read from the remote program graph instead of the old hardcoded day/session fixture.
- The current authenticated user is restored as `mywebproyectnow+coachx-1786268784498@gmail.com`.
- A real workout session route hydrates from the scheduled workout id, and the session links no longer point at the demo session after the client finishes loading.
- Rescheduling the workout to Tuesday persisted remotely; after refresh, `/day/2026-08-11` reflects the moved workout while `/day/2026-08-09` remains a rest day.

### Remaining provisional / temporary states

- `Profile` remains a provisional hub from the prior batch where the main Stitch export was not available.
- The existing fixture/demo fallback still exists for unauthenticated or unconfigured states.


## Batch G — Supabase Migration Slice 3 — Workout Session + Set Persistence

### Persistence scope

- Added Supabase persistence for workout execution history:
  - `workout_sessions`
  - `workout_session_exercises`
  - `workout_sets`
- Added a dedicated `workout-session-service` boundary for create/resume, incremental set saves, exercise swaps, and workout completion.
- The workout provider now treats Supabase-backed session state as authoritative for authenticated flows and keeps localStorage as cache only.

### Routes and flows

- `/workout/[sessionId]` now hydrates a remote workout session from the scheduled workout and template bundle.
- `/workout/[sessionId]/exercise/[exerciseId]` now awaits remote set persistence before advancing to workout completion.
- Exercise swaps preserve the prescribed exercise identity while updating the performed exercise identity remotely.
- Session completion uses the `complete_workout_session` RPC and persists the completed session back to Supabase.

### Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.

### Test coverage

- Added targeted tests for:
  - set save deduplication
  - exercise completion rules
  - prescribed vs performed identity preservation
  - workout completion RPC boundary

### Remaining provisional / temporary states

- Live authenticated Supabase verification still depends on the remote preview/session state.
- Rest timer behavior remains client-side only by design.
- The fixture/demo fallback still exists for unauthenticated or unconfigured states.

## Slice 3 Status

- IMPLEMENTED
- LIVE VERIFICATION PENDING
- Live Supabase auth/profile verification succeeded for the current disposable athlete, including onboarding completion and persisted `athlete_profiles` / `athlete_preferences` rows.
- Live workout persistence verification is currently blocked because the Supabase project does not expose `public.workout_sessions`, `public.workout_session_exercises`, `public.workout_sets`, or `public.complete_workout_session(session_id)` through the live schema cache.

## Slice 4 — Nutrition Persistence

- LOCAL IMPLEMENTATION COMPLETE
- LIVE MIGRATION PENDING
- LIVE VERIFICATION PENDING
- Added a normalized nutrition snapshot boundary for:
  - `nutrition_plans`
  - `nutrition_days`
  - `nutrition_meal_slots`
  - `nutrition_meal_options`
  - `nutrition_day_selections`
  - `nutrition_hydration_logs`
  - `nutrition_supplement_logs`
- Training-day versus rest-day nutrition now derives from the program/calendar boundary rather than an independent hardcoded day switch.
- Meal selections, eaten/completed state, hydration, and supplements are modeled separately from the immutable daily nutrition snapshot.
- Local nutrition state still persists through the client demo boundary until the Supabase migration is applied later.

## Batch E — Progress Persistence + Private Photos

### Local implementation

- Added a progress persistence service boundary for:
  - `progress_entries`
  - `progress_measurements`
  - `progress_photos`
- Added private progress-photo storage support through the `progress-photos` bucket and signed URL hydration.
- Kept the `ProgressProvider` thin by loading Supabase-backed progress state when available and falling back to the local demo cache only when remote data is unavailable.
- Kept the existing Progress UI intact while wiring the underlying data flow to persisted measurements, photo metadata, and history snapshots.

### Routes and flows

- `/progress` now reads the shared progress store instead of the hardcoded demo singleton.
- `/progress/measurements` persists weight plus centimeter measurements as remote progress entries.
- `/progress/photos` and `/progress/photos/capture/[pose]` now support file input, private uploads, signed URLs, and replace/delete semantics.
- `/progress/photos/compare` now compares the persisted baseline/current pose data rather than a demo-only placeholder.
- `/progress/trends` and `/progress/phase-review` now derive their display state from persisted measurement history and photo checkpoints where available.

### Baseline behavior

- Onboarding completion seeds the baseline progress history idempotently.
- The baseline seed uploads the demo placeholder images into the private `progress-photos` bucket so the public app can still render a private comparison set until real athlete photos replace it.
- LocalStorage is now a user-scoped cache/fallback rather than the shared authority for authenticated progress data.

### Remaining provisional states

- Live Supabase verification now reaches the progress tables, and authenticated measurement inserts and updates succeed.
- The live `progress-photos` Storage bucket is present and private, and authenticated photo uploads, signed access, owner isolation, refresh restore, replacement, and compare flows now pass live verification.
- The dedicated `progress_photos` RLS fix migration is in place to enforce both photo ownership and parent `progress_entries` ownership on insert/update/delete.
- Anonymous reads against the progress tables return empty arrays, which is consistent with RLS.
- The main `/progress` dashboard remains a provisional hub because the Stitch ZIP still does not contain a dedicated physical export for that screen.

## Slice 7 — OpenAI Coach Engine

- Implemented a server-only OpenAI coach engine that generates structured recommendations from bounded athlete context.
- Added `POST /api/coach/recommendations` and `GET /api/coach/recommendations` for authenticated athlete review.
- Persisted recommendation records in `ai_recommendations` with source, generation status, model, structured payload, and application boundary.
- Kept the active program separate from recommendation application; recommendations remain review-only until explicitly confirmed.
- Added fallback generation so the UI still receives a valid structured recommendation when OpenAI is unavailable.
- Added `docs/AI_COACH_ENGINE.md` to document the server flow, structured output contract, and safety rules.
- Updated the Supabase migration plan and backend readiness audit to include the new `ai_recommendations` entity.
- Remaining scope is still limited to structured recommendations only; no automated program mutation was added.
- Live production verification confirmed a real OpenAI Responses API generation on Vercel, with persisted and retrievable recommendation rows sourced from `openai`.
- Slice 7 is `COMPLETE + LIVE VERIFIED`.

## Slice 9 â€” Coach Panel Foundation

- Added the first coach-facing route tree:
  - `/coach`
  - `/coach/athletes`
  - `/coach/athletes/[athleteId]`
  - `/coach/athletes/[athleteId]/check-ins`
  - `/coach/athletes/[athleteId]/recommendations`
  - `/coach/reviews`
  - `/coach/profile`
- Added coach-specific services for:
  - coach session loading
  - assignment authorization
  - bounded athlete summaries
  - review/recommendation/proposal action handling
- Added the coach data model and RLS migration file at `supabase/migrations/20260810_coach_panel_foundation.sql`.
- Added deterministic coach policy helpers for:
  - access checks
  - attention queue derivation
  - review/recommendation/proposal action mapping
  - audit metadata
- Validation status:
  - `pnpm typecheck`: passed
  - `pnpm lint`: passed
  - `pnpm test`: passed
  - `pnpm build`: passed
- Remaining provisional / temporary states:
  - Coach Panel foundation is local-only until the migration is executed in live Supabase.
  - Assigned coach data will remain empty until coach profiles and assignments are created in Supabase.
  - Progress photos remain excluded from Coach Panel v1 by design.

## Slice 9 Security Hardening

- Added a new repo-first hardening migration at `supabase/migrations/20260810_coach_panel_security_hardening.sql`.
- The hardening migration removes self-promotion via coach-profile insert policy, replaces broad coach updates with narrow security-definer RPCs, and tightens the phase-extension apply path to a one-week increment.
- Live execution of the hardening migration is still pending.

## Slice 10 â€” Production Readiness + Private Beta

- Current preview deployment is ready at `https://coachx-kibgbqqzr-projectmanagmentnotion-costacleans-projects.vercel.app`.
- Verified the AthlexForce entry shell, branding, manifest, icon metadata, and entry route on the deployed preview build.
- Verified the deployed preview includes `/api/coach/recommendations`.
- Fresh athlete sign-up works on the deployed preview and reaches onboarding immediately.
- The onboarding flow advances through profile, goals, training, schedule, health, nutrition, baseline, review, build, and plan reveal.
- The saved athlete state routes to the Today screen after program start.
- Vercel has the Supabase preview and production public environment variables configured.
- `OPENAI_API_KEY` is configured in Vercel production and preview, and a real OpenAI Responses API request now succeeds in production.
- Slice 10 private-beta readiness is now unblocked on the OpenAI requirement; remaining readiness depends on rollout policy rather than missing infrastructure.

## Slice 10 â€” Internationalization + Production Readiness (current)

- Added centralized locale support for `es`, `ca`, `en`, and `de`.
- Persisted athlete locale in Supabase-backed profile snapshots.
- Bootstrapped the HTML `lang` attribute from the stored locale.
- Added locale-aware date and number formatting in the main services.
- Wired the shared locale store into the key athlete, profile, calendar, program, onboarding, and coach shell surfaces.
- Local validation passes:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Remaining work:
  - deploy the current HEAD to the existing Vercel project
  - run live browser smoke checks at the required mobile widths
  - confirm the live deployment reflects the current commit

## Slice 11 â€” Cinematic Frontend / GSAP / Overlay Hardening

- Added the specialized frontend motion agent at `.agents/cinematic-frontend-gsap.md`.
- Captured current GSAP and Awwwards references in `docs/MOTION_REFERENCE_LOG.md`.
- Documented the frontend motion and overlay audit in `docs/FRONTEND_MOTION_AUDIT.md`.
- Documented the slice summary and implementation guardrails in `docs/SLICE_11_CINEMATIC_FRONTEND.md`.
- Hardened viewport-sensitive containers to use `100dvh`/`100svh` fallbacks.
- Tightened modal and sheet sizing so progress and nutrition overlays remain usable when mobile browser chrome changes height.
- Added overflow containment to the primary overlay sheets.
- Local Chrome QA confirmed the live app shell, progress measurements, progress photos, and locale persistence remain stable after the hardening changes.
- Validation passes after the frontend changes:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Production deployment was promoted to `https://coachxsync1.vercel.app` from the current HEAD.

## Slice 13 — Feedback System + Interaction Memory

- Added the specialist agent at `.agents/feedback-interaction-ux.md`.
- Added canonical documentation for the feedback system, interaction audit, and confirmation matrix.
- Added a shared feedback provider and memory layer so key athlete and coach actions can emit consistent success, warning, pending, and error states.
- Began wiring the shared feedback layer into auth, onboarding, workout, progress, check-in, recommendation, profile, and coach actions.
- Kept business logic, persistence, RLS, and RPC boundaries unchanged.


## Slice 16 � Google Sign-In + Secure Session UX

- Added Google OAuth sign-in to the athlete entry flow and kept email/password as the fallback path.
- Added password recovery and password reset screens.
- Added a remembered-session toggle that controls browser session persistence.
- Hardened auth callback handling with safe internal redirects and recovery routing.
- Added `lib/auth/session-policy.ts` and `lib/auth/auth-errors.ts` for safe session and error handling.
- Added `docs/GOOGLE_AUTH_SETUP.md` and `docs/SESSION_POLICY.md`.
- Added `.agents/auth-security-ux.md` and updated `AGENT_ROUTING.md` for auth/security UX routing.
- Verified the new entry, forgot-password, and reset-password screens in the in-app browser at mobile width during local QA.
