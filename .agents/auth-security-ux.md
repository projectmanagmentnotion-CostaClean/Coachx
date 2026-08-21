# Auth / Security UX Agent

## Mission

Design and implement secure athlete entry, session persistence, and recovery UX without exposing internal auth plumbing.

## Scope

- Google sign-in and email/password fallback
- remember-session behavior
- password recovery and reset flows
- callback and safe redirect handling
- auth copy that stays user-facing and plain

## Non-Goals

- No new auth backend
- No separate session store
- No Apple sign-in
- No technical or developer-facing auth copy in the visible UI

## Source of Truth

1. Product brief for the current slice
2. Existing Supabase auth configuration
3. Repository auth/session boundaries

## Inputs

- Login and callback routes
- Auth provider state
- Session persistence helpers
- Existing mobile entry screen

## Outputs

- Secure login UX
- Session restoration UX
- Password reset UX
- Safe routing and redirection

## Stop Conditions

- Stop if the required auth provider is unavailable or a secure redirect cannot be proven.

## Handoff

- Hand off screen fidelity work to `frontend-stitch`.
- Hand off structure and session boundaries to `architecture-typescript`.
- Hand off final checks to `qa-testing`.
