# Route and Flow Map

## Athlete Surface

| Route | State | Notes |
| --- | --- | --- |
| `/` | Live | Today screen with program, workout, and movement access. |
| `/calendar` | Live | Month calendar with month controls and a selected-day detail CTA. |
| `/day/[date]` | Live | Day detail with workout and nutrition entry points. |
| `/day/[date]/nutrition` | Live | Nutrition planning and meal selection surface. |
| `/workout/[sessionId]` | Live | Workout overview / session shell. |
| `/workout/[sessionId]/exercise/[exerciseId]` | Live | Exercise logging, alternatives, and safety entry. |
| `/workout/[sessionId]/exercise/[exerciseId]/alternatives` | Live | Exercise swap picker. |
| `/workout/[sessionId]/exercise/[exerciseId]/safety` | Live | Pain / discomfort and safety flow. |
| `/workout/[sessionId]/summary` | Source-discovered | End-of-workout summary route. |
| `/exercises` | Source-discovered | Exercise library. |
| `/exercises/[exerciseId]` | Source-discovered | Individual exercise detail. |

## Progress Surface

| Route | State | Notes |
| --- | --- | --- |
| `/progress` | Live | Performance analytics home. |
| `/progress/check-in` | Live | Weekly check-in form. |
| `/progress/check-in/completion` | Live | Check-in completion screen. |
| `/progress/trends` | Live | Trend analytics and range tabs. |
| `/progress/measurements` | Live | Measurement update form. |
| `/progress/measurements/success` | Live | Measurement completion screen. |
| `/progress/photos` | Live | Progress photo hub. |
| `/progress/photos/capture/[pose]` | Live | Capture/review flow for front, side, and back. |
| `/progress/photos/compare` | Live | Comparison view. |
| `/progress/phase-review` | Live | Phase summary and next-step review. |

## Profile and Setup

| Route | State | Notes |
| --- | --- | --- |
| `/profile` | Live | Account/profile hub. |
| `/profile/preferences` | Source-discovered | Preferences hub. |
| `/profile/preferences/personal` | Live | Personal profile settings and locale controls. |
| `/profile/preferences/health` | Source-discovered | Health settings. |
| `/profile/preferences/nutrition` | Source-discovered | Nutrition settings. |
| `/profile/preferences/schedule` | Source-discovered | Schedule settings. |
| `/profile/preferences/training` | Source-discovered | Training settings. |
| `/profile/preferences/goals` | Source-discovered | Goals settings. |
| `/profile/notifications` | Source-discovered | Notification settings. |
| `/profile/program-impact-review` | Source-discovered | Program impact review. |
| `/entry` | Live/authenticated redirect | Redirects to Today when signed in. |
| `/login` | Source-discovered | Login route. |
| `/forgot-password` | Source-discovered | Password recovery route. |
| `/reset-password` | Source-discovered | Password reset route. |

## Coach Surface

| Route | State | Notes |
| --- | --- | --- |
| `/coach` | Source-discovered | Coach landing route. Live athlete session resolved to the athlete surface instead of a dedicated coach dashboard. |
| `/coach/athletes` | Source-discovered | Athlete list. |
| `/coach/athletes/[athleteId]` | Source-discovered | Athlete detail. |
| `/coach/athletes/[athleteId]/check-ins` | Source-discovered | Athlete check-ins. |
| `/coach/athletes/[athleteId]/recommendations` | Source-discovered | Athlete recommendations. |
| `/coach/profile` | Source-discovered | Coach profile. |
| `/coach/reviews` | Source-discovered | Coach review queue. |

## Observed Primary Flow

`Today -> Day Detail -> Nutrition`

`Today -> Workout -> Exercise -> Alternatives / Safety / Summary`

`Progress -> Check-in / Measurements / Photos / Trends / Phase Review`

