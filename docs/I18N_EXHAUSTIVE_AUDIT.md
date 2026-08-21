# I18N Exhaustive Audit

## String source categories

- Static product copy: navigation, buttons, headings, labels, empty states, loading states, confirmations, and feedback.
- Predefined AthlexForce content: workout template titles and descriptions, nutrition templates, progress labels, check-in prompts, and coach guidance.
- User-written content: profile text, notes, comments, and any custom athlete/coach input.
- AI-generated content: recommendations and summaries that must respect the current saved locale.

## Locale precedence

1. Explicit user selection from the entry screen.
2. Persisted authenticated profile locale.
3. Persisted locale cookie / local storage for anonymous sessions.
4. Browser locale.
5. Spanish fallback.

## Localized predefined-content strategy

- Keep machine identity stable.
- Localize presentation fields only.
- Do not translate user-entered names or notes.
- Recompute locale-sensitive screens when the locale changes.
- Keep demo/default copy aligned with the active locale.

## Screens audited

- Entry
- Onboarding
- Today
- Calendar
- Workout flow
- Exercise detail
- Nutrition
- Progress
- Check-in
- Profile
- Settings
- Security
- Notifications
- Program
- Coach panel

## Automated coverage

- Locale dictionary parity across es / ca / en / de.
- Immediate locale state switching.
- Locale persistence across state updates.
- Regression coverage for predefined content mappings where applicable.

## Remaining user-generated exceptions

- Freeform athlete/coach notes.
- Custom names entered by the user.
- Historical user content stored before localization changes.

## Known limitations

- Some older stored content may remain in its original language until the user edits it.
- Some canonical data modules still need route-by-route presentation localization.
- Visual QA remains necessary for long German strings and narrow mobile widths.
