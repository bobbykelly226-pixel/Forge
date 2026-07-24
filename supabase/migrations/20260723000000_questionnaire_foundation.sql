-- =============================================================================
-- Forge Compatibility Profile — Questionnaire Foundation
-- Versioned, configuration-driven questionnaire schema + Category 1 seed.
--
-- Architecture: reusable response_behavior + exact format_label (HQ wording).
-- Forward-only. Does NOT alter profiles / profile_answers / compatibility_answers
-- or existing onboarding / Compatibility Engine V1 paths.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.questionnaire_response_behavior as enum (
    'single_choice',
    'multi_select',
    'scale_range',
    'scenario_choice',
    'structured_identity'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.questionnaire_response_state as enum (
    'answered',
    'unanswered',
    'skipped',
    'withheld',
    'inapplicable',
    'no_preference',
    'context_dependent',
    'limited_capacity',
    'not_currently_relevant',
    'current_priority',
    'no_specific_requirement'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.questionnaire_response_qualifier as enum (
    'no_specific_requirement',
    'limited_openness',
    'evaluation_preference',
    'limited_capacity_contribution'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.questionnaire_category_status as enum (
    'locked',
    'draft',
    'preview'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.questionnaire_progress_status as enum (
    'not_started',
    'in_progress',
    'completed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Catalog tables
-- ---------------------------------------------------------------------------
create table if not exists public.questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  version_key text not null unique,
  specification_version text not null,
  title text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint questionnaire_versions_key_nonempty check (char_length(trim(version_key)) > 0),
  constraint questionnaire_versions_spec_nonempty check (char_length(trim(specification_version)) > 0)
);

comment on table public.questionnaire_versions is
  'Versioned Compatibility Profile questionnaire definitions. Catalog is readable; not user-editable.';

create table if not exists public.questionnaire_categories (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.questionnaire_versions (id) on delete cascade,
  category_key text not null,
  category_number integer not null,
  title text not null,
  status public.questionnaire_category_status not null default 'draft',
  display_order integer not null,
  locked_product_decisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint questionnaire_categories_number_positive check (category_number >= 1),
  constraint questionnaire_categories_display_positive check (display_order >= 1),
  constraint questionnaire_categories_version_key_unique unique (version_id, category_key),
  constraint questionnaire_categories_version_number_unique unique (version_id, category_number)
);

comment on table public.questionnaire_categories is
  'Ordered questionnaire categories for a questionnaire version.';

create table if not exists public.questionnaire_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.questionnaire_versions (id) on delete cascade,
  rule_key text not null,
  description text not null,
  condition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint questionnaire_eligibility_rules_version_key_unique unique (version_id, rule_key),
  constraint questionnaire_eligibility_rules_description_nonempty check (char_length(trim(description)) > 0)
);

comment on table public.questionnaire_eligibility_rules is
  'Eligibility/display rules referenced by questions. Catalog readable; not user-editable.';

create table if not exists public.questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.questionnaire_categories (id) on delete cascade,
  question_key text not null,
  question_number integer not null,
  prompt text not null,
  statement text null,
  format_label text not null,
  response_behavior public.questionnaire_response_behavior not null,
  context_note text null,
  implementation_note text null,
  eligibility_rule_id uuid null references public.questionnaire_eligibility_rules (id) on delete set null,
  is_conditional boolean not null default false,
  select_all_that_apply boolean not null default false,
  structured_identity_config jsonb null,
  alignment_purpose text not null,
  min_selections integer not null default 1,
  max_selections integer null,
  priority_follow_up_prompt text null,
  priority_selection_count integer null,
  priority_unordered boolean not null default true,
  priority_eligible_choice_keys jsonb null,
  priority_excluded_choice_keys jsonb null,
  priority_min_eligible_selections integer null,
  allowed_special_response_states public.questionnaire_response_state[] null,
  allowed_qualifiers public.questionnaire_response_qualifier[] null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  constraint questionnaire_questions_number_positive check (question_number >= 1),
  constraint questionnaire_questions_display_positive check (display_order >= 1),
  constraint questionnaire_questions_format_label_nonempty check (char_length(trim(format_label)) > 0),
  constraint questionnaire_questions_selection_limits check (
    min_selections >= 0
    and (max_selections is null or (max_selections >= 1 and min_selections <= max_selections))
  ),
  constraint questionnaire_questions_select_all check (
    select_all_that_apply = false
    or (response_behavior = 'multi_select' and max_selections is null)
  ),
  constraint questionnaire_questions_priority_count check (
    (priority_follow_up_prompt is null and priority_selection_count is null)
    or (
      priority_follow_up_prompt is not null
      and priority_selection_count is not null
      and priority_selection_count >= 1
      and priority_unordered = true
      and (max_selections is null or priority_selection_count <= max_selections)
    )
  ),
  constraint questionnaire_questions_category_key_unique unique (category_id, question_key),
  constraint questionnaire_questions_category_number_unique unique (category_id, question_number)
);

comment on table public.questionnaire_questions is
  'Ordered questions. format_label preserves HQ wording; response_behavior is reusable semantics.';

create table if not exists public.questionnaire_answer_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questionnaire_questions (id) on delete cascade,
  choice_key text not null,
  label text not null,
  display_order integer not null,
  mutually_exclusive boolean not null default false,
  special_response_state public.questionnaire_response_state null,
  qualifier public.questionnaire_response_qualifier null,
  qualifier_coexists_with_selections boolean not null default false,
  opens_optional_context boolean not null default false,
  optional_context_config jsonb null,
  created_at timestamptz not null default now(),
  constraint questionnaire_answer_choices_display_positive check (display_order >= 1),
  constraint questionnaire_answer_choices_label_nonempty check (char_length(trim(label)) > 0),
  constraint questionnaire_answer_choices_question_key_unique unique (question_id, choice_key),
  constraint questionnaire_answer_choices_question_order_unique unique (question_id, display_order),
  constraint questionnaire_answer_choices_optional_context check (
    opens_optional_context = false
    or (
      optional_context_config is not null
      and (optional_context_config->>'scored') = 'false'
    )
  )
);

comment on table public.questionnaire_answer_choices is
  'Ordered answer choices. Supports special states, typed qualifiers, and optional unscored context.';

create index if not exists questionnaire_categories_version_display_idx
  on public.questionnaire_categories (version_id, display_order);

create index if not exists questionnaire_questions_category_display_idx
  on public.questionnaire_questions (category_id, display_order);

create index if not exists questionnaire_answer_choices_question_display_idx
  on public.questionnaire_answer_choices (question_id, display_order);

create index if not exists questionnaire_questions_eligibility_rule_idx
  on public.questionnaire_questions (eligibility_rule_id);

-- ---------------------------------------------------------------------------
-- 3. User progress + private responses
-- ---------------------------------------------------------------------------
create table if not exists public.user_questionnaire_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  version_id uuid not null references public.questionnaire_versions (id) on delete restrict,
  status public.questionnaire_progress_status not null default 'not_started',
  current_category_id uuid null references public.questionnaire_categories (id) on delete set null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, version_id)
);

comment on table public.user_questionnaire_progress is
  'Per-user progress for a questionnaire version. Private; owner-only RLS.';

drop trigger if exists user_questionnaire_progress_updated_at on public.user_questionnaire_progress;
create trigger user_questionnaire_progress_updated_at
before update on public.user_questionnaire_progress
for each row
execute function public.set_updated_at();

create table if not exists public.user_questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version_id uuid not null references public.questionnaire_versions (id) on delete restrict,
  question_id uuid not null references public.questionnaire_questions (id) on delete restrict,
  response_state public.questionnaire_response_state not null default 'unanswered',
  active_qualifiers public.questionnaire_response_qualifier[] not null default '{}',
  identity_refinement text null,
  identity_user_supplied text null,
  identity_public_display_allowed boolean null,
  identity_private_matching_allowed boolean null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_questionnaire_responses_user_version_question_unique
    unique (user_id, version_id, question_id),
  constraint user_questionnaire_responses_progress_fk
    foreign key (user_id, version_id)
    references public.user_questionnaire_progress (user_id, version_id)
    on delete cascade
);

