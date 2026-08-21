# Analytics Query Strategy

## Query Principles

1. Use bounded windows.
2. Prefer server-side aggregation for the initial view.
3. Pull only the rows needed for the active viewport.
4. Do not derive synthetic scores from missing data.

## Windows

- `4w` → 28 days
- `8w` → 56 days
- `12w` → 84 days
- `all` → capped to 365 days

## Training

Fetch:

- completed `workout_sessions`
- matching `workout_session_exercises`
- matching `workout_sets`

Derived:

- total volume per session
- session count
- average session volume
- recent progression labels

## Body

Fetch:

- `progress_entries`
- `progress_measurements`
- `progress_photos`

Derived:

- latest weight / waist
- series for recent measurements
- coverage of persisted checkpoints

## Nutrition

Fetch:

- `nutrition_days`
- `nutrition_day_selections`
- `nutrition_hydration_logs`
- `nutrition_supplement_logs`

Derived:

- meal completion ratio
- hydration totals
- supplement completion

## Recovery / Check-In

Fetch:

- `weekly_checkins`
- `weekly_checkin_responses`
- `weekly_checkin_reviews`

Derived:

- weekly recovery signal
- review label / summary
- attention flags from real response values

## Program Context

Fetch:

- `programs`
- `program_phases`
- `scheduled_workouts`

Derived:

- current phase
- active workout label
- schedule coverage for the selected window

## Failure Behavior

- Missing auth returns an explicit empty state.
- Missing rows do not crash the screen.
- Partial data renders the charts that are available.
- Queries should fail closed rather than inventing substitute data.

