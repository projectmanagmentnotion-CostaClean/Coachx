# COACHX Backend Readiness Audit

Date: 2026-08-08

Branch: `codex/phase-1-foundation`

Commit: `2081197`

## Executive Summary

COACHX is in a strong pre-backend state for a Phase 1 athlete MVP, but it is still demo-led rather than persistence-led.

### Readiness

- Qualitative status: **good foundation, moderate production risk**
- Readiness score: **7/10**
- Strongest areas: clean route decomposition, typed feature domains, centralized motion, iPhone-first shell, and clear UI/provider boundaries for each athlete flow
- Biggest risks: duplicated demo state, split profile ownership, hardcoded dates/demo values, and provider-localStorage state that will need to collapse into backend entities

## Current Architecture

### App shell

- Next.js App Router
- Mobile-first, iPhone-optimized shell with `Screen` and a shared bottom nav
- GSAP motion centralized in `motion/`
- PWA metadata already present in `app/layout.tsx`

### Current state layers

- `WorkoutProvider` owns workout session state in localStorage
- `NutritionProvider` owns nutrition day/session state in localStorage
- `ProgressProvider` owns progress measurements/photos/trends/review state in localStorage
- `OnboardingProvider` owns onboarding flow state plus the active proposed/active program
- `ProfileSettingsProvider` owns the saved profile snapshot, notification settings, and pending program-impact review
- `lib/coachx-data.ts` still acts as a legacy aggregate seed for Today/Calendar/Profile/Progress preview screens

### Route families

- Athlete entry/onboarding: `/entry`, `/onboarding/*`
- Core shell: `/`, `/calendar`, `/day/[date]`, `/program`, `/profile`
- Workout flow: `/workout/[sessionId]/*`, `/exercises/*`
- Nutrition flow: `/day/[date]/nutrition`
- Progress flow: `/progress/*`
- Profile editing: `/profile/preferences/*`, `/profile/notifications`, `/profile/program-impact-review`

## State Ownership Map

| Domain | Current owner today | Notes for production |
|---|---|---|
| User / identity | `ProfileSettingsProvider` + `OnboardingProvider` | Split today; should converge on one athlete profile record plus auth identity |
| Onboarding | `OnboardingProvider` | Session-like wizard state; later persisted server-side |
| Goals | `OnboardingProvider`, mirrored in `ProfileSettingsProvider` | Dangerous duplicate until profile edits and onboarding use the same backend entity |
| Training preferences | `OnboardingProvider`, mirrored in `ProfileSettingsProvider` | Same domain, two local stores today |
| Health limitations | `OnboardingProvider`, mirrored in `ProfileSettingsProvider` | Safety-sensitive; should become one server-owned record |
| Nutrition preferences | `OnboardingProvider`, mirrored in `ProfileSettingsProvider`, and consumed by `NutritionProvider` | Current demo architecture is split across profile, onboarding, and nutrition flows |
| Active program | `OnboardingProvider` | Should become a persisted program snapshot and phase state |
| Calendar | Derived from `lib/coachx-data.ts` demo seed | Calendar is presentation/derived state, not a source of truth |
| Scheduled workout | `WorkoutProvider` session seed plus `lib/workout-data.ts` | Needs a persisted schedule entity distinct from execution state |
| Actual workout session | `WorkoutProvider` | This should move to server persistence early because completed sets are primary source data |
| Completed sets | `WorkoutProvider` | Must persist incrementally, not only at summary time |
| Exercise alternatives | `lib/workout-data.ts` + `WorkoutProvider` swap action | Catalog/reference data now; future catalog service |
| Nutrition plan | `lib/nutrition-data.ts` seed + `NutritionProvider` | Needs a persistent plan/day model |
| Meal selections | `NutritionProvider` | Must not be inferred from prescription; this is execution state |
| Hydration | `NutritionProvider` | Session/day fact that belongs in nutrition logs |
| Progress measurements | `ProgressProvider` | Raw measurement entries should persist server-side |
| Progress photos | `ProgressProvider` | Private storage asset metadata + checkpoint records needed |
| Trends | `ProgressProvider` derived state | Derived from raw entries; should not be the primary source of truth |
| Phase review | `ProgressProvider` | Persistent review record needed for phase transitions |
| Notifications / reminders | `ProfileSettingsProvider` | Preferences belong server-side; device permission remains client/device state |
| Program impact changes | `ProfileSettingsProvider` pending review + `OnboardingProvider` program patching | Recommendation must stay separate from applied program changes |

