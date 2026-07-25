-- Compatibility Profile Persistence V1 (audit hardened)
-- Secure owner-only RPCs with catalog enforcement, server revisions,
-- clear tombstones, restart generation protection, and DB-derived completion.
-- Depends on 20260723000000_questionnaire_foundation.sql.
--
-- This migration was not applied to the linked project before hardening.
-- Corrected in place prior to first apply.

-- ---------------------------------------------------------------------------
-- 1. Progress resume + write generation columns
-- ---------------------------------------------------------------------------
alter table public.user_questionnaire_progress
  add column if not exists current_question_id uuid null
    references public.questionnaire_questions (id) on delete set null;

alter table public.user_questionnaire_progress
  add column if not exists current_phase text null;

alter table public.user_questionnaire_progress
  add column if not exists write_generation bigint not null default 0;

alter table public.user_questionnaire_progress
  drop constraint if exists user_questionnaire_progress_phase_check;

alter table public.user_questionnaire_progress
  add constraint user_questionnaire_progress_phase_check
  check (
    current_phase is null
    or current_phase in ('base', 'priority', 'intro', 'complete')
  );

comment on column public.user_questionnaire_progress.current_question_id is
  'Optional resume question within the active questionnaire version.';
comment on column public.user_questionnaire_progress.current_phase is
  'Optional resume phase: intro, base, priority, or complete.';
comment on column public.user_questionnaire_progress.write_generation is
  'Server authoritative generation. Incremented on category/full restart so delayed saves cannot undo clears.';

create or replace function public.forge_questionnaire_progress_question_version_match()
returns trigger
language plpgsql
as $$
declare
  v_question_version_id uuid;
  v_question_category_id uuid;
begin
  if new.current_question_id is null then
    return new;
  end if;

  select c.version_id, q.category_id
    into v_question_version_id, v_question_category_id
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where q.id = new.current_question_id;

  if v_question_version_id is null then
    raise exception 'questionnaire progress: current_question_id not found';
  end if;
  if v_question_version_id <> new.version_id then
    raise exception 'questionnaire progress current_question must belong to the same questionnaire version';
  end if;

  if new.current_category_id is not null
     and new.current_category_id <> v_question_category_id then
    raise exception 'questionnaire progress current_question must belong to current_category';
  end if;

  return new;
end;
$$;

drop trigger if exists user_questionnaire_progress_question_version_match
  on public.user_questionnaire_progress;
create trigger user_questionnaire_progress_question_version_match
before insert or update on public.user_questionnaire_progress
for each row
execute function public.forge_questionnaire_progress_question_version_match();

-- Server authoritative response revision (replaces client-trusted mutation tokens).
alter table public.user_questionnaire_responses
  add column if not exists revision bigint not null default 0;

comment on column public.user_questionnaire_responses.revision is
  'Server authoritative compare-and-swap revision. Clients send expected revision; server increments on success.';

-- Keep legacy column name unused if present from earlier drafts; prefer revision.
alter table public.user_questionnaire_responses
  add column if not exists client_mutation bigint not null default 0;

-- ---------------------------------------------------------------------------
-- 2. Active version helper
-- ---------------------------------------------------------------------------
create or replace function public.forge_active_questionnaire_version_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_version_id uuid;
begin
  select id into v_version_id
  from public.questionnaire_versions
  where is_active = true
    and version_key = 'compatibility_profile_v1'
  order by created_at desc
  limit 1;

  return v_version_id;
end;
$$;

revoke all on function public.forge_active_questionnaire_version_id() from public, anon;
grant execute on function public.forge_active_questionnaire_version_id() to authenticated;

