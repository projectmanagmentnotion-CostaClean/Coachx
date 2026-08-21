# Workout Cinematic Motion System

## Purpose
Provide a small reusable GSAP layer for workout state changes without turning workout mode into a fragile animation demo.

## Timelines
- WorkoutStartTimeline
- ActiveExerciseEnterTimeline
- SetCompleteTimeline
- RestEnterTimeline
- RestReadyTimeline
- ExerciseCompleteTimeline
- NextExerciseTimeline
- PauseTimeline
- WorkoutCompleteTimeline
- KPIRevealTimeline

## Motion Rules
- Prefer opacity and transform.
- Use shared continuity only when the route architecture can support it safely.
- Avoid continuous blur, layout thrashing, and large DOM teleports.
- Keep all transitions interruptible.
- Kill or revert timelines on unmount and state changes.

## Durations
- Micro: 100-180ms
- Component: 220-380ms
- State: 400-650ms
- Hero: 550-850ms max

Production motion should feel faster than the design prototype.

## Easing
- Use `power2.out` for most entry motions.
- Use slightly quicker timing for confirmations and ready states.
- Avoid overly elastic or playful easing.

## Shared-Element Strategy
- Prefer a stable route/state shell.
- Transition child content inside a stable workout container.
- Avoid fragile DOM teleport hacks across routes.
- If cross-route shared motion is unsafe, preserve continuity with architecture instead.

## Reduced Motion
- Respect `prefers-reduced-motion`.
- Remove large shared movement and clip-heavy transitions.
- Keep state changes clear with short opacity transitions.

## Performance Constraints
- Target real mobile 60fps.
- Avoid long-running blur or shadow animations.
- Use a small number of reusable timelines.
- Keep workout mode responsive under keyboard and safe-area changes.
