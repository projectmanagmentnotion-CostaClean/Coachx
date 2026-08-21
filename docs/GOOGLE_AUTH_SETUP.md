# Google Auth Setup

AthlexForce uses the existing Supabase Auth project for Google sign-in and email/password fallback.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Required Supabase auth settings

- Enable Google as an OAuth provider in the Supabase dashboard.
- Add the production and preview redirect URLs for the deployed app.
- Keep email/password enabled for the fallback sign-in path.

## Redirect paths

- Sign-in and sign-up return through `/auth/callback`.
- Password reset returns through `/auth/callback` and opens `/reset-password`.

## UI behavior

- The public entry screen exposes Google sign-in first.
- Email/password remains available for fallback and recovery.
- No Apple sign-in is wired in this slice.

## Security boundaries

- Google OAuth is handled by Supabase Auth.
- The browser never receives the service role key.
- The app only redirects to safe internal paths.
