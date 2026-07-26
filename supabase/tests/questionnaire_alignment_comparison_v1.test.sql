-- pgTAP contract tests for the privacy-safe questionnaire alignment boundary.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;

select plan(12);

create function pg_temp._qa_authenticate(p_user_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated',
      'email', p_email
    )::text,
    true
  );
end;
$$;

create function pg_temp._qa_as_postgres()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role postgres';
end;
$$;

create function pg_temp._qa_seed_answer(
  p_user_id uuid,
  p_question_key text,
  p_choice_keys text[]
)
returns void
language plpgsql
as $$
declare
  v_version_id uuid := public.forge_active_questionnaire_version_id();
  v_question_id uuid;
  v_response_id uuid;
begin
  select q.id into v_question_id
  from public.questionnaire_questions q
  join public.questionnaire_categories c on c.id = q.category_id
  where c.version_id = v_version_id
    and q.question_key = p_question_key;

  insert into public.user_questionnaire_progress (
    user_id, version_id, status, write_generation
  ) values (
    p_user_id, v_version_id, 'in_progress', 0
  )
  on conflict (user_id, version_id) do nothing;

  insert into public.user_questionnaire_responses (
    user_id, version_id, question_id, response_state, revision
  ) values (
    p_user_id, v_version_id, v_question_id, 'answered', 1
  )
  on conflict (user_id, version_id, question_id) do update
  set response_state = 'answered',
      revision = public.user_questionnaire_responses.revision + 1
  returning id into v_response_id;

  delete from public.user_questionnaire_priority_selections
  where response_id = v_response_id;
  delete from public.user_questionnaire_selected_choices
  where response_id = v_response_id;

  insert into public.user_questionnaire_selected_choices (response_id, choice_id)
  select v_response_id, ac.id
  from public.questionnaire_answer_choices ac
  where ac.question_id = v_question_id
    and ac.choice_key = any(p_choice_keys);

  insert into public.user_questionnaire_priority_selections (response_id, choice_id)
  select v_response_id, selected.choice_id
  from (
    select sc.choice_id
    from public.user_questionnaire_selected_choices sc
    join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
    join public.questionnaire_questions q on q.id = ac.question_id
    where sc.response_id = v_response_id
      and q.priority_follow_up_prompt is not null
    order by ac.display_order
    limit 2
  ) selected;
end;
$$;

select pg_temp._qa_as_postgres();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'b1111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'qa_viewer@example.com',
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b2222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'qa_partner@example.com',
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b3333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'qa_hidden@example.com',
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, full_name, status, is_discoverable)
values
  (
    'b1111111-1111-4111-8111-111111111111',
    'QA Viewer',
    'active',
    true
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'QA Partner',
    'active',
    true
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    'QA Hidden',
    'active',
    false
  )
on conflict (id) do update
set status = excluded.status,
    is_discoverable = excluded.is_discoverable;

select pg_temp._qa_seed_answer(
  'b1111111-1111-4111-8111-111111111111',
  'relationship_vision_intentions_q01',
  array['relationship_vision_intentions_q01_c01']
);
select pg_temp._qa_seed_answer(
  'b2222222-2222-4222-8222-222222222222',
  'relationship_vision_intentions_q01',
  array['relationship_vision_intentions_q01_c01']
);
select pg_temp._qa_seed_answer(
  'b1111111-1111-4111-8111-111111111111',
  'relationship_vision_intentions_q02',
  array['relationship_vision_intentions_q02_c01']
);
select pg_temp._qa_seed_answer(
  'b2222222-2222-4222-8222-222222222222',
  'relationship_vision_intentions_q02',
  array['relationship_vision_intentions_q02_c05']
);
select pg_temp._qa_seed_answer(
  'b1111111-1111-4111-8111-111111111111',
  'values_character_q01',
  array['values_character_q01_c01', 'values_character_q01_c02']
);
select pg_temp._qa_seed_answer(
  'b2222222-2222-4222-8222-222222222222',
  'values_character_q01',
  array['values_character_q01_c02', 'values_character_q01_c03']
);

