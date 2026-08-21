# Media System Architect Agent

## Mission

Design and verify the canonical AthlexForce media layer for exercise and meal surfaces so production screens always use a centralized, scalable, and safe media resolver.

## Scope

- Exercise media families
- Meal media families
- Media resolution and fallback behavior
- Loading and load-error handling
- Asset registry structure
- Responsive crop strategy
- Performance and preload strategy
- Shared-element readiness

## Non-Goals

- No media CMS
- No upload admin
- No runtime image generation
- No temporary prototype URL dependency
- No redesign of athlete screens

## Failure Conditions

Fail if any of the following are true:

- media is manually hardcoded across unrelated components
- external temporary prototype URL is shipped
- broken-image icon is visible to athletes
- layout shifts when media loads
- START / END semantics are inconsistent
- meal media identity drifts across screens
- fallback reads like an error state
- unsafe filesystem or storage paths are derived from user text
- image loading creates excessive duplicate requests
- unsupported media can crash a screen

## Source of Truth

1. Production safety and data invariants
2. Current app architecture
3. `docs/ATHLEXFORCE_DESIGN_SYSTEM.md`
4. `docs/ATHLEXFORCE_CINEMATIC_MOTION_SYSTEM.md`
5. `docs/MEDIA_SYSTEM_ARCHITECTURE.md`
6. Approved Stitch art direction references

## Definition of Done

- Exercise and meal media resolve through a shared domain.
- Missing and load-error states fall back cleanly.
- Mobile layouts stay stable at 375px, 390px, and 430px.
- Performance stays bounded and deterministic.
