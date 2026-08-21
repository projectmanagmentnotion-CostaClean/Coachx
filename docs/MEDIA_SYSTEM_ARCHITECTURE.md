# AthlexForce Media System Architecture

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

## Purpose

Slice 25 introduces a centralized media system for athlete surfaces that need images but must never depend on broken, temporary, or duplicated implementation paths.

The system covers:

- exercise media
- meal media
- loading states
- load-error fallback
- missing-media fallback
- responsive crop handling
- preload / lazy-load strategy
- shared-element readiness

## Goals

- Keep media resolution centralized.
- Preserve stable visual hierarchy on mobile.
- Avoid duplicate mapping logic across screens.
- Use repository-owned assets only.
- Treat missing or failed media as a branded fallback, not an error.
- Keep the architecture ready for future storage/CDN migration without component rewrites.

## Stable Key Strategy

Media must resolve from stable product keys, not display labels.

- Exercise media keys use canonical exercise identifiers.
- Meal media keys use canonical meal option identifiers.
- Localized copy must never change the asset identity.

## Exercise Media Model

Exercise media is resolved by key and context:

- `hero`
- `start`
- `end`
- `thumbnail`
- `fullscreen`

The current production mappings are limited to the approved local assets that exist in the repository. Unmapped exercises use a branded fallback.

## Meal Media Model

Meal media is resolved by key and context:

- `hero`
- `thumbnail`
- `preview`

The current production mapping is limited to approved local assets that exist in the repository. Unmapped meals use a branded fallback.

## Resolver Hierarchy

1. Resolve by stable key.
2. Choose the requested variant.
3. Fall back to another approved variant in the same family if needed.
4. Fall back to the branded surface if no approved asset exists.
5. Transition to the same branded fallback on load error.

## Loading and Error Handling

- Use stable dimensions for every media container.
- Use `next/image` for optimized local asset delivery.
- Show a subtle branded fallback rather than a broken image icon.
- Distinguish internally between:
  - `missing`
  - `load_error`
- Athlete-facing behavior remains the same fallback surface either way.

## Crop Strategy

Current approved crop targets:

- Workout hero: wide
- Exercise detail: wide with safe crop
- START / END: same family, context-specific variant
- Fullscreen: portrait-friendly / tall room
- Meal card: compact thumbnail
- Meal detail: wider hero

The goal is to preserve subject clarity, not force every image into the same crop.

## Preload / Lazy Load Strategy

- Preload only the next likely media when it is already relevant to the visible screen.
- Hero media on the primary active surface can load eagerly.
- Below-the-fold and secondary variants stay lazy.
- Do not preload the entire library.

## Shared-Element Readiness

The media layer should keep stable identifiers so motion can stitch:

- Workout -> Exercise Detail
- Exercise Detail -> Fullscreen
- Exercise -> Alternatives
- Nutrition -> Meal Detail
- Meal Option -> Preview

The resolver provides the same canonical identity across those surfaces.

## Asset Source Policy

Production assets must be:

- repository-owned
- or served from an approved controlled storage/CDN

Do not depend on temporary prototype URLs, random external hosts, or runtime generation.

## Current Approved Assets

- `public/stitch-assets/hip_thrust.png`
- `public/stitch-assets/romanian_deadlift.png`
- `public/stitch-assets/nutrition-breakfast.png`

These are the only Slice 25 mappings currently used by the repository code.

## Notes

- This architecture is intentionally narrow.
- It is a resolver and surface policy, not a DAM or CMS.
- Future approved assets can be added without changing the screen layout contract.