select has_function(
  'public',
  'load_questionnaire_alignment_comparison',
  array['uuid', 'text'],
  'single comparison RPC exists'
);

select has_function(
  'public',
  'load_questionnaire_alignment_comparisons',
  array['uuid[]', 'text'],
  'batch comparison RPC exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.load_questionnaire_alignment_comparison(uuid,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.load_questionnaire_alignment_comparison(uuid,text)',
    'execute'
  ),
  'only authenticated can execute the public comparison RPC'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.forge_questionnaire_alignment_pair(uuid,uuid,text)',
    'execute'
  ),
  'authenticated cannot execute the arbitrary-user internal helper'
);

select pg_temp._qa_authenticate(
  'b1111111-1111-4111-8111-111111111111',
  'qa_viewer@example.com'
);

create temporary table _qa_result as
select public.load_questionnaire_alignment_comparison(
  'b2222222-2222-4222-8222-222222222222',
  'compatibility_profile_v1'
) as payload;
grant select on table _qa_result to authenticated;

select is(
  (select payload->>'ok' from _qa_result),
  'true',
  'eligible discoverable partner returns a comparison'
);

select ok(
  (select payload::text from _qa_result) not like '%"choice_key"%'
  and (select payload::text from _qa_result) not like '%"choice_label"%'
  and (select payload::text from _qa_result) not like '%"context_text"%'
  and (select payload::text from _qa_result) not like '%identity_refinement%',
  'comparison payload exposes no raw answer, context, or identity fields'
);

select is(
  (
    select question->>'exact_match'
    from _qa_result,
    jsonb_array_elements(payload->'questions') question
    where question->>'question_key' = 'relationship_vision_intentions_q01'
  ),
  'true',
  'exact categorical answers produce only an exact-match metric'
);

select ok(
  (
    select
      (question->>'ordinal_distance')::integer = 4
      and (question->>'ordinal_span')::integer = 4
    from _qa_result,
    jsonb_array_elements(payload->'questions') question
    where question->>'question_key' = 'relationship_vision_intentions_q02'
  ),
  'scale divergence is represented as distance and span without answer values'
);

select is(
  (
    select round((question->>'selected_overlap')::numeric, 6)
    from _qa_result,
    jsonb_array_elements(payload->'questions') question
    where question->>'question_key' = 'values_character_q01'
  ),
  0.333333::numeric,
  'multi-select comparison returns only set-overlap'
);

select is(
  (
    public.load_questionnaire_alignment_comparison(
      'b3333333-3333-4333-8333-333333333333',
      'compatibility_profile_v1'
    )->>'code'
  ),
  'profile_unavailable',
  'non-discoverable profiles cannot be compared'
);

select ok(
  (
    public.load_questionnaire_alignment_comparisons(
      array[
        'b2222222-2222-4222-8222-222222222222',
        'b2222222-2222-4222-8222-222222222222'
      ]::uuid[],
      'compatibility_profile_v1'
    )->'comparisons'
  ) ? 'b2222222-2222-4222-8222-222222222222',
  'batch comparison includes an eligible partner once'
);

select ok(
  not ((
    public.load_questionnaire_alignment_comparisons(
      array[
        'b1111111-1111-4111-8111-111111111111',
        'b3333333-3333-4333-8333-333333333333'
      ]::uuid[],
      'compatibility_profile_v1'
    )->'comparisons'
  ) ? 'b1111111-1111-4111-8111-111111111111')
  and not ((
    public.load_questionnaire_alignment_comparisons(
      array[
        'b1111111-1111-4111-8111-111111111111',
        'b3333333-3333-4333-8333-333333333333'
      ]::uuid[],
      'compatibility_profile_v1'
    )->'comparisons'
  ) ? 'b3333333-3333-4333-8333-333333333333'),
  'batch comparison excludes self and unavailable profiles'
);

select * from finish();
rollback;
