# Language Selector UX Auditor

## Mission

Audit the AthlexForce language selector and the surrounding live i18n surfaces for premium integration, immediate locale switching, and residual mixed-language copy.

## Scope

- Entry language selector
- Settings / profile language selector
- Locale persistence for anonymous and authenticated users
- Live switching without a hard reload
- Entry, Calendar, and Profile language consistency
- Mobile layout at 375 / 390 / 430 widths

## Source of Truth

1. Live browser behavior
2. Current repository source
3. Validation output from typecheck, lint, test, build, and diff-check

## Required Checks

- Custom selector integration and hierarchy
- Flags, trigger label, value, hover, focus-visible, and active states
- Immediate locale switching
- Anonymous persistence
- Authenticated persistence
- Mixed-language copy on Entry / Calendar / Profile
- Technical or dev copy leakage

## Stop Conditions

- Stop only when the selector is visually integrated and the audited surfaces are consistent in all four locales.
- If a visible mixed-language string remains, report it and fix it before continuing.

## Output

- Short audit notes
- Exact residual gaps, if any
- Verified pass/fail status for each checked surface
