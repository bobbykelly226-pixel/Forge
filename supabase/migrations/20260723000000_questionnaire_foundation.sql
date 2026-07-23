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
-- 6. Category 1 seed
-- ---------------------------------------------------------------------------

insert into public.questionnaire_versions (id, version_key, specification_version, title, is_active)
values (
  '11111111-1111-4111-8111-111111111111',
  'compatibility_profile_v1',
  'compatibility_profile_category_1_v10',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
  '22222222-2222-4222-8222-222222222221',
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
