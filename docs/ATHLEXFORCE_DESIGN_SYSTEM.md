# AthlexForce Design System

Repository: `03adsg/Coachx`

Branch: `codex/phase-1-foundation`

Baseline commit: `750947236c04479e23d2174a71c19e8946ab663d`

Canonical production: `https://coachxsync1-zeta.vercel.app`

Canonical Supabase: `zlblnezbbiimapruazvc`

## Purpose

This is the canonical design bible for AthlexForce.

It absorbs the working visual rules from older design notes, Stitch references, and slice-era UX docs so future work does not fork the system into a second look and feel.

## Source of Truth Order

When sources conflict, use this order:

1. Production security and data invariants
2. Current working application architecture
3. This canonical AthlexForce Design System
4. Canonical motion system
5. Approved Stitch visual reference
6. Stitch prototype code

Prototype code is never authoritative over the working product.

## Brand Direction

AthlexForce should feel:

- dark
- minimal
- precise
- premium
- athletic
- disciplined
- cinematic

The product should look like a high-trust training system, not a playful fitness app.

## Canonical Color System

| Token | Canonical value | Runtime status | Notes |
| --- | --- | --- | --- |
| background-deep | `#050505` | Aligned | Main app shell background. |
| background-charcoal | `#1A1A1A` | Aligned | Structural rhythm and section separation. |
| surface-default | `#121212` | Aligned | Primary card and panel surface. |
| surface-elevated | `#181818` | Aligned | Raised cards, overlays, and focused containers. |
| accent-primary | `#B6FF00` | Aligned | Primary AthlexForce accent. |
| accent-secondary | `#CAFF4A` | Reserved | Supportive highlight, not a second brand. |
| text-primary | `#F7F7F7` | Aligned | Primary readable text. |
| text-secondary | `#999999` | Aligned | Helper and secondary copy. |
| warning | `#FFB020` | Aligned | Warning / caution feedback token. |
| error | `#FF4D4F` | Aligned | Error / destructive feedback token. |

### Color Rules

- Keep the lime accent surgical and purposeful.
- Do not promote Stitch olive palette values to canonical brand tokens.
- Use charcoal only when it improves section rhythm or separation.
- Keep warning and error colors distinct from the brand accent.

## Typography

### Canonical Family

- `Hanken Grotesk` is the only canonical UI type family.
- Use it for body, labels, headlines, numbers, and brand text.
- Use weight, size, and spacing to create hierarchy, not a second family.

### Type Rules

- Keep headings compact and mobile-readable.
- Keep large metrics bold and restrained.
- Avoid decorative or expressive typefaces.
- Preserve tight letter spacing on hero and metric text.

## Spacing and Shape

### Spacing Scale

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px

### Radius Scale

- 4px for tiny utility edges
- 12px for compact controls
- 20px for primary cards and major surfaces
- 24px for hero cards and elevated containers
- 9999px for pills, chips, and circular controls

### Touch Targets

- Minimum interactive target: 44px
- Primary actions: 56px where feasible
- Keep vertical spacing generous enough to avoid accidental taps on mobile

### Mobile QA Widths

- 375px
- 390px
- 430px

## Layout Rules

- One obvious primary action per screen.
- Secondary actions should support, not compete with, the primary action.
- Keep helper copy muted.
- Use accent color for the key action, state chip, or important status only.
- Respect safe areas and bottom navigation visibility.
- Keep the current athlete shell stable on small screens before adding more chrome.

## Component Primitives

The following primitives are shared across the app and should remain visually coherent:

- cards
- pills and chips
- primary, secondary, and ghost buttons
- headers and top bars
- bottom navigation
- sheets and overlays
- workout surfaces
- inputs and selectors
- feedback toasts
- analytics cards and charts

## Visual Consistency Rules

- Reuse the same card language across Today, Calendar, Workout, Nutrition, Progress, and Profile.
- Keep borders quiet and backgrounds layered.
- Use accent color for emphasis, not decoration.
- Avoid redundant shapes that suggest a second design system.
- Do not reintroduce prototype-only color palettes or typography.

## Runtime Token Source

The runtime design token source is `app/globals.css`, with font variables provided by `app/layout.tsx`.

Current code should remain aligned to this document.

## Legacy Supporting Documents

The following documents are supporting references only and must not override this canonical system:

- `docs/COACHX_VISUAL_SYSTEM_UPDATE.md`
- `docs/STITCH_MASTER_V2.md`
- `docs/ATHLETE_FLOW_ARCHITECTURE.md`
- `docs/IDENTITY_ROLE_RELATIONSHIP_SYSTEM.md`
- `docs/WORKOUT_CINEMATIC_MOTION_SYSTEM.md`

## Drift Policy

- If code already matches the canonical system, do nothing.
- If a token is clearly prototype drift, replace it carefully.
- If a color or shape is intentional but not canonical, document why before preserving it.
- Do not copy Stitch prototype defects into production.
