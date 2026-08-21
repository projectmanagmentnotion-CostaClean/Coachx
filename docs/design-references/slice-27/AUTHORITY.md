# AthlexForce — Slice 27 Unified Design Handoff

## Status
DESIGN COMPLETE by union of the supplied Stitch exports.

## Visual board coverage
- A–E: Numeric Input Family, Active Set Logger, Stepper, RIR, RPE Slider
- F–H: Drag START/MID/END, Neutral Intensity, Plan vs Actual / Coach-Managed
- I: Logged Set Edit
- J–L: Progress Numeric Entry, Error/Retry, Native Mobile Keyboard
- M–P: Reduced Motion, Accessibility, 375/390/430 Responsive Matrix, Do/Don't

## Source provenance
This unified package was assembled from the user's existing Stitch exports without asking Stitch to regenerate already-existing boards:
- `stitch_coachx_mobile_design_system (14).zip`: A–E, I, Spec v1.1
- `stitch_coachx_mobile_design_system (7)(1).zip`: F–H, J–L, M–P

Other supplied Stitch ZIPs were reviewed for overlap/context; they belong mainly to earlier slices or contain superseded partial Slice 27 exports.

## Canonical design authority
For engineering, repository canonical design tokens override any prototype/Material variables left inside Stitch `code.html`.

Use only:
- Background `#050505`
- Primary Surface `#121212`
- Elevated Surface `#181818`
- Secondary Surface `#1A1A1A`
- Accent `#B6FF00`
- Secondary Accent `#CAFF4A`
- Text `#F7F7F7`
- Warning `#FFB020`
- Error `#FF4D4F`
- Hanken Grotesk

Do not promote legacy prototype variables such as `#9bd900`, `#b1f800`, `#95c600`, `#131313`, `#1c1b1b`, or `#201f1f` to product tokens.

## Data integrity authority
- PLAN/PRESCRIPTION and ACTUAL are distinct.
- Coach-managed prescription is read-only in the logging UI.
- Logging ACTUAL never silently rewrites prescription.
- Self-managed logging ACTUAL does not automatically overwrite the original plan.

## Interaction authority
- Native numeric/decimal keyboard only.
- Minimum interactive hit area: 44px.
- RIR: discrete `0–5+`.
- RPE: discrete `6–10`.
- Slider snap: direct 100–180ms response.
- Reduced motion preserves identical semantic outcomes.
- Intensity is neutral: high is not “good”; low is not “bad”.

## Motion
- MICRO 100–180ms
- COMPONENT 220–380ms
- STATE 400–650ms
- ENTER `power3.out`
- EXIT `power2.in`
- EMPHASIS `expo.out`
- No bounce / elastic / gaming motion.

## Source precedence for Codex
1. Security and persistence invariants
2. Current repository architecture
3. Canonical repository design system
4. Canonical repository motion system
5. This handoff authority note + Spec v1.1
6. Board screenshots
7. Stitch prototype HTML
