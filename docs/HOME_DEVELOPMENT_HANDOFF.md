# AthlexForce Home Development Handoff

## Current
- Branch: `codex/phase-1-foundation`
- Exact HEAD at time of handoff doc: `ca6ea78`
- Canonical production URL: `https://coachxsync1-zeta.vercel.app`
- Current Vercel project domain: `https://coachxsync1-zeta.vercel.app`
- Supabase project ref: `zlblnezbbiimapruazvc`
- Current Slice: `17`
- Migration status: `supabase/migrations/20260811_profile_avatars.sql` is in Git and has already been applied remotely

## Verified
- Google trusted zeta origin
- Stale auth toast fixed
- Production OAuth launches correctly from the trusted zeta host
- Validation state: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass

## Remaining Slice 17
- Verify returning Google identity/session
- Avatar E2E
- Nutrition persistence E2E
- Calendar complete E2E
- Layout and `DEV ASSET` cleanup
- Mobile QA at 375, 390, and 430 widths
- Locale QA for `es`, `ca`, `en`, and `de`
- Private Alpha certification

## Home Setup
- Clone or fetch the repo
- Switch to `codex/phase-1-foundation`
- Install dependencies
- Recreate or pull `.env.local` securely
- Link the correct Vercel project if needed
- Start the dev server
