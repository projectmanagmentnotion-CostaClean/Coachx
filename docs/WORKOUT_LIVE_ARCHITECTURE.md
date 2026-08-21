# Workout Live Architecture

## State Model
AthlexForce active workout uses one explicit workflow model:

- `preparing`
- `active`
- `resting`
- `paused`
- `exercise_complete`
- `completed`

Persistent workout truth is kept separate from transient animation phases.

## Persistence Rules
- Logged sets are persisted through `workout_sets`.
- Exercise completion is derived from persisted set rows.
- Workout completion is persisted through `complete_workout_session`.
- Reload must recover the active session without creating a duplicate session.
- The app may cache UI state locally, but durable truth comes from the session rows.

## Timer Architecture
- Rest timing is timestamp-based.
- The stored `endsAt` timestamp is the source of truth.
- UI countdowns derive from `endsAt`, not from a decrement-only interval.
- Pause state must not corrupt the remaining rest duration.

## State Transitions
- Start workout
  - immediate press feedback
  - create or restore the session
  - enter preparing
  - transition to active workout
- Complete set
  - save first
  - then show a short success state
  - then enter rest or exercise completion
- Rest complete
  - rest reaches zero
  - transition back to active set
- Final set
  - persist the final set
  - show exercise complete
  - transition to next exercise or finish
- Finish workout
  - persist completion first
  - then show summary

## Resume Model
- If an unfinished session exists, the primary CTA should resolve to resume.
- Refresh and relogin must restore the current active session.
- Pause and resume should preserve elapsed time and remaining rest.

## Finish Model
- Finish early must not discard completed sets.
- Completion is only successful after the database confirms it.
- Summary must reflect real session data.

## Actual vs Prescription Invariant
- Prescription data defines the planned workout.
- Actual workout data defines what was performed.
- Swaps and actual logging must never rewrite the prescription history.
- Completed sessions remain historical truth even if future program changes occur.