comment on table public.user_questionnaire_responses is
  'Private questionnaire responses. Not public profile data. Owner-only RLS. Identity fields are private configuration storage only. Response identity columns (id, user_id, version_id, question_id) are immutable after insert.';

drop trigger if exists user_questionnaire_responses_updated_at on public.user_questionnaire_responses;
create trigger user_questionnaire_responses_updated_at
before update on public.user_questionnaire_responses
for each row
execute function public.set_updated_at();

create index if not exists user_questionnaire_responses_user_version_idx
  on public.user_questionnaire_responses (user_id, version_id);

create table if not exists public.user_questionnaire_selected_choices (
  response_id uuid not null references public.user_questionnaire_responses (id) on delete cascade,
  choice_id uuid not null references public.questionnaire_answer_choices (id) on delete restrict,
  context_text text null,
  created_at timestamptz not null default now(),
  primary key (response_id, choice_id),
  constraint user_questionnaire_selected_choices_context_length check (
    context_text is null or char_length(context_text) <= 2000
  )
);

comment on table public.user_questionnaire_selected_choices is
  'Selected answer choices for a response. Optional context_text is private and unscored. Enforces question match, max count, mutual exclusion under response-row locks.';

create table if not exists public.user_questionnaire_priority_selections (
  response_id uuid not null references public.user_questionnaire_responses (id) on delete cascade,
  choice_id uuid not null references public.questionnaire_answer_choices (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (response_id, choice_id),
  constraint user_questionnaire_priority_selected_fk
    foreign key (response_id, choice_id)
    references public.user_questionnaire_selected_choices (response_id, choice_id)
    on delete cascade
);

comment on table public.user_questionnaire_priority_selections is
  'Unordered priority selections subset of selected choices. Count limited by question config.';

-- ---------------------------------------------------------------------------
-- 4. Integrity triggers
-- ---------------------------------------------------------------------------
create or replace function public.forge_questionnaire_progress_category_version_match()
returns trigger
language plpgsql
as $$
declare
  v_category_version_id uuid;
begin
  if new.current_category_id is null then
    return new;
  end if;

  select version_id into v_category_version_id
  from public.questionnaire_categories
  where id = new.current_category_id;

  if v_category_version_id is null then
    raise exception 'questionnaire progress: current_category_id not found';
  end if;
  if v_category_version_id <> new.version_id then
    raise exception 'questionnaire progress current_category must belong to the same questionnaire version';
  end if;
  return new;
end;
$$;

drop trigger if exists user_questionnaire_progress_category_version_match
  on public.user_questionnaire_progress;
create trigger user_questionnaire_progress_category_version_match
before insert or update on public.user_questionnaire_progress
for each row
execute function public.forge_questionnaire_progress_category_version_match();

create or replace function public.forge_questionnaire_response_version_matches_question()
returns trigger
language plpgsql
as $$
declare
  v_question_version_id uuid;
begin
  select c.version_id into v_question_version_id
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where q.id = new.question_id;

  if v_question_version_id is null then
    raise exception 'questionnaire response: question not found';
  end if;
  if v_question_version_id <> new.version_id then
    raise exception 'questionnaire response question must belong to the response version';
  end if;
  return new;
end;
$$;

drop trigger if exists user_questionnaire_responses_version_match
  on public.user_questionnaire_responses;
create trigger user_questionnaire_responses_version_match
before insert or update on public.user_questionnaire_responses
for each row
execute function public.forge_questionnaire_response_version_matches_question();

-- Response identity is immutable after insert so selected/priority choices cannot
-- be orphaned onto a different question/version via parent-row UPDATE.
-- Editable answer fields remain: response_state, active_qualifiers, identity_*.
create or replace function public.forge_questionnaire_response_identity_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.version_id is distinct from old.version_id
     or new.question_id is distinct from old.question_id then
    raise exception
      'questionnaire response identity is immutable after insert (id, user_id, version_id, question_id); create a separate response row for another question';
  end if;
  return new;
end;
$$;

drop trigger if exists user_questionnaire_responses_identity_immutable
  on public.user_questionnaire_responses;
create trigger user_questionnaire_responses_identity_immutable
before update on public.user_questionnaire_responses
for each row
execute function public.forge_questionnaire_response_identity_immutable();

create or replace function public.forge_questionnaire_selected_choice_integrity()
returns trigger
language plpgsql
as $$
declare
  v_response_question_id uuid;
  v_choice_question_id uuid;
  v_max_selections integer;
  v_selected_count integer;
  v_new_exclusive boolean;
  v_opens_context boolean;
  v_has_exclusive boolean;
  v_has_other boolean;
begin
  -- Serialize selection mutations per response to close count/exclusion races.
  select question_id into v_response_question_id
  from public.user_questionnaire_responses
  where id = new.response_id
  for update;

  select question_id, mutually_exclusive, opens_optional_context
    into v_choice_question_id, v_new_exclusive, v_opens_context
  from public.questionnaire_answer_choices
  where id = new.choice_id;

  if v_response_question_id is null then
    raise exception 'questionnaire selected choice: response not found';
  end if;
  if v_choice_question_id is null then
    raise exception 'questionnaire selected choice: choice not found';
  end if;
  if v_response_question_id <> v_choice_question_id then
    raise exception 'questionnaire selected choice must belong to the response question';
  end if;

  if new.context_text is not null and not v_opens_context then
    raise exception 'questionnaire context_text is not enabled for this choice';
  end if;

  select max_selections into v_max_selections
  from public.questionnaire_questions
  where id = v_response_question_id;

  select count(*) into v_selected_count
  from public.user_questionnaire_selected_choices
  where response_id = new.response_id
    and choice_id <> new.choice_id;

  if v_max_selections is not null and v_selected_count + 1 > v_max_selections then
    raise exception 'questionnaire selected choices exceed max_selections';
  end if;

  select exists (
    select 1
    from public.user_questionnaire_selected_choices sc
    join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
    where sc.response_id = new.response_id
      and sc.choice_id <> new.choice_id
      and ac.mutually_exclusive = true
  ) into v_has_exclusive;

  select exists (
    select 1
    from public.user_questionnaire_selected_choices sc
    where sc.response_id = new.response_id
      and sc.choice_id <> new.choice_id
  ) into v_has_other;

  if v_new_exclusive and v_has_other then
    raise exception 'questionnaire mutually exclusive choice cannot combine with other selections';
  end if;
  if (not v_new_exclusive) and v_has_exclusive then
    raise exception 'questionnaire selection incompatible with an existing mutually exclusive choice';
  end if;

  return new;
end;
$$;

drop trigger if exists user_questionnaire_selected_choices_integrity
  on public.user_questionnaire_selected_choices;
create trigger user_questionnaire_selected_choices_integrity
before insert or update on public.user_questionnaire_selected_choices
for each row
execute function public.forge_questionnaire_selected_choice_integrity();

create or replace function public.forge_questionnaire_priority_choice_valid()
returns trigger
language plpgsql
as $$
declare
  v_response_question_id uuid;
  v_choice_question_id uuid;
  v_choice_key text;
  v_priority_limit integer;
  v_priority_count integer;
  v_excluded jsonb;
  v_eligible jsonb;
begin
  -- Serialize priority mutations per response to close count races.
  perform 1
  from public.user_questionnaire_responses
  where id = new.response_id
  for update;

  select r.question_id, q.priority_selection_count, q.priority_excluded_choice_keys, q.priority_eligible_choice_keys
    into v_response_question_id, v_priority_limit, v_excluded, v_eligible
  from public.user_questionnaire_responses r
  join public.questionnaire_questions q on q.id = r.question_id
  where r.id = new.response_id;

  select question_id, choice_key
    into v_choice_question_id, v_choice_key
  from public.questionnaire_answer_choices
  where id = new.choice_id;

  if v_response_question_id is null then
    raise exception 'questionnaire priority: response not found';
  end if;
  if v_choice_question_id is null or v_choice_question_id <> v_response_question_id then
    raise exception 'questionnaire priority choice must belong to the response question';
  end if;
  if v_priority_limit is null then
    raise exception 'questionnaire priority selections are not configured for this question';
  end if;

  if v_excluded is not null and v_excluded ? v_choice_key then
    raise exception 'questionnaire priority choice is excluded for this question';
  end if;
  if v_eligible is not null and not (v_eligible ? v_choice_key) then
    raise exception 'questionnaire priority choice is not in the eligible subset';
  end if;

  select count(*) into v_priority_count
  from public.user_questionnaire_priority_selections
  where response_id = new.response_id
    and choice_id <> new.choice_id;

  if v_priority_count + 1 > v_priority_limit then
    raise exception 'questionnaire priority selections exceed configured selection count';
  end if;

  return new;
end;
$$;

drop trigger if exists user_questionnaire_priority_selections_valid
  on public.user_questionnaire_priority_selections;
create trigger user_questionnaire_priority_selections_valid
before insert or update on public.user_questionnaire_priority_selections
for each row
execute function public.forge_questionnaire_priority_choice_valid();

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.questionnaire_versions enable row level security;
alter table public.questionnaire_categories enable row level security;
alter table public.questionnaire_eligibility_rules enable row level security;
alter table public.questionnaire_questions enable row level security;
alter table public.questionnaire_answer_choices enable row level security;
alter table public.user_questionnaire_progress enable row level security;
alter table public.user_questionnaire_responses enable row level security;
alter table public.user_questionnaire_selected_choices enable row level security;
alter table public.user_questionnaire_priority_selections enable row level security;

drop policy if exists questionnaire_versions_select_authenticated on public.questionnaire_versions;
create policy questionnaire_versions_select_authenticated
  on public.questionnaire_versions for select to authenticated using (true);

drop policy if exists questionnaire_categories_select_authenticated on public.questionnaire_categories;
create policy questionnaire_categories_select_authenticated
  on public.questionnaire_categories for select to authenticated using (true);

drop policy if exists questionnaire_eligibility_rules_select_authenticated on public.questionnaire_eligibility_rules;
create policy questionnaire_eligibility_rules_select_authenticated
  on public.questionnaire_eligibility_rules for select to authenticated using (true);

drop policy if exists questionnaire_questions_select_authenticated on public.questionnaire_questions;
create policy questionnaire_questions_select_authenticated
  on public.questionnaire_questions for select to authenticated using (true);

drop policy if exists questionnaire_answer_choices_select_authenticated on public.questionnaire_answer_choices;
create policy questionnaire_answer_choices_select_authenticated
  on public.questionnaire_answer_choices for select to authenticated using (true);

revoke insert, update, delete on public.questionnaire_versions from authenticated, anon;
revoke insert, update, delete on public.questionnaire_categories from authenticated, anon;
revoke insert, update, delete on public.questionnaire_eligibility_rules from authenticated, anon;
revoke insert, update, delete on public.questionnaire_questions from authenticated, anon;
revoke insert, update, delete on public.questionnaire_answer_choices from authenticated, anon;

drop policy if exists user_questionnaire_progress_select_own on public.user_questionnaire_progress;
create policy user_questionnaire_progress_select_own
  on public.user_questionnaire_progress for select to authenticated
  using (user_id = auth.uid());
drop policy if exists user_questionnaire_progress_insert_own on public.user_questionnaire_progress;
create policy user_questionnaire_progress_insert_own
  on public.user_questionnaire_progress for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists user_questionnaire_progress_update_own on public.user_questionnaire_progress;
create policy user_questionnaire_progress_update_own
  on public.user_questionnaire_progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_questionnaire_responses_select_own on public.user_questionnaire_responses;
create policy user_questionnaire_responses_select_own
  on public.user_questionnaire_responses for select to authenticated
  using (user_id = auth.uid());
drop policy if exists user_questionnaire_responses_insert_own on public.user_questionnaire_responses;
create policy user_questionnaire_responses_insert_own
  on public.user_questionnaire_responses for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists user_questionnaire_responses_update_own on public.user_questionnaire_responses;
create policy user_questionnaire_responses_update_own
  on public.user_questionnaire_responses for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists user_questionnaire_responses_delete_own on public.user_questionnaire_responses;
create policy user_questionnaire_responses_delete_own
  on public.user_questionnaire_responses for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists user_questionnaire_selected_choices_select_own on public.user_questionnaire_selected_choices;
create policy user_questionnaire_selected_choices_select_own
  on public.user_questionnaire_selected_choices for select to authenticated
  using (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));
