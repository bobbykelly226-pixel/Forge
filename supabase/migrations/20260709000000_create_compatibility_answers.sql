-- Forge compatibility_answers table (Compatibility Answers V1)
-- Stores onboarding questionnaire responses only. No scoring or matching.
-- Run this manually in the Supabase SQL Editor if migrations are not applied automatically.

create table if not exists public.compatibility_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null,
  answer_value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compatibility_answers_user_question_unique unique (user_id, question_key)
);

create index if not exists compatibility_answers_user_id_idx
  on public.compatibility_answers (user_id);

create or replace function public.set_compatibility_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists compatibility_answers_updated_at on public.compatibility_answers;

create trigger compatibility_answers_updated_at
before update on public.compatibility_answers
for each row
execute function public.set_compatibility_answers_updated_at();

alter table public.compatibility_answers enable row level security;

drop policy if exists "Users can view own compatibility answers" on public.compatibility_answers;
drop policy if exists "Users can insert own compatibility answers" on public.compatibility_answers;
drop policy if exists "Users can update own compatibility answers" on public.compatibility_answers;
drop policy if exists "Users can delete own compatibility answers" on public.compatibility_answers;

create policy "Users can view own compatibility answers"
on public.compatibility_answers
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own compatibility answers"
on public.compatibility_answers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own compatibility answers"
on public.compatibility_answers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own compatibility answers"
on public.compatibility_answers
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.compatibility_answers to authenticated;