## Duplicate Source-of-Truth Findings

| Duplicate | Risk class | Why it matters |
|---|---|---|
| Athlete name (`Alex`) appears in `lib/coachx-data.ts`, onboarding seed data, progress seed data, and profile settings snapshot | Dangerous duplication | Any backend migration that keeps these as separate literals will drift immediately |
| Phase/date identity repeats across coachx, onboarding, nutrition, progress, and workout seeds | Dangerous duplication | The app currently relies on several files agreeing about the same demo day |
| Nutrition target/macros appear in both `lib/coachx-data.ts` and `lib/nutrition-data.ts` | Dangerous duplication | Calendar/day and nutrition screens must point at one nutrition day entity |
| Workout day identity appears in `lib/coachx-data.ts` and `lib/workout-data.ts` | Dangerous duplication | Today/Calendar/Day Detail can diverge from workout session reality if both remain authoritative |
| Progress metrics exist in `lib/coachx-data.ts` and `lib/progress-data.ts` | Dangerous duplication | Progress preview and detailed progress screens should read from the same progress model |
| Profile snapshot lives in onboarding state and profile-settings state | Dangerous duplication | Profile edits and onboarding are currently two copies of the same athlete preference domain |
| Placeholder assets are reused across multiple screens | Safe duplication | Asset reuse is fine; the risk is only if a placeholder is mistaken for final branding |

## Client vs Server State

### Server source of truth eventually

- Auth identity and user profile
- Athlete goals and preferences
- Active program, phases, and scheduled workouts
- Workout sessions, exercises, completed sets, and adjustment metadata
- Nutrition plans, meal slots, selections, hydration logs
- Measurements, photo checkpoints, and review records
- Notification preferences
- Program change proposals and coach review outcomes

### Client/session state

- Open screen/tab
- Bottom sheet open/close state
- Unsaved edit drafts
- Rest timer countdown
- Current comparison pose/mode
- Input drafts and validation state before save

### Derived state

- Calendar grid and month labels
- Day detail hero/cards from day/program/nutrition seeds
- Trend charts and summary metrics
- Impact review summaries from profile deltas
- Safety labels and status pills

### Ephemeral UI state

- Focus trap state
- Scroll position
- Dialog visibility
- Motion trigger state

## Provider Audit

| Provider | Current responsibility | Keep / thin / merge / remove |
|---|---|---|
| `WorkoutProvider` | Owns workout session, set drafts, rest timer, alternates, safety, and summary | **Keep now**, but make it a thin client controller around a future workout service |
| `NutritionProvider` | Owns a day-level nutrition session, meal selection, hydration, supplements | **Keep now**, but thin it toward a nutrition service and persisted day logs |
| `ProgressProvider` | Owns measurements, photos, trends, phase review state | **Keep now**, but split raw persistence from derived charts/review UI later |
| `OnboardingProvider` | Owns onboarding wizard state, baseline seed, and active program | **Keep for now**, but it should eventually become a domain controller over persistent athlete/program state |
| `ProfileSettingsProvider` | Owns saved profile snapshot, notification settings, and pending review | **Keep for now**, but it is the clearest candidate to become a thin editor/controller over a shared profile service |

## Fixture Audit

