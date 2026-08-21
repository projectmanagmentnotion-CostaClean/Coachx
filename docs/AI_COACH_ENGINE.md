# AI Coach Engine

Slice 7 adds the first server-side AthlexForce OpenAI coach engine. The implementation is intentionally narrow:

- it runs only on the server
- it reads authenticated athlete context from Supabase
- it returns structured recommendations only
- it persists recommendation records for later review
- it never mutates the active program automatically

## Request flow

1. The athlete app calls `POST /api/coach/recommendations`.
2. The route resolves the authenticated user from Supabase SSR session state.
3. The server loads a bounded context from the athlete profile, current program, nutrition, progress, and weekly check-in domains.
4. The OpenAI Responses API generates a structured payload.
5. Zod validates the payload before persistence.
6. The recommendation is saved to `public.ai_recommendations`.
7. The UI renders the recommendation as review-only guidance.

## Context boundaries

The model input is intentionally bounded. It does not receive raw database tables or unrestricted athlete history. The context includes only the signals needed for a recommendation:

- athlete profile and onboarding status
- active program summary
- current workout and recent sessions
- nutrition plan and current day summary
- progress trend summary and latest measurements
- weekly check-in summary and trigger keys

## Structured output

Recommendations must match the Zod schema in `lib/ai/schemas.ts`. Required properties include:

- title
- summary
- recommendation type
- confidence
- key signals
- what worked
- what held back
- focus next
- safety notes
- next phase summary
- application boundary

The application boundary always remains review-only until a human explicitly confirms an applied change.

## Safety rules

- No browser API key exposure.
- No OpenAI calls from client components.
- No medical diagnosis.
- No automatic program mutation.
- No implied certainty from the model.
- Fallback responses must still be valid structured recommendations.

## Persistence

Recommendation records are persisted in `ai_recommendations` with:

- authenticated owner scoping
- context type and context key
- source and generation status
- model name
- structured payload
- raw context snapshot
- application status and timestamps

This gives the app an auditable record of what the model returned and which context produced it.

## Failure behavior

If OpenAI is unavailable or returns invalid structured data, the route falls back to a deterministic review-only recommendation. The app should still render a usable result and should clearly label it as fallback-generated.

Live production verification confirmed the Responses API path, structured output validation, and persistence against a bounded athlete context.


