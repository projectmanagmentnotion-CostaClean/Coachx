# Session Policy

AthlexForce uses a simple browser choice for session persistence:

- **Keep me signed in** on: Supabase persists the browser session.
- **Keep me signed in** off: Supabase keeps the session for the current browser session only.

## Storage

- The remember-session preference is stored locally.
- The authenticated user session remains owned by Supabase Auth.

## Entry behavior

- Authenticated users are routed away from `/entry`.
- The entry screen restores the current session before showing the form.

## Password recovery

- Password reset emails route through `/auth/callback`.
- Recovery links open `/reset-password` after the session is restored.

## Redirect safety

- Only internal paths are accepted for auth redirects.
- External callback targets are rejected.

## UX rules

- No technical auth jargon is shown in the visible flow.
- Email/password remains available as the fallback path.
- Google sign-in is the primary OAuth path.
