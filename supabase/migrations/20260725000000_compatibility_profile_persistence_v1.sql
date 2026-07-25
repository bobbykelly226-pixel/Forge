-- Compatibility Profile Persistence V1
-- Secure owner-only RPCs and resume position fields for the 100 question catalog.
-- Depends on 20260723000000_questionnaire_foundation.sql.

-- ---------------------------------------------------------------------------
-- 1. Progress resume columns
-- ---------------------------------------------------------------------------
alter table public.user_questionnaire_progress
  add column if not exists current_question_id uuid null
    references public.questionnaire_questions (id) on delete set null;

alter table public.user_questionnaire_progress
  add column if not exists current_phase text null;

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

-- Enforce question belongs to the same version as progress (via category).
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

-- Optimistic concurrency for stale client saves.
alter table public.user_questionnaire_responses
  add column if not exists client_mutation bigint not null default 0;

comment on column public.user_questionnaire_responses.client_mutation is
  'Monotonic client mutation token. Older mutations must not overwrite newer saves.';

-- ---------------------------------------------------------------------------
-- 2. Helpers
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
  v_total_questions integer;
  v_answered_questions integer;
  v_status public.questionnaire_progress_status;
begin
  select exists (
    select 1
    from public.user_questionnaire_responses r
    where r.user_id = p_user_id
      and r.version_id = p_version_id
      and r.response_state = 'answered'
  ) into v_has_responses;

  select count(*)::integer into v_total_questions
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where c.version_id = p_version_id;

  select count(*)::integer into v_answered_questions
  from public.user_questionnaire_responses r
  where r.user_id = p_user_id
    and r.version_id = p_version_id
    and r.response_state = 'answered';

  if not v_has_responses then
    v_status := 'not_started';
  elsif v_answered_questions >= v_total_questions and v_total_questions > 0 then
    -- Application layer recomputes eligibility-aware completion.
    -- Database status uses answered count as an upper-bound signal; the app
    -- sets completed explicitly through save_my_questionnaire_progress_position
    -- when every currently eligible question is complete.
    v_status := 'in_progress';
  else
    v_status := 'in_progress';
  end if;

  update public.user_questionnaire_progress p
  set
    status = case
      when p.status = 'completed' and v_has_responses then p.status
      else v_status
    end,
    started_at = coalesce(p.started_at, case when v_has_responses then now() else null end),
    completed_at = case
      when p.status = 'completed' then coalesce(p.completed_at, now())
      when not v_has_responses then null
      else p.completed_at
    end,
    updated_at = now()
  where p.user_id = p_user_id
    and p.version_id = p_version_id;
end;
$$;

