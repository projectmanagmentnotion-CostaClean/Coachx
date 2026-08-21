# Analytics Data Audit

## Goal

Slice 14 adds performance analytics to the Progress area using bounded, persisted athlete data only. No synthetic readiness score is introduced.

## Data Sources

### Training

- `workout_sessions`
- `workout_session_exercises`
- `workout_sets`

Used for:

- completed session counts
- total session volume
- session duration
- recent progression points

### Body Composition

- `progress_entries`
- `progress_measurements`
- `progress_photos`

Used for:

- weight and waist history
- latest checkpoint summaries
- private photo coverage only, not raw public exposure

### Nutrition

- `nutrition_days`
- `nutrition_day_selections`
- `nutrition_hydration_logs`
- `nutrition_supplement_logs`

Used for:

- meal completion / adherence trends
- hydration totals
- supplement completion

### Recovery / Weekly Context

- `weekly_checkins`
- `weekly_checkin_responses`
- `weekly_checkin_reviews`

Used for:

- training / nutrition / recovery signal trends
- latest review state
- safety / pressure signals from persisted responses

### Program Context

- `programs`
- `program_phases`
- `scheduled_workouts`

Used for:

- current phase label
- current workout context
- schedule coverage during the selected analytics window

## Bounding Rules

- Window presets: `4w`, `8w`, `12w`, `all`
- `all` is capped to a one-year window
- Workout analytics only consider completed sessions
- Progress analytics only consider the selected time window
- Nutrition / check-in summaries only use rows inside the selected window

## Exclusions

- No fake score
- No radar chart built from invented inputs
- No raw progress photos rendered in analytics
- No unbounded full-history query

## Data Quality Notes

- Training load is derived from completed sets only
- Body metrics are derived from persisted measurements only
- Nutrition adherence is derived from meal / hydration / supplement rows only
- Check-in recovery is derived from real submitted responses only

