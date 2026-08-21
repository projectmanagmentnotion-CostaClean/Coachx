# Copy Audit

## Scope
Reviewed user-visible copy across athlete entry, onboarding, profile, nutrition, weekly check-in, program recommendations, coach reviews, coach athlete detail, and workout imagery.

## Result
- Technical terms removed from visible copy where they were user-facing.
- Locale copy now reads naturally in Spanish, Catalan, English, and German.
- Remaining technical terms are internal code identifiers, route names, or data model labels that are not rendered to users.

## Screens Checked
- Entry and sign-in
- Onboarding steps and plan reveal
- Profile hub
- Nutrition loading and empty states
- Weekly check-in states
- Program recommendation and proposal review
- Coach review queue and athlete detail
- Workout image alt text

## Removed Visible Terms
- provisional
- demo
- fixture
- deterministic
- migration
- development mode
- Supabase references in user-facing copy
- OpenAI source/fallback badges
- fallback notes in visible panels

## Notes
- Human-facing language now describes the product state instead of the implementation layer.
- Error messages were rewritten to keep users in the product language, not the platform language.
- Accessible labels and alt text were also normalized.