create or replace function public.forge_ensure_questionnaire_progress(
  p_user_id uuid,
  p_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_questionnaire_progress (user_id, version_id, status, write_generation)
  values (p_user_id, p_version_id, 'not_started', 0)
  on conflict (user_id, version_id) do nothing;
end;
$$;

revoke all on function public.forge_ensure_questionnaire_progress(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 3. Parenting eligibility + question completeness helpers
-- ---------------------------------------------------------------------------
create or replace function public.forge_user_open_to_parenting_or_stepparenting_role(
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_has_children text;
  v_children text;
  v_open_to_partner text;
begin
  select has_children, children, open_to_partner_with_children
    into v_has_children, v_children, v_open_to_partner
  from public.profiles
  where id = p_user_id;

  if not found then
    return false;
  end if;

  if v_has_children = 'yes' then
    return true;
  end if;
  if v_children in ('yes', 'open', 'unsure') then
    return true;
  end if;
  if v_open_to_partner in ('yes', 'open') then
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.forge_user_open_to_parenting_or_stepparenting_role(uuid)
  from public, anon;

create or replace function public.forge_question_currently_eligible(
  p_user_id uuid,
  p_question_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rule_condition jsonb;
  v_predicate text;
begin
  select er.condition
    into v_rule_condition
  from public.questionnaire_questions q
  left join public.questionnaire_eligibility_rules er on er.id = q.eligibility_rule_id
  where q.id = p_question_id;

  if v_rule_condition is null then
    return true;
  end if;

  v_predicate := v_rule_condition->>'predicateKey';
  if v_predicate = 'open_to_parenting_or_stepparenting_role' then
    return public.forge_user_open_to_parenting_or_stepparenting_role(p_user_id);
  end if;

  -- Unknown predicates fail closed for completion requirements.
  return false;
end;
$$;

revoke all on function public.forge_question_currently_eligible(uuid, uuid) from public, anon;

create or replace function public.forge_questionnaire_response_is_complete(
  p_response_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_question_id uuid;
  v_response_state public.questionnaire_response_state;
  v_min integer;
  v_max integer;
  v_priority_prompt text;
  v_priority_count integer;
  v_priority_min_eligible integer;
  v_eligible jsonb;
  v_excluded jsonb;
  v_selected_count integer;
  v_priority_selected integer;
  v_eligible_selected integer;
begin
  select r.question_id, r.response_state,
         q.min_selections, q.max_selections,
         q.priority_follow_up_prompt, q.priority_selection_count,
         q.priority_min_eligible_selections,
         q.priority_eligible_choice_keys, q.priority_excluded_choice_keys
    into v_question_id, v_response_state,
         v_min, v_max,
         v_priority_prompt, v_priority_count,
         v_priority_min_eligible,
         v_eligible, v_excluded
  from public.user_questionnaire_responses r
  join public.questionnaire_questions q on q.id = r.question_id
  where r.id = p_response_id;

  if v_question_id is null then
    return false;
  end if;
  if v_response_state = 'unanswered' then
    return false;
  end if;

  select count(*)::integer into v_selected_count
  from public.user_questionnaire_selected_choices
  where response_id = p_response_id;

  if v_selected_count < coalesce(v_min, 1) then
    return false;
  end if;
  if v_max is not null and v_selected_count > v_max then
    return false;
  end if;

  if v_priority_prompt is null or v_priority_count is null then
    return not exists (
      select 1
      from public.user_questionnaire_priority_selections
      where response_id = p_response_id
    );
  end if;

  select count(*)::integer into v_eligible_selected
  from public.user_questionnaire_selected_choices sc
  join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
  where sc.response_id = p_response_id
    and (v_excluded is null or not (v_excluded ? ac.choice_key))
    and (v_eligible is null or (v_eligible ? ac.choice_key));

  select count(*)::integer into v_priority_selected
  from public.user_questionnaire_priority_selections
  where response_id = p_response_id;

  if v_eligible_selected >= coalesce(v_priority_min_eligible, v_priority_count) then
    return v_priority_selected = v_priority_count;
  end if;

  return v_priority_selected = 0;
end;
$$;

revoke all on function public.forge_questionnaire_response_is_complete(uuid) from public, anon;

create or replace function public.forge_recalculate_questionnaire_progress(
  p_user_id uuid,
  p_version_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_responses boolean;
  v_eligible_total integer;
  v_eligible_complete integer;
  v_status public.questionnaire_progress_status;
begin
  select exists (
    select 1
    from public.user_questionnaire_responses r
    where r.user_id = p_user_id
      and r.version_id = p_version_id
      and r.response_state <> 'unanswered'
  ) into v_has_responses;

  select count(*)::integer into v_eligible_total
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where c.version_id = p_version_id
    and public.forge_question_currently_eligible(p_user_id, q.id);

  select count(*)::integer into v_eligible_complete
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  join public.user_questionnaire_responses r
    on r.question_id = q.id
   and r.user_id = p_user_id
   and r.version_id = p_version_id
  where c.version_id = p_version_id
    and public.forge_question_currently_eligible(p_user_id, q.id)
    and public.forge_questionnaire_response_is_complete(r.id);

  if not v_has_responses then
    v_status := 'not_started';
  elsif v_eligible_total > 0 and v_eligible_complete >= v_eligible_total then
    v_status := 'completed';
  else
    v_status := 'in_progress';
  end if;

  update public.user_questionnaire_progress p
  set
    status = v_status,
    started_at = coalesce(p.started_at, case when v_has_responses then now() else null end),
    completed_at = case
      when v_status = 'completed' then coalesce(p.completed_at, now())
      else null
    end,
    updated_at = now()
  where p.user_id = p_user_id
    and p.version_id = p_version_id;
end;
$$;

revoke all on function public.forge_recalculate_questionnaire_progress(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 4. Save or replace one complete question response (atomic + catalog enforced)
-- ---------------------------------------------------------------------------
drop function if exists public.save_my_questionnaire_response(
  text, text, text[], text[], jsonb, jsonb, bigint,
  public.questionnaire_response_state, public.questionnaire_response_qualifier[]
);

create or replace function public.save_my_questionnaire_response(
  p_version_key text,
  p_question_key text,
  p_choice_keys text[],
  p_priority_choice_keys text[] default '{}',
  p_choice_contexts jsonb default '{}'::jsonb,
  p_identity jsonb default '{}'::jsonb,
  p_expected_revision bigint default 0,
  p_expected_write_generation bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_question_id uuid;
  v_response_id uuid;
  v_existing_revision bigint;
  v_write_generation bigint;
  v_min integer;
  v_max integer;
  v_behavior public.questionnaire_response_behavior;
  v_identity_config jsonb;
  v_allowed_states public.questionnaire_response_state[];
  v_allowed_qualifiers public.questionnaire_response_qualifier[];
  v_priority_prompt text;
  v_priority_count integer;
  v_priority_min_eligible integer;
  v_eligible jsonb;
  v_excluded jsonb;
  v_choice_keys text[];
  v_priority_keys text[];
  v_choice_key text;
  v_choice_id uuid;
  v_context text;
  v_opens_context boolean;
  v_special public.questionnaire_response_state;
  v_qualifier public.questionnaire_response_qualifier;
  v_mutually_exclusive boolean;
  v_exclusive_count integer := 0;
  v_selected_count integer := 0;
  v_derived_state public.questionnaire_response_state := 'answered';
  v_derived_qualifiers public.questionnaire_response_qualifier[] := '{}';
  v_priority_key text;
  v_priority_id uuid;
  v_eligible_selected_count integer := 0;
  v_new_revision bigint;
  v_identity_refinement text := null;
  v_identity_user_supplied text := null;
  v_identity_public boolean := null;
  v_identity_private boolean := null;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_version_key is null or char_length(trim(p_version_key)) = 0 then
    return jsonb_build_object('ok', false, 'message', 'Questionnaire version is required.');
  end if;
  if p_question_key is null or char_length(trim(p_question_key)) = 0 then
    return jsonb_build_object('ok', false, 'message', 'Question is required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  select q.id,
         q.min_selections,
         q.max_selections,
         q.response_behavior,
         q.structured_identity_config,
         q.allowed_special_response_states,
         q.allowed_qualifiers,
         q.priority_follow_up_prompt,
         q.priority_selection_count,
         q.priority_min_eligible_selections,
         q.priority_eligible_choice_keys,
         q.priority_excluded_choice_keys
    into v_question_id,
         v_min,
         v_max,
         v_behavior,
         v_identity_config,
         v_allowed_states,
         v_allowed_qualifiers,
         v_priority_prompt,
         v_priority_count,
         v_priority_min_eligible,
         v_eligible,
         v_excluded
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where c.version_id = v_version_id
    and q.question_key = p_question_key
  limit 1;

  if v_question_id is null then
    return jsonb_build_object('ok', false, 'message', 'Question was not found in the active catalog.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  select p.write_generation
    into v_write_generation
  from public.user_questionnaire_progress p
  where p.user_id = v_uid
    and p.version_id = v_version_id
  for update;

  if coalesce(p_expected_write_generation, 0) <> coalesce(v_write_generation, 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_generation',
      'message', 'Your Compatibility Profile was restarted. Reload and try again.',
      'write_generation', v_write_generation
    );
  end if;

  -- Canonicalize and validate selected choice keys against the live catalog.
  select coalesce(array_agg(key), '{}')
    into v_choice_keys
  from (
    select distinct trim(key) as key
    from unnest(coalesce(p_choice_keys, '{}')) as key
    where char_length(trim(key)) > 0
    order by 1
  ) keys;

  if coalesce(array_length(v_choice_keys, 1), 0) = 0 then
    return jsonb_build_object('ok', false, 'message', 'At least one valid choice is required.');
  end if;

  v_selected_count := coalesce(array_length(v_choice_keys, 1), 0);
  if v_selected_count < coalesce(v_min, 1) then
    return jsonb_build_object('ok', false, 'message', 'Too few choices were selected for this question.');
  end if;
  if v_max is not null and v_selected_count > v_max then
    return jsonb_build_object('ok', false, 'message', 'Too many choices were selected for this question.');
  end if;

  foreach v_choice_key in array v_choice_keys
  loop
    select ac.id, ac.opens_optional_context, ac.special_response_state, ac.qualifier, ac.mutually_exclusive
      into v_choice_id, v_opens_context, v_special, v_qualifier, v_mutually_exclusive
    from public.questionnaire_answer_choices ac
    where ac.question_id = v_question_id
      and ac.choice_key = v_choice_key
    limit 1;

    if v_choice_id is null then
      return jsonb_build_object('ok', false, 'message', 'One or more choices are invalid for this question.');
    end if;

    if v_mutually_exclusive then
      v_exclusive_count := v_exclusive_count + 1;
    end if;

    if p_choice_contexts is not null
       and p_choice_contexts ? v_choice_key
       and nullif(trim(p_choice_contexts->>v_choice_key), '') is not null
       and not v_opens_context then
      return jsonb_build_object('ok', false, 'message', 'Optional context is not enabled for one or more choices.');
    end if;

    if v_special is not null
       and (v_allowed_states is null or v_special = any(v_allowed_states)) then
      v_derived_state := v_special;
    end if;

    if v_qualifier is not null
       and (v_allowed_qualifiers is null or v_qualifier = any(v_allowed_qualifiers))
       and not (v_qualifier = any(v_derived_qualifiers)) then
      v_derived_qualifiers := array_append(v_derived_qualifiers, v_qualifier);
    end if;

    if v_excluded is null or not (v_excluded ? v_choice_key) then
      if v_eligible is null or (v_eligible ? v_choice_key) then
        v_eligible_selected_count := v_eligible_selected_count + 1;
      end if;
    end if;
  end loop;

  if v_exclusive_count > 0 and v_selected_count > 1 then
    return jsonb_build_object('ok', false, 'message', 'Mutually exclusive choices cannot be combined.');
  end if;

  -- Reject context keys that are not among the selected choices.
  if p_choice_contexts is not null then
    if exists (
      select 1
      from jsonb_object_keys(p_choice_contexts) as ctx_key
      where nullif(trim(p_choice_contexts->>ctx_key), '') is not null
        and not (ctx_key = any(v_choice_keys))
    ) then
      return jsonb_build_object('ok', false, 'message', 'Optional context is not enabled for one or more choices.');
    end if;
  end if;

  -- Priority validation: subset of selected, eligible, not excluded, exact count when shown.
  select coalesce(array_agg(key), '{}')
    into v_priority_keys
  from (
    select distinct trim(key) as key
    from unnest(coalesce(p_priority_choice_keys, '{}')) as key
    where char_length(trim(key)) > 0
    order by 1
  ) keys;

  if v_priority_prompt is not null and v_priority_count is not null
     and v_eligible_selected_count >= coalesce(v_priority_min_eligible, v_priority_count) then
    if coalesce(array_length(v_priority_keys, 1), 0) <> v_priority_count then
      return jsonb_build_object('ok', false, 'message', 'Priority selections must match the required count.');
    end if;
    foreach v_priority_key in array v_priority_keys
    loop
      if not (v_priority_key = any(v_choice_keys)) then
        return jsonb_build_object('ok', false, 'message', 'Priority choices must be selected base choices.');
      end if;
      if v_excluded is not null and (v_excluded ? v_priority_key) then
        return jsonb_build_object('ok', false, 'message', 'One or more priority choices are excluded.');
      end if;
      if v_eligible is not null and not (v_eligible ? v_priority_key) then
        return jsonb_build_object('ok', false, 'message', 'One or more priority choices are not eligible.');
      end if;
      select ac.id into v_priority_id
      from public.questionnaire_answer_choices ac
      where ac.question_id = v_question_id
        and ac.choice_key = v_priority_key
      limit 1;
      if v_priority_id is null then
        return jsonb_build_object('ok', false, 'message', 'One or more priority choices are invalid for this question.');
      end if;
    end loop;
  else
    if coalesce(array_length(v_priority_keys, 1), 0) > 0 then
      -- Bypass priority when fewer than required eligible choices remain.
      v_priority_keys := '{}';
    end if;
  end if;

  -- Identity fields only for configured structured identity questions.
  if v_behavior = 'structured_identity' and v_identity_config is not null then
    if coalesce((v_identity_config->>'allowsRefinement')::boolean, false) then
      v_identity_refinement := nullif(trim(coalesce(p_identity->>'refinement', '')), '');
    end if;
    if coalesce((v_identity_config->>'allowsUserSuppliedIdentity')::boolean, false) then
      v_identity_user_supplied := nullif(trim(coalesce(p_identity->>'user_supplied', '')), '');
    end if;
    if coalesce((v_identity_config->'privacy'->>'userControlsPublicDisplay')::boolean, false) then
      v_identity_public := coalesce((p_identity->>'public_display_allowed')::boolean, false);
    else
      v_identity_public := false;
    end if;
    if coalesce((v_identity_config->'privacy'->>'userControlsPrivateMatchingUse')::boolean, false) then
      v_identity_private := coalesce((p_identity->>'private_matching_allowed')::boolean, false);
    else
      v_identity_private := false;
    end if;
  else
    if p_identity is not null
       and (
         nullif(trim(coalesce(p_identity->>'refinement', '')), '') is not null
         or nullif(trim(coalesce(p_identity->>'user_supplied', '')), '') is not null
         or (p_identity ? 'public_display_allowed')
         or (p_identity ? 'private_matching_allowed')
       ) then
      return jsonb_build_object('ok', false, 'message', 'Identity fields are not configured for this question.');
    end if;
  end if;

  select r.id, r.revision
    into v_response_id, v_existing_revision
  from public.user_questionnaire_responses r
  where r.user_id = v_uid
    and r.version_id = v_version_id
    and r.question_id = v_question_id
  for update;

  if v_response_id is not null then
    if coalesce(v_existing_revision, 0) <> coalesce(p_expected_revision, 0) then
      return jsonb_build_object(
        'ok', false,
        'code', 'stale_revision',
        'message', 'A newer answer is already saved.',
        'revision', v_existing_revision
      );
    end if;
    v_new_revision := coalesce(v_existing_revision, 0) + 1;

    update public.user_questionnaire_responses
    set
      response_state = v_derived_state,
      active_qualifiers = v_derived_qualifiers,
      identity_refinement = v_identity_refinement,
      identity_user_supplied = v_identity_user_supplied,
      identity_public_display_allowed = v_identity_public,
      identity_private_matching_allowed = v_identity_private,
      revision = v_new_revision,
      client_mutation = v_new_revision,
      updated_at = now()
    where id = v_response_id;

    delete from public.user_questionnaire_priority_selections
    where response_id = v_response_id;

    delete from public.user_questionnaire_selected_choices
    where response_id = v_response_id;
  else
    if coalesce(p_expected_revision, 0) <> 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'stale_revision',
        'message', 'A newer answer is already saved.',
        'revision', 0
      );
    end if;
    v_new_revision := 1;

    insert into public.user_questionnaire_responses (
      user_id,
      version_id,
      question_id,
      response_state,
      active_qualifiers,
      identity_refinement,
      identity_user_supplied,
      identity_public_display_allowed,
      identity_private_matching_allowed,
      revision,
      client_mutation
    ) values (
      v_uid,
      v_version_id,
      v_question_id,
      v_derived_state,
      v_derived_qualifiers,
      v_identity_refinement,
      v_identity_user_supplied,
      v_identity_public,
      v_identity_private,
      v_new_revision,
      v_new_revision
    )
    returning id into v_response_id;
  end if;

  foreach v_choice_key in array v_choice_keys
  loop
    select ac.id, ac.opens_optional_context
      into v_choice_id, v_opens_context
    from public.questionnaire_answer_choices ac
    where ac.question_id = v_question_id
      and ac.choice_key = v_choice_key
    limit 1;

    v_context := null;
    if v_opens_context
       and p_choice_contexts is not null
       and p_choice_contexts ? v_choice_key then
      v_context := left(nullif(trim(p_choice_contexts->>v_choice_key), ''), 2000);
    end if;

    insert into public.user_questionnaire_selected_choices (
      response_id, choice_id, context_text
    ) values (
      v_response_id, v_choice_id, v_context
    );
  end loop;

  if v_priority_keys is not null then
    foreach v_priority_key in array v_priority_keys
    loop
      select ac.id into v_priority_id
      from public.questionnaire_answer_choices ac
      where ac.question_id = v_question_id
        and ac.choice_key = v_priority_key
      limit 1;

      insert into public.user_questionnaire_priority_selections (
        response_id, choice_id
      ) values (
        v_response_id, v_priority_id
      );
    end loop;
  end if;

  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  return jsonb_build_object(
    'ok', true,
    'response_id', v_response_id,
    'question_key', p_question_key,
    'revision', v_new_revision,
    'write_generation', v_write_generation,
    'response_state', v_derived_state,
    'active_qualifiers', to_jsonb(v_derived_qualifiers)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'message', 'Could not save your answer. Try again.'
    );
end;
$$;

revoke all on function public.save_my_questionnaire_response(
  text, text, text[], text[], jsonb, jsonb, bigint, bigint
) from public, anon;
grant execute on function public.save_my_questionnaire_response(
  text, text, text[], text[], jsonb, jsonb, bigint, bigint
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Clear one question (tombstone + revision bump; prevents delayed resurrection)
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_question(
  p_version_key text,
  p_question_key text,
  p_expected_revision bigint default 0,
  p_expected_write_generation bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_question_id uuid;
  v_response_id uuid;
  v_existing_revision bigint;
  v_write_generation bigint;
  v_new_revision bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  select q.id into v_question_id
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where c.version_id = v_version_id
    and q.question_key = p_question_key
  limit 1;

  if v_question_id is null then
    return jsonb_build_object('ok', false, 'message', 'Question was not found in the active catalog.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  select p.write_generation
    into v_write_generation
  from public.user_questionnaire_progress p
  where p.user_id = v_uid
    and p.version_id = v_version_id
  for update;

  if coalesce(p_expected_write_generation, 0) <> coalesce(v_write_generation, 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_generation',
      'message', 'Your Compatibility Profile was restarted. Reload and try again.',
      'write_generation', v_write_generation
    );
  end if;

  select r.id, r.revision
    into v_response_id, v_existing_revision
  from public.user_questionnaire_responses r
  where r.user_id = v_uid
    and r.version_id = v_version_id
    and r.question_id = v_question_id
  for update;

  if v_response_id is null then
    if coalesce(p_expected_revision, 0) <> 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'stale_revision',
        'message', 'A newer answer is already saved.',
        'revision', 0
      );
    end if;
    insert into public.user_questionnaire_responses (
      user_id, version_id, question_id, response_state, active_qualifiers, revision, client_mutation
    ) values (
      v_uid, v_version_id, v_question_id, 'unanswered', '{}', 1, 1
    )
    returning id, revision into v_response_id, v_new_revision;
  else
    if coalesce(v_existing_revision, 0) <> coalesce(p_expected_revision, 0) then
      return jsonb_build_object(
        'ok', false,
        'code', 'stale_revision',
        'message', 'A newer answer is already saved.',
        'revision', v_existing_revision
      );
    end if;
    v_new_revision := coalesce(v_existing_revision, 0) + 1;

    delete from public.user_questionnaire_priority_selections
    where response_id = v_response_id;
    delete from public.user_questionnaire_selected_choices
    where response_id = v_response_id;

    update public.user_questionnaire_responses
    set
      response_state = 'unanswered',
      active_qualifiers = '{}',
      identity_refinement = null,
      identity_user_supplied = null,
      identity_public_display_allowed = null,
      identity_private_matching_allowed = null,
      revision = v_new_revision,
      client_mutation = v_new_revision,
      updated_at = now()
    where id = v_response_id;
  end if;

  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  return jsonb_build_object(
    'ok', true,
    'question_key', p_question_key,
    'revision', v_new_revision,
    'write_generation', v_write_generation
  );
end;
$$;

drop function if exists public.clear_my_questionnaire_question(text, text);

revoke all on function public.clear_my_questionnaire_question(text, text, bigint, bigint)
  from public, anon;
grant execute on function public.clear_my_questionnaire_question(text, text, bigint, bigint)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Save progress position (status always derived; never client completed)
-- ---------------------------------------------------------------------------
drop function if exists public.save_my_questionnaire_progress_position(
  text, text, text, text, public.questionnaire_progress_status
);

create or replace function public.save_my_questionnaire_progress_position(
  p_version_key text,
  p_category_key text default null,
  p_question_key text default null,
  p_phase text default null,
  p_expected_write_generation bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_category_id uuid;
  v_question_id uuid;
  v_write_generation bigint;
  v_status public.questionnaire_progress_status;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  select p.write_generation
    into v_write_generation
  from public.user_questionnaire_progress p
  where p.user_id = v_uid
    and p.version_id = v_version_id
  for update;

  if coalesce(p_expected_write_generation, 0) <> coalesce(v_write_generation, 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_generation',
      'message', 'Your Compatibility Profile was restarted. Reload and try again.',
      'write_generation', v_write_generation
    );
  end if;

  if p_category_key is not null then
    select c.id into v_category_id
    from public.questionnaire_categories c
    where c.version_id = v_version_id
      and c.category_key = p_category_key
    limit 1;
    if v_category_id is null then
      return jsonb_build_object('ok', false, 'message', 'Category was not found.');
    end if;
  else
    v_category_id := null;
  end if;

  if p_question_key is not null then
    select q.id into v_question_id
    from public.questionnaire_questions q
    join public.questionnaire_categories c on c.id = q.category_id
    where c.version_id = v_version_id
      and q.question_key = p_question_key
    limit 1;
    if v_question_id is null then
      return jsonb_build_object('ok', false, 'message', 'Question was not found.');
    end if;
  else
    v_question_id := null;
  end if;

  if p_phase is not null
     and p_phase not in ('base', 'priority', 'intro', 'complete') then
    return jsonb_build_object('ok', false, 'message', 'Progress phase is invalid.');
  end if;

  update public.user_questionnaire_progress
  set
    current_category_id = v_category_id,
    current_question_id = v_question_id,
    current_phase = p_phase,
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where user_id = v_uid
    and version_id = v_version_id;

  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  select status into v_status
  from public.user_questionnaire_progress
  where user_id = v_uid
    and version_id = v_version_id;

  return jsonb_build_object(
    'ok', true,
    'status', v_status,
    'write_generation', v_write_generation
  );
end;
$$;

revoke all on function public.save_my_questionnaire_progress_position(
  text, text, text, text, bigint
) from public, anon;
grant execute on function public.save_my_questionnaire_progress_position(
  text, text, text, text, bigint
) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Clear one category (includes hidden answers; bumps write generation)
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_category(
  p_version_key text,
  p_category_key text,
  p_expected_write_generation bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_category_id uuid;
  v_deleted integer := 0;
  v_write_generation bigint;
  v_new_generation bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  select c.id into v_category_id
  from public.questionnaire_categories c
  where c.version_id = v_version_id
    and c.category_key = p_category_key
  limit 1;

  if v_category_id is null then
    return jsonb_build_object('ok', false, 'message', 'Category was not found.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  select p.write_generation
    into v_write_generation
  from public.user_questionnaire_progress p
  where p.user_id = v_uid
    and p.version_id = v_version_id
  for update;

  if coalesce(p_expected_write_generation, 0) <> coalesce(v_write_generation, 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_generation',
      'message', 'Your Compatibility Profile was restarted. Reload and try again.',
      'write_generation', v_write_generation
    );
  end if;

  delete from public.user_questionnaire_responses r
  using public.questionnaire_questions q
  where r.user_id = v_uid
    and r.version_id = v_version_id
    and r.question_id = q.id
    and q.category_id = v_category_id;

  get diagnostics v_deleted = row_count;
  v_new_generation := coalesce(v_write_generation, 0) + 1;

  update public.user_questionnaire_progress
  set
    write_generation = v_new_generation,
    current_category_id = v_category_id,
    current_question_id = null,
    current_phase = 'intro',
    updated_at = now()
  where user_id = v_uid
    and version_id = v_version_id;

  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  return jsonb_build_object(
    'ok', true,
    'category_key', p_category_key,
    'deleted_responses', v_deleted,
    'write_generation', v_new_generation
  );
end;
$$;

drop function if exists public.clear_my_questionnaire_category(text, text);

revoke all on function public.clear_my_questionnaire_category(text, text, bigint)
  from public, anon;
grant execute on function public.clear_my_questionnaire_category(text, text, bigint)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Clear full Compatibility Profile for the active version only
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_profile(
  p_version_key text,
  p_expected_write_generation bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_write_generation bigint;
  v_new_generation bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  select p.write_generation
    into v_write_generation
  from public.user_questionnaire_progress p
  where p.user_id = v_uid
    and p.version_id = v_version_id
  for update;

  if coalesce(p_expected_write_generation, 0) <> coalesce(v_write_generation, 0) then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_generation',
      'message', 'Your Compatibility Profile was restarted. Reload and try again.',
      'write_generation', v_write_generation
    );
  end if;

  delete from public.user_questionnaire_responses
  where user_id = v_uid
    and version_id = v_version_id;

  v_new_generation := coalesce(v_write_generation, 0) + 1;

  update public.user_questionnaire_progress
  set
    status = 'not_started',
    write_generation = v_new_generation,
    current_category_id = null,
    current_question_id = null,
    current_phase = null,
    started_at = null,
    completed_at = null,
    updated_at = now()
  where user_id = v_uid
    and version_id = v_version_id;

  return jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'write_generation', v_new_generation
  );
end;
$$;

drop function if exists public.clear_my_questionnaire_profile(text);

revoke all on function public.clear_my_questionnaire_profile(text, bigint) from public, anon;
grant execute on function public.clear_my_questionnaire_profile(text, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Load my private questionnaire state
-- ---------------------------------------------------------------------------
create or replace function public.load_my_questionnaire_state(
  p_version_key text default 'compatibility_profile_v1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
  v_progress jsonb;
  v_responses jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select v.id into v_version_id
  from public.questionnaire_versions v
  where v.version_key = p_version_key
    and v.is_active = true
  limit 1;

  if v_version_id is null then
    return jsonb_build_object('ok', false, 'message', 'Active questionnaire version was not found.');
  end if;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);
  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  select jsonb_build_object(
    'status', p.status,
    'category_key', c.category_key,
    'question_key', q.question_key,
    'phase', p.current_phase,
    'write_generation', p.write_generation,
    'started_at', p.started_at,
    'completed_at', p.completed_at,
    'updated_at', p.updated_at
  )
  into v_progress
  from public.user_questionnaire_progress p
  left join public.questionnaire_categories c on c.id = p.current_category_id
  left join public.questionnaire_questions q on q.id = p.current_question_id
  where p.user_id = v_uid
    and p.version_id = v_version_id;

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.question_key), '[]'::jsonb)
  into v_responses
  from (
    select
      qq.question_key,
      cc.category_key,
      r.response_state,
      r.active_qualifiers,
      r.identity_refinement,
      r.identity_user_supplied,
      r.identity_public_display_allowed,
      r.identity_private_matching_allowed,
      r.revision,
      r.updated_at,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'choice_key', ac.choice_key,
              'context_text', sc.context_text
            )
            order by ac.display_order
          )
          from public.user_questionnaire_selected_choices sc
          join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
          where sc.response_id = r.id
        ),
        '[]'::jsonb
      ) as selected_choices,
      coalesce(
        (
          select jsonb_agg(ac.choice_key order by ac.display_order)
          from public.user_questionnaire_priority_selections ps
          join public.questionnaire_answer_choices ac on ac.id = ps.choice_id
          where ps.response_id = r.id
        ),
        '[]'::jsonb
      ) as priority_choice_keys
    from public.user_questionnaire_responses r
    join public.questionnaire_questions qq on qq.id = r.question_id
    join public.questionnaire_categories cc on cc.id = qq.category_id
    where r.user_id = v_uid
      and r.version_id = v_version_id
  ) x;

  return jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'progress', v_progress,
    'responses', v_responses
  );
end;
$$;

revoke all on function public.load_my_questionnaire_state(text) from public, anon;
grant execute on function public.load_my_questionnaire_state(text) to authenticated;