drop policy if exists user_questionnaire_selected_choices_insert_own on public.user_questionnaire_selected_choices;
create policy user_questionnaire_selected_choices_insert_own
  on public.user_questionnaire_selected_choices for insert to authenticated
  with check (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));
drop policy if exists user_questionnaire_selected_choices_delete_own on public.user_questionnaire_selected_choices;
create policy user_questionnaire_selected_choices_delete_own
  on public.user_questionnaire_selected_choices for delete to authenticated
  using (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));

drop policy if exists user_questionnaire_priority_selections_select_own on public.user_questionnaire_priority_selections;
create policy user_questionnaire_priority_selections_select_own
  on public.user_questionnaire_priority_selections for select to authenticated
  using (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));
drop policy if exists user_questionnaire_priority_selections_insert_own on public.user_questionnaire_priority_selections;
create policy user_questionnaire_priority_selections_insert_own
  on public.user_questionnaire_priority_selections for insert to authenticated
  with check (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));
drop policy if exists user_questionnaire_priority_selections_delete_own on public.user_questionnaire_priority_selections;
create policy user_questionnaire_priority_selections_delete_own
  on public.user_questionnaire_priority_selections for delete to authenticated
  using (exists (select 1 from public.user_questionnaire_responses r where r.id = response_id and r.user_id = auth.uid()));

revoke all on public.user_questionnaire_progress from anon;
revoke all on public.user_questionnaire_responses from anon;
revoke all on public.user_questionnaire_selected_choices from anon;
revoke all on public.user_questionnaire_priority_selections from anon;

grant select on public.questionnaire_versions to authenticated;
grant select on public.questionnaire_categories to authenticated;
grant select on public.questionnaire_eligibility_rules to authenticated;
grant select on public.questionnaire_questions to authenticated;
grant select on public.questionnaire_answer_choices to authenticated;
grant select, insert, update on public.user_questionnaire_progress to authenticated;
grant select, insert, update, delete on public.user_questionnaire_responses to authenticated;
grant select, insert, delete on public.user_questionnaire_selected_choices to authenticated;
grant select, insert, delete on public.user_questionnaire_priority_selections to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Categories 1 through 4 seed
-- ---------------------------------------------------------------------------

