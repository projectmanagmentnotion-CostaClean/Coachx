# AthlexForce Beta Readiness

Date: 2026-08-10

## Ready

- AthlexForce branding is deployed on the current Vercel preview build.
- The athlete app routes are present and the deployed preview renders the entry shell, Today, Calendar, Program, Profile, Progress, Workout, Nutrition, and onboarding surfaces.
- Coach Panel routes are present and assignment-scoped on the current build.
- Supabase public env wiring is present in Vercel for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Fresh athlete sign-up works on the deployed preview and reaches onboarding immediately.

## What a beta athlete can test

- Sign up and sign in
- Resume onboarding
- Open Today, Calendar, Day Detail, Program, Profile, Workout, Nutrition, Progress, and weekly check-in surfaces
- Persist profile and preference state through Supabase-backed flows
- Use the coach review boundaries indirectly through persisted data

## What a coach can test

- Sign in with an assigned coach account
- Open `/coach`
- Review assigned athletes only
- Open bounded athlete detail, check-ins, recommendations, and proposals
- Submit coach review actions through the existing RPC boundary

## Known limitations

- `OPENAI_API_KEY` is configured in Vercel production and preview, and live OpenAI verification now succeeds.
- The beta now supports live OpenAI recommendations while retaining deterministic fallback behavior if the provider is unavailable.
- Slice 7 live OpenAI completion is verified.

## Account provisioning

- Disposable athlete and coach accounts are provisioned manually for live verification.
- No test credentials should be committed to the repository.
- No automatic provisioning SQL should run in production.

## Bug reporting

- Report regressions against the current route, viewport, and role boundary.
- Include the route, user role, viewport width, and whether the issue reproduces after refresh or sign-out/sign-in.

## Production risks remaining

- Any future Vercel deployment protection or auth mismatch
- Future migration drift if new schema changes are applied without live verification

## Current status

- Local validation for the internationalization and production-readiness pass is green.
- The current implementation now includes locale persistence and locale-aware formatting.
- The remaining beta step is to deploy the current HEAD to the existing Vercel project and smoke the live app again.


