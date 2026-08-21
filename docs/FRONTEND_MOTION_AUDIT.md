# Frontend Motion Audit

## Motion Architecture

- Primary screen transitions are centralized in `components/screen.tsx`.
- GSAP animations are scoped with `gsap.context()` and cleaned up on unmount.
- Reduced motion is respected through the existing `useReducedMotion()` hook.
- The nutrition sheet uses a scoped GSAP context for entry animation.

## Overlay Layering

- Top bar and sticky UI use lower layers.
- Fixed action surfaces use a higher layer.
- Modals and sheets use the overlay layer and now account for dynamic viewport height.
- The main risk surface was mobile browser chrome causing modal/sheet clipping.

## Hardening Applied

- Replaced viewport-sensitive sheet sizing with `100dvh` fallbacks.
- Added overflow containment to the nutrition and progress sheets.
- Added `overflow-x: clip` at the document level to prevent accidental horizontal bleed.

## Visual QA Findings

- Desktop/local render is stable.
- Progress measurement and photo surfaces remain legible and balanced.
- No unintended horizontal scroll was observed in the checked local flows.
- The motion system remains restrained; there is no evidence of excessive timeline layering.

## Follow-up Rules

- Any new overlay must define:
  - stacking order
  - viewport sizing
  - scroll containment
  - escape/close behavior
  - reduced-motion fallback

- Avoid animating layout properties unless there is a clear product reason.
- Keep hero motions reserved for high-value moments.
