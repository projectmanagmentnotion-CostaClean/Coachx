# Slice 19 I18N QA

## Scope

- Entry language selector and auth entry copy
- Calendar month/day labels and action sheets
- Profile hub, language settings, notifications, and security surfaces
- Locale persistence for anonymous and authenticated users

## Required Pass Criteria

- Language selector uses a custom AthlexForce control with flags and clear hierarchy.
- Locale changes apply immediately on selection.
- The selected locale persists across refresh and navigation.
- Entry, Calendar, and Profile do not show mixed-language copy in the same visual surface.
- No technical or development-only copy is visible in the audited flows.

## Mobile Checks

- 375 px
- 390 px
- 430 px

## Reporting Format

- List each audited surface.
- Mark pass/fail.
- Call out any remaining mixed-language strings explicitly.
- Call out any overflow or hierarchy issue explicitly.

## Notes

- If a surface still shows mixed language, fix it before moving on.
- If a translation is intentionally stored content rather than UI chrome, note it separately instead of calling it a UI defect.
