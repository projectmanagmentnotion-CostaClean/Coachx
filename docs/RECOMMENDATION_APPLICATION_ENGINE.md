# COACHX Recommendation Application Engine

## Purpose

This layer separates persisted AI recommendations from program mutation. A recommendation can be reviewed, translated into a typed change proposal, previewed, and explicitly applied. It does not mutate the active program by itself.

## Boundary

```
ai_recommendations
  ↓
program_change_proposals
  ↓
deterministic validation
  ↓
preview
  ↓
explicit apply
  ↓
program_change_events
```

## Supported V1 command types

- `exercise_swap`
- `set_adjustment`
- `rep_range_adjustment`
- `workout_reschedule`
- `phase_extension`

Unsupported or vague recommendations remain review-only.

## Safety rules

- Accepting a recommendation is not applying a change.
- Proposal creation uses typed command schemas, not raw model JSON.
- Before/after previews are auditable and must show the actual affected target.
- Stale proposals are rejected or superseded if the source state has changed.
- Apply is transactional and idempotent.
- Historical completed workouts, nutrition, progress, and check-in data are never rewritten.

## Server boundary

- Recommendation and proposal creation happens through authenticated server routes.
- The client never applies arbitrary JSON directly to Supabase.
- The apply RPC verifies ownership, current status, and staleness before mutation.

## OpenAI independence

Slice 8 works with:

- OpenAI-generated recommendations later
- deterministic fallback recommendations
- controlled seed/test recommendations

OpenAI availability is not required for the application engine itself.