insert into public.questionnaire_versions (id, version_key, specification_version, title, is_active)
values (
  '11111111-1111-4111-8111-111111111111',
  'compatibility_profile_v1',
  'compatibility_profile_categories_1_4_v10',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '22222222-2222-4222-8222-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'relationship_vision_intentions',
  1,
  'Relationship Vision & Intentions',
  'locked',
  1,
  '["Children and faith remain primarily within their Essential Profile questions and dedicated alignment categories.","Q8 may identify whether those subjects require shared direction, but it does not duplicate their deeper questions.","Multiselect questions are not fully ranked. Only Q5, Q8, and Q10 receive a lightweight “choose the two most important” follow up.","Genuine uncertainty remains available in Q1, but vague escape answers have otherwise been removed.","Related answers must be grouped into shared scoring dimensions so repeated questions increase confidence rather than artificially multiplying their weight.","Written responses are excluded because this category has no defined use for them at launch.","Structured answers power alignment; follow up priorities determine added weight."]'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000001',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q01',
  1,
  'What are you ultimately hoping a meaningful relationship will grow into?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Establishes the relationship destination someone is pursuing.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  1
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8001-000000000001',
  '33333333-3333-4333-8333-000000000001',
  'relationship_vision_intentions_q01_c01',
  'A committed long term partnership where marriage is not expected',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8001-000000000002',
  '33333333-3333-4333-8333-000000000001',
  'relationship_vision_intentions_q01_c02',
  'A committed partnership where marriage is possible',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8001-000000000003',
  '33333333-3333-4333-8333-000000000001',
  'relationship_vision_intentions_q01_c03',
  'A partnership intentionally moving toward marriage',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8001-000000000004',
  '33333333-3333-4333-8333-000000000001',
  'relationship_vision_intentions_q01_c04',
  'Marriage and building a shared life together',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8001-000000000005',
  '33333333-3333-4333-8333-000000000001',
  'relationship_vision_intentions_q01_c05',
  'I am still genuinely discovering what I want',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000002',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q02',
  2,
  'How important is marriage in the future you envision?',
  null,
  'Importance scale',
  'scale_range'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Separates someone’s preferred relationship structure from how necessary marriage is to them.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  2
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8002-000000000001',
  '33333333-3333-4333-8333-000000000002',
  'relationship_vision_intentions_q02_c01',
  'Not part of the future I want',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8002-000000000002',
  '33333333-3333-4333-8333-000000000002',
  'relationship_vision_intentions_q02_c02',
  'I could be open to it, but I do not need it',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8002-000000000003',
  '33333333-3333-4333-8333-000000000002',
  'relationship_vision_intentions_q02_c03',
  'I would prefer to marry',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8002-000000000004',
  '33333333-3333-4333-8333-000000000002',
  'relationship_vision_intentions_q02_c04',
  'Marriage is very important to me',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8002-000000000005',
  '33333333-3333-4333-8333-000000000002',
  'relationship_vision_intentions_q02_c05',
  'Marriage is essential to the future I want',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000003',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q03',
  3,
  'What pace do you prefer when building a new relationship?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies meaningful differences between cautious, gradual, steady, and fast moving dating styles.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  3
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8003-000000000001',
  '33333333-3333-4333-8333-000000000003',
  'relationship_vision_intentions_q03_c01',
  'I prefer significant time before becoming emotionally invested or committed',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8003-000000000002',
  '33333333-3333-4333-8333-000000000003',
  'relationship_vision_intentions_q03_c02',
  'I prefer a slow, intentional progression toward commitment',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8003-000000000003',
  '33333333-3333-4333-8333-000000000003',
  'relationship_vision_intentions_q03_c03',
  'I prefer steady progress when mutual interest is clear',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8003-000000000004',
  '33333333-3333-4333-8333-000000000003',
  'relationship_vision_intentions_q03_c04',
  'I am comfortable progressing quickly when intentions and connection align',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8003-000000000005',
  '33333333-3333-4333-8333-000000000003',
  'relationship_vision_intentions_q03_c05',
  'I prefer to adapt the pace to the connection rather than follow a general progression',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000004',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q04',
  4,
  'Which approach to exclusivity most closely reflects what you want?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Captures expectations that can otherwise create early confusion or hurt.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  4
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8004-000000000001',
  '33333333-3333-4333-8333-000000000004',
  'relationship_vision_intentions_q04_c01',
  'I prefer exclusivity once we decide to date intentionally',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8004-000000000002',
  '33333333-3333-4333-8333-000000000004',
  'relationship_vision_intentions_q04_c02',
  'I prefer discussing exclusivity relatively early, once mutual interest is established',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8004-000000000003',
  '33333333-3333-4333-8333-000000000004',
  'relationship_vision_intentions_q04_c03',
  'I prefer several dates and deeper conversation before discussing exclusivity',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8004-000000000004',
  '33333333-3333-4333-8333-000000000004',
  'relationship_vision_intentions_q04_c04',
  'I prefer an extended period of nonexclusive dating before deciding',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8004-000000000005',
  '33333333-3333-4333-8333-000000000004',
  'relationship_vision_intentions_q04_c05',
  'I do not expect exclusivity unless both people explicitly agree to it',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000005',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q05',
  5,
  'Which qualities most strongly define commitment for you?',
  null,
  'Select up to four',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies both someone’s broader definition of commitment and its most important components.',
  1,
  4,
  'Of the qualities you selected, which two matter most?',
  2,
  true,
  null,
  null,
  2,
  null,
  5
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000001',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c01',
  'Exclusivity',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000002',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c02',
  'Emotional availability',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000003',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c03',
  'Consistent communication',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000004',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c04',
  'Reliability and follow through',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000005',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c05',
  'Shared effort',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000006',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c06',
  'Working through difficulties together',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000007',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c07',
  'Making decisions with each other in mind',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000008',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c08',
  'Planning for a shared future',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8005-000000000009',
  '33333333-3333-4333-8333-000000000005',
  'relationship_vision_intentions_q05_c09',
  'Supporting one another’s individual growth',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000006',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q06',
  6,
  'Which statements best describe what being ready for a committed relationship means to you personally?',
  null,
  'Select up to four',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Grounds readiness in observable capacity and behavior instead of idealized traits.',
  1,
  4,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  6
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000001',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c01',
  'I have made consistent time and space in my life for a relationship',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000002',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c02',
  'I am no longer emotionally attached to a previous relationship',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000003',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c03',
  'I can clearly communicate what I want and need',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000004',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c04',
  'I am prepared to make decisions with another person in mind',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000005',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c05',
  'I can remain engaged when a relationship becomes difficult',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000006',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c06',
  'I have enough emotional and practical stability to invest consistently',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000007',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c07',
  'I am willing to adjust established routines and priorities',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000008',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c08',
  'I am ready to be known honestly, including my imperfections',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8006-000000000009',
  '33333333-3333-4333-8333-000000000006',
  'relationship_vision_intentions_q06_c09',
  'I believe some readiness can develop within the right relationship',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000007',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q07',
  7,
  'Which approach to personal growth best reflects the partnership you want?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Differentiates independent, supportive, challenging, shared, and highly integrated approaches to growth.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  7
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8007-000000000001',
  '33333333-3333-4333-8333-000000000007',
  'relationship_vision_intentions_q07_c01',
  'Each partner should pursue growth independently while respecting the other’s path',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8007-000000000002',
  '33333333-3333-4333-8333-000000000007',
  'relationship_vision_intentions_q07_c02',
  'Partners should maintain separate goals while actively supporting one another',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8007-000000000003',
  '33333333-3333-4333-8333-000000000007',
  'relationship_vision_intentions_q07_c03',
  'Partners should encourage and respectfully challenge one another to grow',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8007-000000000004',
  '33333333-3333-4333-8333-000000000007',
  'relationship_vision_intentions_q07_c04',
  'Partners should build shared goals while continuing to grow individually',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8007-000000000005',
  '33333333-3333-4333-8333-000000000007',
  'relationship_vision_intentions_q07_c05',
  'Growth should be a central purpose of the relationship, pursued intentionally together',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000008',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q08',
  8,
  'In which areas would partners need reasonably compatible long term direction?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies concrete future directions requiring alignment while leaving detailed children, faith, money, and lifestyle matching to their respective categories.',
  1,
  5,
  'Of the areas you selected, which two allow the least room for difference?',
  2,
  true,
  null,
  null,
  2,
  null,
  8
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000001',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c01',
  'Whether to marry',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000002',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c02',
  'Whether or how to build a family',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000003',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c03',
  'Where and how to live',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000004',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c04',
  'Career priorities',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000005',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c05',
  'Financial goals',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000006',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c06',
  'Lifestyle and standard of living',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000007',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c07',
  'The role of faith or spiritual life',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000008',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c08',
  'Extended family involvement',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000009',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c09',
  'Travel and major life experiences',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000010',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c10',
  'Community involvement',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000011',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c11',
  'Retirement and long term planning',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8008-000000000012',
  '33333333-3333-4333-8333-000000000008',
  'relationship_vision_intentions_q08_c12',
  'I am comfortable with partners having substantially different long term goals',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000009',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q09',
  9,
  'If a loving relationship revealed a major difference involving a core long term goal, what would you most likely do first?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals someone’s initial approach to major incompatibility rather than asking whether they generally believe in compromise.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  array['context_dependent']::public.questionnaire_response_state[],
  9
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000001',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c01',
  'Determine whether either of us could genuinely change without resentment',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000002',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c02',
  'Look for a compromise that preserves what matters most to both people',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000003',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c03',
  'Give the relationship more time before making a decision',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000004',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c04',
  'Seek counseling or trusted outside guidance',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000005',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c05',
  'End the relationship if the goal is truly nonnegotiable',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8009-000000000006',
  '33333333-3333-4333-8333-000000000009',
  'relationship_vision_intentions_q09_c06',
  'My response would depend on whether the difference affects the life I fundamentally want',
  6,
  false,
  'context_dependent'::public.questionnaire_response_state
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8333-000000000010',
  '22222222-2222-4222-8222-000000000001',
  'relationship_vision_intentions_q10',
  10,
  'Which relational foundations must be present before you would confidently choose a lasting partnership?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies what someone needs within the relationship itself, without repeating marriage or future goal alignment.',
  1,
  5,
  'Of the foundations you selected, which two are most essential?',
  2,
  true,
  null,
  null,
  2,
  null,
  10
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000001',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c01',
  'Mutual trust',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000002',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c02',
  'Emotional safety',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000003',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c03',
  'Mutual respect',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000004',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c04',
  'Honest communication',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000005',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c05',
  'Healthy conflict repair',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000006',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c06',
  'Consistency and reliability',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000007',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c07',
  'Shared effort',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000008',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c08',
  'Affection and physical connection',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000009',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c09',
  'Acceptance of one another',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000010',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c10',
  'Support for individual growth',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000011',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c11',
  'Confidence in functioning as a team',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8010-000000000012',
  '33333333-3333-4333-8333-000000000010',
  'relationship_vision_intentions_q10_c12',
  'The ability to be fully authentic together',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '22222222-2222-4222-8222-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'values_character',
  2,
  'Values & Character',
  'locked',
  2,
  '["Honesty when truth may hurt remains primarily in Category 10.","Accountability and repair remain primarily in Categories 4 and 10.","Service and contribution remain primarily in Category 9.","Trust threatening behavior remains primarily in Category 10.","Multiselect questions are not fully ranked. Only Q1 and Q9 receive a lightweight “choose the two most important” follow up.","Written responses are excluded because this category has no defined use for them at launch.","Structured answers power alignment; follow up priorities determine added weight."]'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000001',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q01',
  1,
  'Which principles most strongly guide the way you try to live?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Establishes the user''s core value priorities without asking them to rank every positive quality.',
  1,
  5,
  'Of the principles you selected, which two are most central to who you are?',
  2,
  true,
  null,
  null,
  2,
  null,
  1
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000001',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c01',
  'Honesty',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000002',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c02',
  'Compassion',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000003',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c03',
  'Loyalty',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000004',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c04',
  'Living consistently with my beliefs',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000005',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c05',
  'Personal responsibility',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000006',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c06',
  'Fairness',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000007',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c07',
  'Service to others',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000008',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c08',
  'Courage',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000009',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c09',
  'Humility',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000010',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c10',
  'Forgiveness',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000011',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c11',
  'Discipline',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000012',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c12',
  'Respect',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000013',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c13',
  'Generosity',
  13,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000014',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c14',
  'Keeping my word',
  14,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8201-000000000015',
  '33333333-3333-4333-8002-000000000001',
  'values_character_q01_c15',
  'Personal growth',
  15,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000002',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q02',
  2,
  'If you realize you have acted against one of your own values, what are you most likely to do first?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the user''s first instinct when confronting a personal failure: ownership, reflection, repair, correction, prevention, or guidance.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  2
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000001',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c01',
  'Admit it directly and take responsibility',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000002',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c02',
  'Reflect privately so I understand why it happened',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000003',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c03',
  'Apologize to anyone affected',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000004',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c04',
  'Focus first on correcting the consequences',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000005',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c05',
  'Make a specific plan to prevent it from happening again',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8202-000000000006',
  '33333333-3333-4333-8002-000000000002',
  'values_character_q02_c06',
  'Discuss it with someone I trust before deciding what to do',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000003',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q03',
  3,
  'When keeping a commitment becomes substantially harder than expected, what do you generally believe someone should do?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Distinguishes firm, contextual, relational, and flexible approaches to obligation.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  3
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000001',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c01',
  'Keep the commitment unless doing so becomes genuinely impossible',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000002',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c02',
  'Make every reasonable effort before asking to change it',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000003',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c03',
  'Renegotiate it openly when circumstances materially change',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000004',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c04',
  'Prioritize the commitment according to how significantly others depend on it',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000005',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c05',
  'Reconsider it when keeping it would cause disproportionate harm',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8203-000000000006',
  '33333333-3333-4333-8002-000000000003',
  'values_character_q03_c06',
  'Commitments should allow flexibility as people and circumstances change',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000004',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q04',
  4,
  'When your intentions were good but your actions still hurt someone, what matters most?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals how someone balances intent, impact, responsibility, and mutual understanding.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  4
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8204-000000000001',
  '33333333-3333-4333-8002-000000000004',
  'values_character_q04_c01',
  'My intentions should be fully considered before judging what happened',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8204-000000000002',
  '33333333-3333-4333-8002-000000000004',
  'values_character_q04_c02',
  'My intentions matter, but I am still responsible for the effect of my actions',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8204-000000000003',
  '33333333-3333-4333-8002-000000000004',
  'values_character_q04_c03',
  'The impact matters more than what I intended',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8204-000000000004',
  '33333333-3333-4333-8002-000000000004',
  'values_character_q04_c04',
  'Both people should work to understand the difference between intention and impact',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8204-000000000005',
  '33333333-3333-4333-8002-000000000004',
  'values_character_q04_c05',
  'The circumstances determine whether intention or impact should carry more weight',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000005',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q05',
  5,
  'When someone repeatedly makes choices you disagree with, how do you usually try to respond?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Compares support, understanding, autonomy, boundaries, distance, and principled care.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  5
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000001',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c01',
  'Be honest about my concerns while continuing to support them',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000002',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c02',
  'Ask questions and try to understand their reasoning',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000003',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c03',
  'Respect their autonomy unless their choices directly affect me',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000004',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c04',
  'Establish boundaries while leaving room for the relationship',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000005',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c05',
  'Step back when the pattern conflicts deeply with my values',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8205-000000000006',
  '33333333-3333-4333-8002-000000000005',
  'values_character_q05_c06',
  'Continue showing care without offering approval or involvement',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000006',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q06',
  6,
  'Which approach to personal responsibility most closely reflects your beliefs?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals how someone understands agency, circumstance, support, and shared social responsibility without reducing the issue to a political label.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  6
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8206-000000000001',
  '33333333-3333-4333-8002-000000000006',
  'values_character_q06_c01',
  'People are primarily responsible for the outcomes their choices create',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8206-000000000002',
  '33333333-3333-4333-8002-000000000006',
  'values_character_q06_c02',
  'Personal choices matter greatly, but circumstances can significantly limit someone''s options',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8206-000000000003',
  '33333333-3333-4333-8002-000000000006',
  'values_character_q06_c03',
  'Responsibility should be judged according to both choices and circumstances',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8206-000000000004',
  '33333333-3333-4333-8002-000000000006',
  'values_character_q06_c04',
  'People should receive support while still being expected to participate in improving their situation',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8206-000000000005',
  '33333333-3333-4333-8002-000000000006',
  'values_character_q06_c05',
  'Communities and institutions share meaningful responsibility for the conditions affecting people''s lives',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000007',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q07',
  7,
  'How comfortable are you admitting that an important belief or judgment of yours was wrong?',
  null,
  'Comfort range',
  'scale_range'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Measures intellectual humility, openness to correction, and the emotional difficulty of changing a meaningful position.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  7
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8207-000000000001',
  '33333333-3333-4333-8002-000000000007',
  'values_character_q07_c01',
  'Very comfortable. I can change my position openly when the evidence supports it',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8207-000000000002',
  '33333333-3333-4333-8002-000000000007',
  'values_character_q07_c02',
  'Comfortable after I have had time to reflect',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8207-000000000003',
  '33333333-3333-4333-8002-000000000007',
  'values_character_q07_c03',
  'Somewhat comfortable, although it can be difficult',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8207-000000000004',
  '33333333-3333-4333-8002-000000000007',
  'values_character_q07_c04',
  'Uncomfortable when the belief is closely connected to my identity or values',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8207-000000000005',
  '33333333-3333-4333-8002-000000000007',
  'values_character_q07_c05',
  'Very uncomfortable unless I reach the conclusion entirely on my own',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000008',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q08',
  8,
  'When loyalty to someone conflicts with doing what you believe is right, which principle should generally come first?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Exposes meaningful differences in how someone balances loyalty, integrity, protection, confrontation, and context.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  8
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000001',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c01',
  'Doing what is right should come first, even if the relationship is damaged',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000002',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c02',
  'Loyalty should remain unless serious harm or wrongdoing is involved',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000003',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c03',
  'I should confront the person privately before deciding what to do',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000004',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c04',
  'I should protect the person while refusing to support the harmful choice',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000005',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c05',
  'The relationship and the seriousness of the situation should determine my response',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8208-000000000006',
  '33333333-3333-4333-8002-000000000008',
  'values_character_q08_c06',
  'I would seek trusted guidance before acting when both obligations are significant',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000009',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q09',
  9,
  'Which qualities are most important in the character of a long term partner?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Captures the character traits the user prioritizes in a partner and identifies those with the greatest compatibility weight.',
  1,
  5,
  'Of the qualities you selected, which two would allow the least room for compromise?',
  2,
  true,
  null,
  null,
  2,
  null,
  9
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000001',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c01',
  'Honest',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000002',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c02',
  'Loyal',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000003',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c03',
  'Compassionate',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000004',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c04',
  'Accountable',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000005',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c05',
  'Dependable',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000006',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c06',
  'Humble',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000007',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c07',
  'Generous',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000008',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c08',
  'Disciplined',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000009',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c09',
  'Courageous',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000010',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c10',
  'Forgiving',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000011',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c11',
  'Respectful',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000012',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c12',
  'Principled',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000013',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c13',
  'Emotionally mature',
  13,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000014',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c14',
  'Service minded',
  14,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8209-000000000015',
  '33333333-3333-4333-8002-000000000009',
  'values_character_q09_c15',
  'Open to growth',
  15,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8002-000000000010',
  '22222222-2222-4222-8222-000000000002',
  'values_character_q10',
  10,
  'If a partner''s behavior conflicted with a value they claimed to hold, what would matter most in deciding how you viewed it?',
  null,
  'Select up to three',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies how the user evaluates inconsistency between stated values and demonstrated character.',
  1,
  3,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  10
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000001',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c01',
  'Whether it was an isolated mistake or a repeated pattern',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000002',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c02',
  'Whether they acknowledged it honestly',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000003',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c03',
  'Whether they accepted responsibility without blaming others',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000004',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c04',
  'Whether they tried to repair the harm',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000005',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c05',
  'Whether their behavior changed afterward',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000006',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c06',
  'How serious the consequences were',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000007',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c07',
  'Whether they had knowingly concealed the behavior',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8210-000000000008',
  '33333333-3333-4333-8002-000000000010',
  'values_character_q10_c08',
  'Whether the value involved was one I considered fundamental',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '22222222-2222-4222-8222-000000000003',
  '11111111-1111-4111-8111-111111111111',
  'communication_emotional_connection',
  3,
  'Communication & Emotional Connection',
  'locked',
  3,
  '["Pauses and reconnection during difficult conversations remain primarily in Category 4.","Privacy and disclosure boundaries remain primarily in Category 10.","Destructive conflict and trust patterns remain primarily in Categories 4 and 10.","Multiselect questions are not fully ranked. Only Q3 and Q10 receive a lightweight “choose the two most important” follow up.","Written responses are excluded because this category has no defined use for them at launch.","Structured answers power alignment; follow up priorities determine added weight."]'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000001',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q01',
  1,
  'When something important is bothering you in a relationship, how do you usually prefer to address it?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies whether someone initiates concerns immediately, after reflection, under the right conditions, through invitation, or only when necessary.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  1
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8301-000000000001',
  '33333333-3333-4333-8003-000000000001',
  'communication_emotional_connection_q01_c01',
  'I prefer to discuss it as soon as possible',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8301-000000000002',
  '33333333-3333-4333-8003-000000000001',
  'communication_emotional_connection_q01_c02',
  'I prefer a little time to organize my thoughts before discussing it',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8301-000000000003',
  '33333333-3333-4333-8003-000000000001',
  'communication_emotional_connection_q01_c03',
  'I prefer to wait until both people are calm and available',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8301-000000000004',
  '33333333-3333-4333-8003-000000000001',
  'communication_emotional_connection_q01_c04',
  'I usually need the other person to invite the conversation',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8301-000000000005',
  '33333333-3333-4333-8003-000000000001',
  'communication_emotional_connection_q01_c05',
  'I prefer to process it privately unless it continues affecting the relationship',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000002',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q02',
  2,
  'How directly do you prefer a partner to communicate difficult feelings or concerns?',
  null,
  'Directness scale',
  'scale_range'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Measures compatibility around candor, emotional sensitivity, and communication intensity.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  2
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8302-000000000001',
  '33333333-3333-4333-8003-000000000002',
  'communication_emotional_connection_q02_c01',
  'Very gently and indirectly',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8302-000000000002',
  '33333333-3333-4333-8003-000000000002',
  'communication_emotional_connection_q02_c02',
  'Gently, with attention to how the message may be received',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8302-000000000003',
  '33333333-3333-4333-8003-000000000002',
  'communication_emotional_connection_q02_c03',
  'Clearly, with a balance of honesty and sensitivity',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8302-000000000004',
  '33333333-3333-4333-8003-000000000002',
  'communication_emotional_connection_q02_c04',
  'Directly, even when the conversation may feel uncomfortable',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8302-000000000005',
  '33333333-3333-4333-8003-000000000002',
  'communication_emotional_connection_q02_c05',
  'Very directly. I would rather hear the unfiltered truth',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000003',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q03',
  3,
  'During an important conversation, what helps you feel most heard?',
  null,
  'Select up to four',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the specific behaviors through which someone experiences listening, care, and understanding.',
  1,
  4,
  'Of the needs you selected, which two matter most?',
  2,
  true,
  null,
  null,
  2,
  null,
  3
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000001',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c01',
  'Receiving the other person''s full attention',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000002',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c02',
  'Being allowed to finish before receiving a response',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000003',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c03',
  'Having my feelings acknowledged',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000004',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c04',
  'Hearing questions that show genuine curiosity',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000005',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c05',
  'Knowing the other person understands my perspective',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000006',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c06',
  'Receiving empathy before advice or solutions',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000007',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c07',
  'Seeing that the conversation leads to meaningful action',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000008',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c08',
  'Having enough time to explain myself fully',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000009',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c09',
  'Maintaining a calm and respectful tone',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8303-000000000010',
  '33333333-3333-4333-8003-000000000003',
  'communication_emotional_connection_q03_c10',
  'Knowing the conversation will remain private',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000004',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q04',
  4,
  'When a partner shares a problem, what is your usual first instinct?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Differentiates emotional listening, curiosity, problem solving, action, and preference checking.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  4
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000001',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c01',
  'Listen without trying to change or solve anything',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000002',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c02',
  'Acknowledge how they feel and offer emotional support',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000003',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c03',
  'Ask questions to better understand what happened',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000004',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c04',
  'Help them think through possible solutions',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000005',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c05',
  'Take practical action if there is something I can do',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8304-000000000006',
  '33333333-3333-4333-8003-000000000004',
  'communication_emotional_connection_q04_c06',
  'Ask whether they want listening, advice, or help',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000005',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q05',
  5,
  'How much ongoing communication do you prefer when you and a partner are apart during a typical day?',
  null,
  'Frequency range',
  'scale_range'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Captures differences in desired contact without treating either independence or frequent communication as healthier.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  5
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8305-000000000001',
  '33333333-3333-4333-8003-000000000005',
  'communication_emotional_connection_q05_c01',
  'Minimal communication unless something needs attention',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8305-000000000002',
  '33333333-3333-4333-8003-000000000005',
  'communication_emotional_connection_q05_c02',
  'One or two meaningful check ins',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8305-000000000003',
  '33333333-3333-4333-8003-000000000005',
  'communication_emotional_connection_q05_c03',
  'Occasional messages throughout the day',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8305-000000000004',
  '33333333-3333-4333-8003-000000000005',
  'communication_emotional_connection_q05_c04',
  'Frequent communication whenever time allows',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8305-000000000005',
  '33333333-3333-4333-8003-000000000005',
  'communication_emotional_connection_q05_c05',
  'Very frequent contact so we remain closely connected',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000006',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q06',
  6,
  'How comfortable are you expressing vulnerable emotions to a romantic partner?',
  null,
  'Comfort range',
  'scale_range'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Measures emotional openness without assuming immediate vulnerability is appropriate for everyone.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  6
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8306-000000000001',
  '33333333-3333-4333-8003-000000000006',
  'communication_emotional_connection_q06_c01',
  'Very comfortable. I usually express them openly',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8306-000000000002',
  '33333333-3333-4333-8003-000000000006',
  'communication_emotional_connection_q06_c02',
  'Comfortable once trust and safety are established',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8306-000000000003',
  '33333333-3333-4333-8003-000000000006',
  'communication_emotional_connection_q06_c03',
  'Somewhat comfortable, although I may need encouragement',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8306-000000000004',
  '33333333-3333-4333-8003-000000000006',
  'communication_emotional_connection_q06_c04',
  'Uncomfortable unless the situation makes it necessary',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8306-000000000005',
  '33333333-3333-4333-8003-000000000006',
  'communication_emotional_connection_q06_c05',
  'Very uncomfortable. I strongly prefer processing vulnerable emotions privately',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000007',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q07',
  7,
  'Which emotional experiences are most important for you to be able to share with a partner?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the scope of emotional intimacy someone wants within a partnership.',
  1,
  5,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  7
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000001',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c01',
  'Fear or uncertainty',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000002',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c02',
  'Sadness or disappointment',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000003',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c03',
  'Stress and feeling overwhelmed',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000004',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c04',
  'Insecurity or self doubt',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000005',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c05',
  'Hopes and ambitions',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000006',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c06',
  'Joy and excitement',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000007',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c07',
  'Past experiences that still affect me',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000008',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c08',
  'Concerns about the relationship',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000009',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c09',
  'Spiritual or deeply personal reflections',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000010',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c10',
  'Affection, gratitude, and appreciation',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8307-000000000011',
  '33333333-3333-4333-8003-000000000007',
  'communication_emotional_connection_q07_c11',
  'I prefer to process most emotions independently',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000008',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q08',
  8,
  'When you are upset, what kind of response from a partner is usually most helpful?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals differences in emotional support needs during moments of distress.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  8
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000001',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c01',
  'Give me space until I am ready to talk',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000002',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c02',
  'Stay nearby without pressuring me to speak',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000003',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c03',
  'Reassure me that we are okay before discussing the issue',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000004',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c04',
  'Listen and acknowledge how I feel',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000005',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c05',
  'Ask questions and help me understand what I am experiencing',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8308-000000000006',
  '33333333-3333-4333-8003-000000000008',
  'communication_emotional_connection_q08_c06',
  'Help me determine what can be done next',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000009',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q09',
  9,
  'If you and a partner interpret the same conversation very differently, what should happen first?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies whether someone first seeks factual clarity, mutual understanding, emotional repair, underlying causes, reassurance, or reflection.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  9
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000001',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c01',
  'Clarify the facts and what was actually said',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000002',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c02',
  'Allow each person to explain how they experienced the conversation',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000003',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c03',
  'Focus on the effect the misunderstanding had on the relationship',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000004',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c04',
  'Identify the assumption that caused the misunderstanding',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000005',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c05',
  'Reassure one another before trying to resolve the disagreement',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8309-000000000006',
  '33333333-3333-4333-8003-000000000009',
  'communication_emotional_connection_q09_c06',
  'Take time apart and revisit the conversation with a clearer perspective',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8003-000000000010',
  '22222222-2222-4222-8222-000000000003',
  'communication_emotional_connection_q10',
  10,
  'Which communication behaviors are most important in a long term partner?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the communication qualities someone most needs from a partner.',
  1,
  5,
  'Of the behaviors you selected, which two allow the least room for compromise?',
  2,
  true,
  null,
  null,
  2,
  null,
  10
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000001',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c01',
  'Communicates honestly',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000002',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c02',
  'Speaks respectfully during difficult conversations',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000003',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c03',
  'Listens without immediately becoming defensive',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000004',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c04',
  'Expresses feelings openly',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000005',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c05',
  'Communicates needs clearly',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000006',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c06',
  'Asks questions rather than making assumptions',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000007',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c07',
  'Follows through after important conversations',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000008',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c08',
  'Provides reassurance and affection',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000009',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c09',
  'Respects requests for processing time',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000010',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c10',
  'Initiates meaningful conversations',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000011',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c11',
  'Addresses concerns rather than avoiding them',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8310-000000000012',
  '33333333-3333-4333-8003-000000000010',
  'communication_emotional_connection_q10_c12',
  'Can talk about both everyday life and deeper subjects',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '22222222-2222-4222-8222-000000000004',
  '11111111-1111-4111-8111-111111111111',
  'conflict_repair',
  4,
  'Conflict & Repair',
  'locked',
  4,
  '["Q3 intentionally does not receive a priority follow up. The base selections are sufficient.","Multiselect questions are not fully ranked. Only Q6, Q9, and Q10 receive a lightweight “choose the two most important” follow up.","Written responses are excluded because this category has no defined use for them at launch.","Structured answers power alignment; follow up priorities determine added weight."]'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000001',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q01',
  1,
  'When tension first develops between you and a partner, what are you most likely to do?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies someone''s initial response to relational tension: direct engagement, inquiry, reflection, de escalation, observation, or avoidance.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  1
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000001',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c01',
  'Address it directly before it grows',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000002',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c02',
  'Ask whether something feels wrong before sharing my own concerns',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000003',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c03',
  'Take a little time to understand what I am feeling',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000004',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c04',
  'Try to reduce the tension before discussing the underlying issue',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000005',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c05',
  'Wait to see whether the issue resolves naturally',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8401-000000000006',
  '33333333-3333-4333-8004-000000000001',
  'conflict_repair_q01_c06',
  'Avoid raising it unless it begins affecting the relationship',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000002',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q02',
  2,
  'If you become too upset to continue a disagreement constructively, what should happen?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Measures preferred de escalation and re engagement practices during active conflict.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  2
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000001',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c01',
  'Continue carefully so the issue is not left unresolved',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000002',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c02',
  'Take a short pause and resume at a specific time later that day',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000003',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c03',
  'Take several hours and reconnect once emotions have settled',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000004',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c04',
  'Resume the conversation the following day',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000005',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c05',
  'Agree on a return time based on the seriousness of the issue',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8402-000000000006',
  '33333333-3333-4333-8004-000000000002',
  'conflict_repair_q02_c06',
  'Pause the disagreement, focus first on restoring emotional safety, and agree on when to return to the issue',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000003',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q03',
  3,
  'What does a fair compromise generally require?',
  null,
  'Select up to four',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Compares expectations for equity, mutual sacrifice, boundaries, influence, and adaptability in compromise.',
  1,
  4,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  3
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000001',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c01',
  'Both people give up something they wanted',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000002',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c02',
  'The outcome considers what matters most to each person',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000003',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c03',
  'The person more affected by the decision receives greater consideration',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000004',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c04',
  'Neither person feels pressured into agreement',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000005',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c05',
  'The solution protects each person''s essential boundaries',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000006',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c06',
  'The agreement can be revisited if it does not work',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000007',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c07',
  'Both people understand why the decision was made',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000008',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c08',
  'The same person is not always expected to give in',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8403-000000000009',
  '33333333-3333-4333-8004-000000000003',
  'conflict_repair_q03_c09',
  'The result supports the relationship as a whole',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000004',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q04',
  4,
  'If a disagreement cannot be fully resolved, what outcome would you consider acceptable?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals tolerance for unresolved differences and expectations for reaching closure.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  4
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000001',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c01',
  'Continue discussing it until a shared conclusion is reached',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000002',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c02',
  'Agree on a practical solution even if our opinions remain different',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000003',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c03',
  'Accept the difference as long as it does not affect essential needs or values',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000004',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c04',
  'Allow the person most affected to make the final decision',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000005',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c05',
  'Seek outside guidance when the issue significantly affects the relationship',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8404-000000000006',
  '33333333-3333-4333-8004-000000000004',
  'conflict_repair_q04_c06',
  'Reconsider the relationship if the issue creates an ongoing fundamental conflict',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000005',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q05',
  5,
  'When a partner raises a concern about your behavior, what is usually most difficult for you?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Captures conflict vulnerabilities without asking users to portray themselves as defensive or emotionally reactive.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  5
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000001',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c01',
  'Hearing the concern without immediately explaining my intentions',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000002',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c02',
  'Separating criticism of my behavior from criticism of who I am',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000003',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c03',
  'Remaining calm when I believe the concern is unfair',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000004',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c04',
  'Acknowledging the concern before sharing my perspective',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000005',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c05',
  'Accepting that their experience may differ from my own',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8405-000000000006',
  '33333333-3333-4333-8004-000000000005',
  'conflict_repair_q05_c06',
  'Discussing the issue before I have had time to reflect',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000006',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q06',
  6,
  'What makes an apology feel sincere to you?',
  null,
  'Select up to four',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the user''s expectations for remorse, accountability, repair, changed behavior, and forgiveness.',
  1,
  4,
  'Of the elements you selected, which two matter most?',
  2,
  true,
  null,
  null,
  2,
  null,
  6
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000001',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c01',
  'Clearly naming what happened',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000002',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c02',
  'Acknowledging how the other person was affected',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000003',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c03',
  'Accepting responsibility without excuses',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000004',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c04',
  'Expressing genuine remorse',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000005',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c05',
  'Asking what may help repair the harm',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000006',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c06',
  'Taking practical steps to make things right',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000007',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c07',
  'Changing the behavior afterward',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000008',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c08',
  'Allowing the hurt person time to rebuild trust',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8406-000000000009',
  '33333333-3333-4333-8004-000000000006',
  'conflict_repair_q06_c09',
  'Offering the apology without expecting immediate forgiveness',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000007',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q07',
  7,
  'When someone has hurt you but takes genuine responsibility, how does forgiveness usually work for you?',
  null,
  'Single choice',
  'single_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Differentiates forgiveness, emotional recovery, restored access, boundaries, and reconciliation.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  7
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000001',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c01',
  'I can forgive relatively quickly once responsibility is taken',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000002',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c02',
  'I can forgive, but emotional healing takes additional time',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000003',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c03',
  'I need to see consistent behavioral change before forgiveness develops',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000004',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c04',
  'I can release resentment while still changing the relationship or setting boundaries',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000005',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c05',
  'Some violations may be too serious for the relationship to recover',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8407-000000000006',
  '33333333-3333-4333-8004-000000000007',
  'conflict_repair_q07_c06',
  'Forgiveness depends greatly on the harm, pattern, and circumstances',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000008',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q08',
  8,
  'If the same conflict keeps returning, what should happen next?',
  null,
  'Scenario based choice',
  'scenario_choice'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Reveals how someone interprets recurring conflict and when they shift from discussion to accountability, outside help, or compatibility evaluation.',
  1,
  1,
  null,
  null,
  true,
  null,
  null,
  null,
  null,
  8
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000001',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c01',
  'Identify the deeper need or concern beneath the repeated argument',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000002',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c02',
  'Determine whether previous agreements were clear and realistic',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000003',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c03',
  'Examine whether one or both people failed to follow through',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000004',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c04',
  'Try a substantially different solution',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000005',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c05',
  'Seek counseling or trusted outside guidance',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8408-000000000006',
  '33333333-3333-4333-8004-000000000008',
  'conflict_repair_q08_c06',
  'Decide whether the issue reflects a fundamental incompatibility',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000009',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q09',
  9,
  'Which behaviors are most important in a partner during conflict?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies the conflict behaviors someone most needs from a long term partner.',
  1,
  5,
  'Of the behaviors you selected, which two allow the least room for compromise?',
  2,
  true,
  null,
  null,
  2,
  null,
  9
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000001',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c01',
  'Remains respectful even when angry',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000002',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c02',
  'Addresses the issue instead of attacking my character',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000003',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c03',
  'Listens before responding',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000004',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c04',
  'Takes responsibility for their part',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000005',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c05',
  'Tries to understand my perspective',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000006',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c06',
  'Communicates concerns directly',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000007',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c07',
  'Respects an agreed upon pause',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000008',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c08',
  'Returns to unfinished conversations',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000009',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c09',
  'Is willing to compromise',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000010',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c10',
  'Protects important boundaries',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000011',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c11',
  'Focuses on repair rather than winning',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8409-000000000012',
  '33333333-3333-4333-8004-000000000009',
  'conflict_repair_q09_c12',
  'Follows through on agreements afterward',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '33333333-3333-4333-8004-000000000010',
  '22222222-2222-4222-8222-000000000004',
  'conflict_repair_q10',
  10,
  'Which conflict patterns would most seriously threaten your willingness to remain in a relationship?',
  null,
  'Select up to five',
  'multi_select'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  false,
  'Identifies high impact conflict incompatibilities and behaviors that may affect safety or trust without diagnosing either user.',
  1,
  5,
  'Of the patterns you selected, which two would be most difficult for you to move past?',
  2,
  true,
  null,
  null,
  2,
  null,
  10
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000001',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c01',
  'Insults, humiliation, or contempt',
  1,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000002',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c02',
  'Threats, intimidation, or attempts to create fear',
  2,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000003',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c03',
  'Breaking objects or physically aggressive behavior',
  3,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000004',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c04',
  'Repeatedly refusing to discuss serious concerns',
  4,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000005',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c05',
  'Using silence or withdrawal as punishment',
  5,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000006',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c06',
  'Denying events or deliberately distorting what occurred',
  6,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000007',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c07',
  'Threatening to end the relationship to gain control',
  7,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000008',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c08',
  'Sharing private conflicts to embarrass or recruit others',
  8,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000009',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c09',
  'Refusing to accept any responsibility',
  9,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000010',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c10',
  'Repeatedly breaking agreements made after conflict',
  10,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000011',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c11',
  'Retaliating when boundaries are expressed',
  11,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '44444444-4444-4444-8410-000000000012',
  '33333333-3333-4333-8004-000000000010',
  'conflict_repair_q10_c12',
  'Treating every disagreement as something that must be won',
  12,
  false,
  null
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;
