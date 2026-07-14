-- =============================================================================
-- Migrate compatibility_answers → profile_answers (one-time, idempotent)
-- Preserves all legacy rows. Does not delete compatibility_answers.
-- Application reads/writes profile_answers only after this migration.
-- =============================================================================

-- Copy existing answers into profile_answers without creating duplicates.
insert into public.profile_answers (
  user_id,
  question_key,
  answer,
  importance_level,
  is_non_negotiable,
  visibility,
  created_at,
  updated_at
)
select
  ca.user_id,
  ca.question_key,
  ca.answer_value,
  null,
  false,
  'private'::public.answer_visibility,
  ca.created_at,
  ca.updated_at
from public.compatibility_answers ca
on conflict (user_id, question_key) do nothing;

comment on table public.compatibility_answers is
  'LEGACY read-only store. Migrated into profile_answers. Application code must not write here.';

comment on table public.profile_answers is
  'Authoritative questionnaire answers (onboarding, alignment, factors). Replaces compatibility_answers for app reads/writes.';
