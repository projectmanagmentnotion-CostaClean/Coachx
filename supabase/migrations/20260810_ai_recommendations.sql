create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  context_type text not null check (context_type in ('weekly_checkin', 'phase_review', 'profile_review', 'onboarding', 'manual')),
  context_key text not null,
  source text not null default 'openai' check (source in ('openai', 'fallback')),
  generation_status text not null default 'generated' check (generation_status in ('generated', 'fallback', 'failed')),
  model text not null,
  prompt_version text not null default 'coachx-ai-v1',
  title text not null,
  summary text not null,
  recommendation_type text not null check (recommendation_type in ('none', 'light_review', 'coach_review', 'program_adjustment')),
  recommendation_payload jsonb not null,
  context_snapshot jsonb not null,
  application_status text not null default 'recommended' check (application_status in ('recommended', 'reviewing', 'applied', 'rejected')),
  applied_at timestamptz null,
  applied_change_summary jsonb null,
  error_message text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop index if exists public.ai_recommendations_user_context_created_idx;
create index ai_recommendations_user_context_created_idx
on public.ai_recommendations (user_id, context_type, context_key, created_at desc);

drop trigger if exists set_ai_recommendations_updated_at on public.ai_recommendations;
create trigger set_ai_recommendations_updated_at
before update on public.ai_recommendations
for each row execute function public.set_updated_at();

alter table public.ai_recommendations enable row level security;

drop policy if exists "Athletes can read own AI recommendations" on public.ai_recommendations;
create policy "Athletes can read own AI recommendations"
on public.ai_recommendations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own AI recommendations" on public.ai_recommendations;
create policy "Athletes can insert own AI recommendations"
on public.ai_recommendations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own AI recommendations" on public.ai_recommendations;
create policy "Athletes can update own AI recommendations"
on public.ai_recommendations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own AI recommendations" on public.ai_recommendations;
create policy "Athletes can delete own AI recommendations"
on public.ai_recommendations
for delete
to authenticated
using (auth.uid() = user_id);
