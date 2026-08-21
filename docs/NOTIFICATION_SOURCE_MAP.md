# Notification Source Map

This map records which repository sources can truthfully feed each notification category.

## Category sources

| Category | Current source of truth | Scheduling status | Notes |
| --- | --- | --- | --- |
| Workout | `lib/program-service.ts`, `app/page.tsx`, `app/workout/[sessionId]/page.tsx` | Partially schedulable | The repo has workout dates and live session state, but not a reliable per-workout clock time in the canonical data model yet. |
| Meals | `lib/nutrition-service.ts`, `app/page.tsx`, `components/nutrition-provider.tsx` | Schedulable from meal-slot metadata | Meal slots already carry display timing metadata and are the cleanest push source. |
| Hydration | `lib/notification-preference-service.ts`, `lib/notification-system.ts` | Preference-driven | Hydration reminders currently depend on user preference timing, not a hard source event. |
| Supplements | `lib/nutrition-service.ts`, `lib/notification-system.ts` | Schedulable from nutrition logs | Supplement logs can back reminder generation when the user has enabled the category. |
| Check-in | `lib/checkin-data.ts`, `app/progress/check-in/*` | Partially schedulable | Weekly check-ins have due-state truth, but the repo does not store a canonical reminder clock time. |
| Sleep | `lib/profile-settings-data.ts`, `lib/notification-system.ts` | Preference-driven | Bedtime reminders depend on lifestyle preferences and quiet-hours logic. |

## Current dispatch truth

- Push dispatch must never assume a category can be delivered if the source data does not carry a valid destination and schedule window.
- When a category is not yet schedulable, the Today surface should keep the reminder in-app rather than fabricating a push time.
- The notification settings screen is the canonical place to explain the state to the athlete.

