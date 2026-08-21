# Achievement Target Model

## Purpose

This model defines which live progress values are allowed to drive motivational UI.

## Target Types

- Training adherence
- Nutrition adherence
- Hydration
- Phase completion
- New best load
- Workout count

## State Levels

- `calm`
- `active`
- `close`
- `heat`
- `achieved`

## Rules

- A target must come from persisted or computed real data.
- Targets do not create coach decisions or program changes.
- Achievement states are descriptive, not prescriptive.
- Unsupported or missing data falls back to calm.

## Milestones

- First workout logged
- Ten workouts logged
- Phase complete
- New best load

## Boundaries

- No fabricated badges.
- No hidden scoring system.
- No health claims.
- No automatic mutation of training or nutrition plans.
