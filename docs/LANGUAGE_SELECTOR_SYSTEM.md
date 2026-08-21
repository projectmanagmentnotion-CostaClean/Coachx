# Language Selector System

## Purpose

Provide a single, premium, app-wide language control that works consistently in Entry and Settings while keeping locale persistence global for anonymous and authenticated users.

## UX Contract

- Trigger shows the current language with a flag and clear hierarchy.
- Dropdown is custom, not a native `<select>`.
- The active option is clearly marked.
- Hover, press, and focus-visible states match the AthlexForce visual system.
- Selection applies immediately without a hard reload.
- The component remains usable on narrow mobile widths and respects safe areas.

## Persistence

- Anonymous sessions persist locale through the existing cookie and local storage path in `lib/i18n.ts`.
- Authenticated sessions persist locale through the profile settings store and the saved athlete snapshot.
- Locale changes should update the UI immediately and remain stable across route changes.

## Validation Targets

- `/entry`
- `/calendar`
- `/profile`
- `/profile/preferences/language`

## QA Notes

- Check for mixed-language labels after every locale switch.
- Check long German strings against overflow and wrapping.
- Verify there is no technical copy in the selector or adjacent settings copy.
