-- Questionnaire-powered Relationship Alignment comparison boundary.
--
-- This migration deliberately keeps raw questionnaire answers owner-private.
-- Authenticated callers receive only comparison metrics plus public catalog
-- metadata. Choice keys, choice labels, optional context, identity refinements,
-- and either person's raw response payload never cross this RPC boundary.

create or replace function public.forge_questionnaire_alignment_pair(
  p_viewer_id uuid,
  p_partner_id uuid,
  p_version_key text default 'compatibility_profile_v1'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with active_version as (
    select v.id
    from public.questionnaire_versions v
    where v.version_key = p_version_key
      and v.is_active = true
    order by v.created_at desc
    limit 1
  ),
  questions as (
    select
      q.id,
      c.category_key,
      c.title as category_title,
      c.display_order as category_number,
      q.question_key,
      q.question_number,
      q.prompt,
      q.alignment_purpose,
      q.response_behavior,
      (
        select count(*)::integer
        from public.questionnaire_answer_choices ac
        where ac.question_id = q.id
      ) as choice_count
    from active_version v
    join public.questionnaire_categories c on c.version_id = v.id
    join public.questionnaire_questions q on q.category_id = c.id
    where c.status = 'locked'
  ),
  responses as (
    select
      r.user_id,
      r.question_id,
      r.response_state,
      public.forge_questionnaire_response_is_complete(r.id) as is_complete,
      coalesce(
        (
          select array_agg(ac.choice_key order by ac.display_order)
          from public.user_questionnaire_selected_choices sc
          join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
          where sc.response_id = r.id
        ),
        '{}'::text[]
      ) as selected_choice_keys,
      coalesce(
        (
          select array_agg(ac.choice_key order by ac.display_order)
          from public.user_questionnaire_priority_selections ps
          join public.questionnaire_answer_choices ac on ac.id = ps.choice_id
          where ps.response_id = r.id
        ),
        '{}'::text[]
      ) as priority_choice_keys
    from active_version v
    join public.user_questionnaire_responses r on r.version_id = v.id
    where r.user_id in (p_viewer_id, p_partner_id)
  ),
  paired as (
    select
      q.*,
      vr.response_state as viewer_response_state,
      pr.response_state as partner_response_state,
      coalesce(vr.is_complete, false) as viewer_complete,
      coalesce(pr.is_complete, false) as partner_complete,
      coalesce(vr.selected_choice_keys, '{}'::text[]) as viewer_choices,
      coalesce(pr.selected_choice_keys, '{}'::text[]) as partner_choices,
      coalesce(vr.priority_choice_keys, '{}'::text[]) as viewer_priorities,
      coalesce(pr.priority_choice_keys, '{}'::text[]) as partner_priorities
    from questions q
    left join responses vr
      on vr.question_id = q.id
     and vr.user_id = p_viewer_id
    left join responses pr
      on pr.question_id = q.id
     and pr.user_id = p_partner_id
  ),
  calculated as (
    select
      p.*,
      (
        p.viewer_response_state = 'answered'
        and p.partner_response_state = 'answered'
        and p.viewer_complete
        and p.partner_complete
      ) as comparable,
      shared.shared_count,
      combined.union_count,
      priority_shared.shared_count as priority_shared_count,
      priority_combined.union_count as priority_union_count,
      (
        select ac.display_order
        from public.questionnaire_answer_choices ac
        where ac.question_id = p.id
          and ac.choice_key = p.viewer_choices[1]
        limit 1
      ) as viewer_choice_order,
      (
        select ac.display_order
        from public.questionnaire_answer_choices ac
        where ac.question_id = p.id
          and ac.choice_key = p.partner_choices[1]
        limit 1
      ) as partner_choice_order
    from paired p
    cross join lateral (
      select count(*)::integer as shared_count
      from (
        select unnest(p.viewer_choices)
        intersect
        select unnest(p.partner_choices)
      ) values_shared
    ) shared
    cross join lateral (
      select count(*)::integer as union_count
      from (
        select unnest(p.viewer_choices)
        union
        select unnest(p.partner_choices)
      ) values_combined
    ) combined
    cross join lateral (
      select count(*)::integer as shared_count
      from (
        select unnest(p.viewer_priorities)
        intersect
        select unnest(p.partner_priorities)
      ) values_shared
    ) priority_shared
    cross join lateral (
      select count(*)::integer as union_count
      from (
        select unnest(p.viewer_priorities)
        union
        select unnest(p.partner_priorities)
      ) values_combined
    ) priority_combined
  ),
  safe_rows as (
    select
      category_key,
      category_title,
      category_number,
      question_key,
      question_number,
      prompt,
      alignment_purpose,
      response_behavior,
      comparable,
      case
        when comparable then viewer_choices = partner_choices
        else false
      end as exact_match,
      case
        when comparable and union_count > 0
          then round(shared_count::numeric / union_count::numeric, 6)
        else null
      end as selected_overlap,
      case
        when comparable and priority_union_count > 0
          then round(priority_shared_count::numeric / priority_union_count::numeric, 6)
        else null
      end as priority_overlap,
      case
        when comparable
          and response_behavior = 'scale_range'
          and viewer_choice_order is not null
          and partner_choice_order is not null
          then abs(viewer_choice_order - partner_choice_order)
        else null
      end as ordinal_distance,
      case
        when comparable and response_behavior = 'scale_range'
          then greatest(choice_count - 1, 1)
        else null
      end as ordinal_span
    from calculated
  )
  select jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'partner_id', p_partner_id,
    'viewer_answered_count', (
      select count(*)::integer
      from responses
      where user_id = p_viewer_id
        and response_state = 'answered'
        and is_complete
    ),
    'partner_answered_count', (
      select count(*)::integer
      from responses
      where user_id = p_partner_id
        and response_state = 'answered'
        and is_complete
    ),
    'comparable_question_count', (
      select count(*)::integer from safe_rows where comparable
    ),
    'comparable_category_count', (
      select count(distinct category_key)::integer from safe_rows where comparable
    ),
    'questions', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'category_key', category_key,
            'category_title', category_title,
            'category_number', category_number,
            'question_key', question_key,
            'question_number', question_number,
            'prompt', prompt,
            'alignment_purpose', alignment_purpose,
            'response_behavior', response_behavior,
            'comparable', comparable,
            'exact_match', exact_match,
            'selected_overlap', selected_overlap,
            'priority_overlap', priority_overlap,
            'ordinal_distance', ordinal_distance,
            'ordinal_span', ordinal_span
          )
          order by category_number, question_number
        )
        from safe_rows
      ),
      '[]'::jsonb
    )
  );
