# Supabase Setup

Slice 1 uses Supabase for:

- email sign-in / sign-up
- athlete profile storage
- athlete preferences snapshot storage
- onboarding completion state

## Required environment variables

Set these in local development and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_COACHX_DEMO_MODE=
```

`SUPABASE_SERVICE_ROLE_KEY` is not required for Slice 1.

## 1. Create the Supabase project

1. Create or open the COACHX Supabase project.
2. Copy the Project URL.
3. Copy the public anon key.
4. Add the values to local `.env.local` and deployment environment variables.

## 2. Run the migration

Apply the migration in `supabase/migrations/20260808_auth_profile_preferences.sql`.

The migration creates:

- `athlete_profiles`
- `athlete_preferences`
- RLS policies
- an auth trigger for automatic profile creation

## 3. Auth URL configuration

Add the callback route:

- `http://localhost:3000/auth/callback`
- production preview callback on the deployed Vercel URL

If email confirmation is enabled in Supabase, the callback route exchanges the auth code for a session before redirecting into the app.

## 4. Local development

1. Start the app with the Supabase env variables set.
2. Visit `/entry`.
3. Sign in or sign up with email and password.
4. Complete onboarding if the account is new.

If the Supabase variables are missing, CoachX stays in demo mode and continues using the local fixture flow.

## 5. Vercel environment variables

Add the same public Supabase variables to the Vercel project.

Do not add the service role key unless a later slice explicitly needs server-admin behavior.

## 6. Preview and production callbacks

Use environment-aware redirect URLs when configuring Supabase auth:

- local: `http://localhost:3000/auth/callback`
- preview: the current Vercel preview URL plus `/auth/callback`
- production: the production domain plus `/auth/callback`

## 7. Expected behavior

- authenticated user with no completed onboarding resumes onboarding
- authenticated user with completed onboarding lands on Today
- auth-less demo mode remains available when Supabase is not configured
