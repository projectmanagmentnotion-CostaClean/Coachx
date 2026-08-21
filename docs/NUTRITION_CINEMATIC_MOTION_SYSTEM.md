# Nutrition Cinematic Motion System

## Canonical Transitions

- N1 Daily Nutrition -> Meal Detail
- N2 Meal Detail -> Options
- N3 Option -> Preview
- N4 Replacement -> Daily Nutrition
- N5 Meal Complete -> Macro Update -> Next Meal
- N6 Final Meal -> Nutrition Complete
- N7 Hydration Quick Add
- N8 Supplement Complete

## Motion Rules

- Keep transitions interruptible.
- Prefer opacity and transform.
- Use shared-element intent only as a visual metaphor when the architecture supports it.
- Reduced motion should collapse to short fades and instant value updates.

## Implementation Notes

- The nutrition sheet should feel like a single coherent surface, not separate disconnected dialogs.
- Completion motion must never appear before persistence is confirmed.
- The daily shell should avoid giant hero motion and keep the next meal visible early.