revoke all on function public.forge_recalculate_questionnaire_progress(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 3. Ensure progress row
-- ---------------------------------------------------------------------------
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
  insert into public.user_questionnaire_progress (user_id, version_id, status)
  values (p_user_id, p_version_id, 'not_started')
  on conflict (user_id, version_id) do nothing;
end;
$$;

revoke all on function public.forge_ensure_questionnaire_progress(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 4. Save or replace one complete question response (atomic)
-- ---------------------------------------------------------------------------
create or replace function public.save_my_questionnaire_response(
  p_version_key text,
  p_question_key text,
  p_choice_keys text[],
  p_priority_choice_keys text[] default '{}',
  p_choice_contexts jsonb default '{}'::jsonb,
  p_identity jsonb default '{}'::jsonb,
  p_client_mutation bigint default 1,
  p_response_state public.questionnaire_response_state default 'answered',
  p_active_qualifiers public.questionnaire_response_qualifier[] default '{}'
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
  v_existing_mutation bigint;
  v_choice_key text;
  v_choice_id uuid;
  v_context text;
  v_priority_key text;
  v_priority_id uuid;
  v_mutation bigint := greatest(coalesce(p_client_mutation, 1), 1);
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

  select r.id, r.client_mutation
    into v_response_id, v_existing_mutation
  from public.user_questionnaire_responses r
  where r.user_id = v_uid
    and r.version_id = v_version_id
    and r.question_id = v_question_id
  for update;

  if v_response_id is not null and coalesce(v_existing_mutation, 0) > v_mutation then
    return jsonb_build_object(
      'ok', false,
      'code', 'stale_mutation',
      'message', 'A newer answer is already saved.',
      'client_mutation', v_existing_mutation
    );
  end if;

  if v_response_id is null then
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
      client_mutation
    ) values (
      v_uid,
      v_version_id,
      v_question_id,
      coalesce(p_response_state, 'answered'),
      coalesce(p_active_qualifiers, '{}'),
      nullif(p_identity->>'refinement', ''),
      nullif(p_identity->>'user_supplied', ''),
      case
        when p_identity ? 'public_display_allowed'
          then (p_identity->>'public_display_allowed')::boolean
        else null
      end,
      case
        when p_identity ? 'private_matching_allowed'
          then (p_identity->>'private_matching_allowed')::boolean
        else null
      end,
      v_mutation
    )
    returning id into v_response_id;
  else
    update public.user_questionnaire_responses
    set
      response_state = coalesce(p_response_state, 'answered'),
      active_qualifiers = coalesce(p_active_qualifiers, '{}'),
      identity_refinement = nullif(p_identity->>'refinement', ''),
      identity_user_supplied = nullif(p_identity->>'user_supplied', ''),
      identity_public_display_allowed = case
        when p_identity ? 'public_display_allowed'
          then (p_identity->>'public_display_allowed')::boolean
        else null
      end,
      identity_private_matching_allowed = case
        when p_identity ? 'private_matching_allowed'
          then (p_identity->>'private_matching_allowed')::boolean
        else null
      end,
      client_mutation = v_mutation,
      updated_at = now()
    where id = v_response_id;

    delete from public.user_questionnaire_priority_selections
    where response_id = v_response_id;

    delete from public.user_questionnaire_selected_choices
    where response_id = v_response_id;
  end if;

  if p_choice_keys is not null then
    foreach v_choice_key in array p_choice_keys
    loop
      select ac.id into v_choice_id
      from public.questionnaire_answer_choices ac
      where ac.question_id = v_question_id
        and ac.choice_key = v_choice_key
      limit 1;

      if v_choice_id is null then
        return jsonb_build_object('ok', false, 'message', 'One or more choices are invalid for this question.');
      end if;

      v_context := null;
      if p_choice_contexts is not null and p_choice_contexts ? v_choice_key then
        v_context := nullif(p_choice_contexts->>v_choice_key, '');
      end if;

      insert into public.user_questionnaire_selected_choices (
        response_id, choice_id, context_text
      ) values (
        v_response_id, v_choice_id, v_context
      );
    end loop;
  end if;

  if p_priority_choice_keys is not null then
    foreach v_priority_key in array p_priority_choice_keys
    loop
      select ac.id into v_priority_id
      from public.questionnaire_answer_choices ac
      where ac.question_id = v_question_id
        and ac.choice_key = v_priority_key
      limit 1;

      if v_priority_id is null then
        return jsonb_build_object('ok', false, 'message', 'One or more priority choices are invalid for this question.');
      end if;

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
    'client_mutation', v_mutation
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
  text, text, text[], text[], jsonb, jsonb, bigint,
  public.questionnaire_response_state, public.questionnaire_response_qualifier[]
) from public, anon;
grant execute on function public.save_my_questionnaire_response(
  text, text, text[], text[], jsonb, jsonb, bigint,
  public.questionnaire_response_state, public.questionnaire_response_qualifier[]
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Clear one question
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_question(
  p_version_key text,
  p_question_key text
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

  delete from public.user_questionnaire_responses
  where user_id = v_uid
    and version_id = v_version_id
    and question_id = v_question_id;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);
  update public.user_questionnaire_progress
  set status = 'in_progress',
      completed_at = null,
      updated_at = now()
  where user_id = v_uid
    and version_id = v_version_id
    and status = 'completed';

  perform public.forge_recalculate_questionnaire_progress(v_uid, v_version_id);

  return jsonb_build_object('ok', true, 'question_key', p_question_key);
end;
$$;

revoke all on function public.clear_my_questionnaire_question(text, text) from public, anon;
grant execute on function public.clear_my_questionnaire_question(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Save progress position / status
-- ---------------------------------------------------------------------------
create or replace function public.save_my_questionnaire_progress_position(
  p_version_key text,
  p_category_key text default null,
  p_question_key text default null,
  p_phase text default null,
  p_status public.questionnaire_progress_status default null
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

  if p_category_key is not null then
    select c.id into v_category_id
    from public.questionnaire_categories c
    where c.version_id = v_version_id
      and c.category_key = p_category_key
    limit 1;
    if v_category_id is null then
      return jsonb_build_object('ok', false, 'message', 'Category was not found.');
    end if;
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
  end if;

  update public.user_questionnaire_progress
  set
    current_category_id = coalesce(v_category_id, current_category_id),
    current_question_id = case
      when p_question_key is null then current_question_id
      else v_question_id
    end,
    current_phase = case
      when p_phase is null then current_phase
      else p_phase
    end,
    status = coalesce(p_status, status),
    started_at = coalesce(started_at, now()),
    completed_at = case
      when coalesce(p_status, status) = 'completed' then coalesce(completed_at, now())
      when p_status is not null and p_status <> 'completed' then null
      else completed_at
    end,
    updated_at = now()
  where user_id = v_uid
    and version_id = v_version_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.save_my_questionnaire_progress_position(
  text, text, text, text, public.questionnaire_progress_status
) from public, anon;
grant execute on function public.save_my_questionnaire_progress_position(
  text, text, text, text, public.questionnaire_progress_status
) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Clear one category (includes hidden conditional answers)
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_category(
  p_version_key text,
  p_category_key text
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

  delete from public.user_questionnaire_responses r
  using public.questionnaire_questions q
  where r.user_id = v_uid
    and r.version_id = v_version_id
    and r.question_id = q.id
    and q.category_id = v_category_id;

  get diagnostics v_deleted = row_count;

  perform public.forge_ensure_questionnaire_progress(v_uid, v_version_id);

  update public.user_questionnaire_progress
  set
    status = 'in_progress',
    completed_at = null,
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
    'deleted_responses', v_deleted
  );
end;
$$;

revoke all on function public.clear_my_questionnaire_category(text, text) from public, anon;
grant execute on function public.clear_my_questionnaire_category(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Clear full Compatibility Profile for the active version only
-- ---------------------------------------------------------------------------
create or replace function public.clear_my_questionnaire_profile(
  p_version_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_version_id uuid;
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

  delete from public.user_questionnaire_responses
  where user_id = v_uid
    and version_id = v_version_id;

  delete from public.user_questionnaire_progress
  where user_id = v_uid
    and version_id = v_version_id;

  insert into public.user_questionnaire_progress (user_id, version_id, status)
  values (v_uid, v_version_id, 'not_started');

  return jsonb_build_object('ok', true, 'version_key', p_version_key);
end;
$$;

revoke all on function public.clear_my_questionnaire_profile(text) from public, anon;
grant execute on function public.clear_my_questionnaire_profile(text) to authenticated;

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

  select jsonb_build_object(
    'status', p.status,
    'category_key', c.category_key,
    'question_key', q.question_key,
    'phase', p.current_phase,
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
      r.client_mutation,
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