| File | Current role | Recommended classification |
|---|---|---|
| `lib/coachx-data.ts` | Aggregate demo seed for Today/Calendar/Profile/Progress preview | **C** replace with service/repository; keep only as transitional demo wiring |
| `lib/workout-data.ts` | Exercise catalog + demo workout session seed | **A** keep as seed/demo data for now, but separate catalog from session persistence later |
| `lib/nutrition-data.ts` | Nutrition day seed + meal options + safety logic | **A** keep as seed/demo data for now; later move to nutrition service/contracts |
| `lib/progress-data.ts` | Progress seed + measurement/photo/trend/review domain types | **A/B** keep as seed/demo/test fixture now; convert raw persistence paths to service-backed data |
| `lib/onboarding-data.ts` | Onboarding domain types, demo seed, proposal/activation logic | **B** convert to domain types only over time; move persistence/proposal generation behind services |
| `lib/profile-settings-data.ts` | Profile snapshot, notification settings, impact review rules, state helpers | **B** convert to domain types and rules; persistence should move to a profile/settings service |
| `lib/anatomy.ts` | Semantic anatomy mapping | **B** domain mapping helper, not backend storage |
| `public/*.svg`, `public/*.png` | Demo/placeholder/static assets | **A/P2** keep as seed/demo assets until approved replacements exist |
| `tests/*.mjs` | Test fixtures | **E** keep as test fixture material |

## Recommended Domain Boundaries

These are logical boundaries, not microservices:

- Auth / Identity
- Athlete Profile
- Athlete Preferences
- Health / Limitations
- Program
- Training
- Nutrition
- Progress
- Check-ins / Reviews
- Notifications
- Exercise Catalog
- Media
- AI Recommendations
- Coach Review

## Recommended Service Boundaries

Keep these as explicit interfaces before Supabase is introduced:

- `authService`
- `profileService`
- `preferenceService`
- `programService`
- `workoutService`
- `nutritionService`
- `progressService`
- `notificationPreferencesService`
- `exerciseCatalogService`
- `mediaService`
- `recommendationService`
- `coachReviewService`

Avoid a generic repository layer that hides domain intent.

## Database Entity Map

Minimum useful persistent entities:

- `users`
- `athlete_profiles`
- `athlete_preferences`
- `health_limitations`
- `programs`
- `program_phases`
- `workout_templates`
- `workout_template_exercises`
- `scheduled_workouts`
- `workout_sessions`
- `workout_session_exercises`
- `workout_sets`
- `exercises`
- `exercise_alternatives`
- `exercise_media`
- `nutrition_plans`
- `nutrition_days`
- `meal_slots`
- `meal_options`
- `meal_selections`
- `hydration_logs`
- `measurements`
- `progress_photo_checkpoints`
- `progress_photos`
- `weekly_checkins`
- `phase_reviews`
- `notification_preferences`
- `program_change_proposals`
- `coach_reviews`
- `ai_recommendations`

### Normalization guidance

- Do not create one table for every TypeScript UI helper type.
- Keep raw facts normalized.
- Store derived charts and summaries only if they materially improve performance or auditability.
- Preserve the distinction between template, scheduled occurrence, and actual session.

## RLS Classification

| Entity group | Access class | Notes |
|---|---|---|
| Profiles and preferences | User-private | Coach access only with explicit permission |
| Programs and workout sessions | User-private / coach-accessible | Coach needs scoped read/write for review workflows |
| Completed sets and nutrition logs | User-private / coach-accessible | Primary athlete history data |
| Measurements and phase reviews | User-private / coach-accessible | Sensitive progress data |
| Progress photos | User-private / coach-accessible | Must remain private by default |
| Exercise catalog and media | Global read-only | Can be shared across all athletes |
| Notification preferences | User-private | Device permission stays client-side, preference records server-side |
| AI recommendation records | User-private / coach-accessible | Must not auto-apply without validation |
| System tables | System | Internal operational tables only |

## Storage Plan

Future buckets / asset groups:

- `progress-photos` - private, signed URLs only
- `avatars` - private or app-controlled public placeholder assets
- `exercise-media` - likely public-read or signed, depending on licensing and coach review

Notes:

- `coachx-avatar.svg` is a development placeholder and should not be treated as final branding.
- Progress photo handling must remain private by default.
- Exercise imagery should be stored separately from anatomy/semantic mapping assets.

## OpenAI Integration Points

OpenAI should be used only as a server-side recommendation engine.