$$;

comment on function public.forge_questionnaire_alignment_pair(uuid, uuid, text) is
  'Internal comparison helper. Returns safe metrics and public catalog metadata only; never raw questionnaire answers.';

revoke all on function public.forge_questionnaire_alignment_pair(uuid, uuid, text)
  from public, anon, authenticated;

create or replace function public.load_questionnaire_alignment_comparison(
  p_partner_id uuid,
  p_version_key text default 'compatibility_profile_v1'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'authentication_required',
      'message', 'Authentication required.'
    );
  end if;

  if p_partner_id is null or p_partner_id = v_uid then
    return jsonb_build_object(
      'ok', false,
      'code', 'profile_unavailable',
      'message', 'This profile is not available.'
    );
  end if;

  if public.forge_users_blocked(v_uid, p_partner_id)
     or not exists (
       select 1
       from public.discoverable_profiles dp
       where dp.id = p_partner_id
     ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'profile_unavailable',
      'message', 'This profile is not available.'
    );
  end if;

  return public.forge_questionnaire_alignment_pair(
    v_uid,
    p_partner_id,
    p_version_key
  );
end;
$$;

comment on function public.load_questionnaire_alignment_comparison(uuid, text) is
  'Loads privacy-safe questionnaire comparison metrics for one discoverable, unblocked profile.';

revoke all on function public.load_questionnaire_alignment_comparison(uuid, text)
  from public, anon;
grant execute on function public.load_questionnaire_alignment_comparison(uuid, text)
  to authenticated;

create or replace function public.load_questionnaire_alignment_comparisons(
  p_partner_ids uuid[],
  p_version_key text default 'compatibility_profile_v1'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_partner_id uuid;
  v_results jsonb := '{}'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'authentication_required',
      'message', 'Authentication required.'
    );
  end if;

  for v_partner_id in
    select distinct candidate_id
    from unnest(coalesce(p_partner_ids, '{}'::uuid[])) candidate_id
    where candidate_id is not null
      and candidate_id <> v_uid
    order by candidate_id
    limit 50
  loop
    if not public.forge_users_blocked(v_uid, v_partner_id)
       and exists (
         select 1
         from public.discoverable_profiles dp
         where dp.id = v_partner_id
       ) then
      v_results := v_results || jsonb_build_object(
        v_partner_id::text,
        public.forge_questionnaire_alignment_pair(
          v_uid,
          v_partner_id,
          p_version_key
        )
      );
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'version_key', p_version_key,
    'comparisons', v_results
  );
end;
$$;

comment on function public.load_questionnaire_alignment_comparisons(uuid[], text) is
  'Batch privacy-safe questionnaire comparison metrics for up to 50 discoverable, unblocked profiles.';

revoke all on function public.load_questionnaire_alignment_comparisons(uuid[], text)
  from public, anon;
grant execute on function public.load_questionnaire_alignment_comparisons(uuid[], text)
  to authenticated;