| Flow | Input data | Output schema | Coach review required? | Auto-apply? |
|---|---|---|---|---|
| Program proposal | Athlete profile, goals, schedule, training history, health limits | Program proposal record | Yes | No |
| Nutrition proposal | Nutrition preferences, restrictions, logs, goals | Nutrition recommendation record | Yes | No |
| Weekly check-in interpretation | Measurements, adherence, feedback, trends | Check-in summary + recommendation | Usually yes | No |
| Progress interpretation | Raw progress entries, reviews, trends | Progress summary record | Yes | No |
| Workout progression suggestion | Session history, last comparable set, safety metadata | Workout adjustment suggestion | Sometimes | No |
| Equivalent meal generation | Nutrition plan, safety profile, available options | Meal option recommendation | No for safe equivalences, yes for edge cases | No |
| Later exercise image verification | Exercise metadata + image candidate | Verification record | Yes for low confidence | No |

Key rule: AI recommendation is never the source of truth and never mutates the active program automatically.

## Exercise Catalog and Media Readiness

### Production exercise model should include

- `exercise_id`
- `name`
- `movement_pattern`
- `primary_muscles`
- `secondary_muscles`
- `equipment`
- `difficulty`
- `setup`
- `execution_cues`
- `common_mistakes`
- `contraindication_tags`
- `alternative_exercise_ids`
- `media_refs`
- `verification_status`
- `verification_notes`

### Two-image media readiness

Prepare media roles like:

- `START_POSITION`
- `END_POSITION`

Anatomy visualization should remain a separate semantic layer. It should not consume the two exercise media frames.

### Future verifier contract

The verifier should check:

- exercise identity
- equipment match
- media role match
- body orientation
- gross posture / joint configuration
- image quality
- obvious execution mismatch

It should not claim biomechanical perfection from still images. Low-confidence and complex movements should require manual approval.

## Date / Time Audit

Current demo data hardcodes:

- `2026-08-08`
- `Saturday`
- `Week 4`
- `Week 8`
- several absolute demo timestamps

Production migration needs to distinguish:

- calendar date
- timestamp
- timezone
- reminder schedule
- phase week / offset

Do not blindly treat everything as UTC timestamps.

## Performance Risks

- Large client providers can re-render wide parts of the tree
- Demo seed objects are duplicated across files and can bloat the bundle if not trimmed
- Photo and chart screens will need care as datasets grow
- LocalStorage-backed persistence should not become the long-term session/history store

## Security Risks

- Health limitations, progress photos, workout history, nutrition restrictions, and AI recommendation inputs are sensitive
- Nothing sensitive should be public by default
- OpenAI should receive only the minimum necessary context
- Secrets must remain server-side
- Client-only persistence is not acceptable for final medical/safety-sensitive history

## Technical Debt Classification

### P0 - fix before Supabase

- Duplicate source of truth across onboarding, profile settings, and legacy demo seeds
- Split identity/profile ownership
- Hardcoded program/date/demo identity that will otherwise leak into backend assumptions
- Workout session history still lives entirely in client state
- Nutrition execution state is still local-only

### P1 - fix during Supabase migration

- Replace localStorage persistence with typed repositories
- Split derived trend data from raw progress facts
- Add auth-aware route separation
- Introduce explicit RLS and signed storage URLs
- Normalize review/proposal lifecycle records

### P2 - safe to defer

- Placeholder avatar asset
- Provisional Progress main screen
- Provisional Profile hub shell
- Provisional Login / Welcome screen
- Demo-only seed imagery

## Recommended Migration Order

1. Auth + athlete profile + preferences snapshot
2. Program + onboarding completion state
3. Workout session persistence
4. Nutrition day persistence
5. Progress measurements + private photos
6. Notifications preferences
7. OpenAI recommendation infrastructure
8. Coach review workflow
9. Production hardening: RLS, signed storage, QA, observability

## First Supabase Slice Recommendation

The safest first slice is:

**Auth + Athlete Profile + Preferences Snapshot**

Why this slice:

- it resolves the biggest duplicate source-of-truth problem early
- it gives the app a real identity/profile record without forcing workout, nutrition, or progress migration at the same time
- it is the least disruptive path into Supabase while preserving the current athlete UX
