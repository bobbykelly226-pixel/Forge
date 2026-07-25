-- pgTAP contract tests for Compatibility Profile Persistence V1.
-- Run with: supabase test db
--
-- Auth approach: prefer tests.create_supabase_user / tests.authenticate_as when
-- available (supabase-test-helpers). Otherwise insert auth.users and set
-- request.jwt.claim.sub + request.jwt.claims for authenticated role.
--
-- Question key pattern (seeded catalog):
--   <category_key>_qNN           e.g. relationship_vision_intentions_q01
--   <category_key>_qNN_cNN       e.g. relationship_vision_intentions_q01_c01

begin;

select plan(26);

-- ---------------------------------------------------------------------------
-- Helpers (pg_temp = session-scoped; CREATE TEMPORARY FUNCTION is not valid)
-- ---------------------------------------------------------------------------
create function pg_temp._cp_has_tests_helper()
returns boolean
language sql
stable
as $$
  select to_regprocedure('tests.create_supabase_user(text)') is not null;
$$;

create function pg_temp._cp_ensure_user(p_id uuid, p_email text)
returns uuid
language plpgsql
as $$
begin
  if pg_temp._cp_has_tests_helper() then
    perform tests.create_supabase_user(p_email);
    return tests.get_supabase_uid(p_email);
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return p_id;
end;
$$;

create function pg_temp._cp_authenticate(p_user_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
  if pg_temp._cp_has_tests_helper()
     and to_regprocedure('tests.authenticate_as(text)') is not null then
    perform tests.authenticate_as(p_email);
    return;
  end if;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id::text, 'role', 'authenticated', 'email', p_email)::text,
    true
  );
end;
$$;

create function pg_temp._cp_as_postgres()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role postgres';
end;
$$;

create function pg_temp._cp_write_generation()
returns bigint
language sql
stable
as $$
  select coalesce(
    (
      select p.write_generation
      from public.user_questionnaire_progress p
      where p.user_id = auth.uid()
        and p.version_id = public.forge_active_questionnaire_version_id()
    ),
    0
  );
$$;

create function pg_temp._cp_question_revision(p_question_key text)
returns bigint
language sql
stable
as $$
  select coalesce(
    (
      select r.revision
      from public.user_questionnaire_responses r
      join public.questionnaire_questions q on q.id = r.question_id
      where r.user_id = auth.uid()
        and q.question_key = p_question_key
    ),
    0
  );
$$;

create function pg_temp._cp_save(
  p_question_key text,
  p_choice_keys text[],
  p_priority_keys text[] default '{}',
  p_contexts jsonb default '{}'::jsonb,
  p_identity jsonb default '{}'::jsonb,
  p_revision bigint default 0,
  p_write_generation bigint default 0,
  p_operation_id uuid default null
)
returns jsonb
language plpgsql
as $$
declare
  v_sql text;
  v_result jsonb;
begin
  if p_operation_id is not null
     and exists (
       select 1
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'save_my_questionnaire_response'
         and pg_get_function_identity_arguments(p.oid) ilike '%operation%'
     ) then
    v_sql := $q$
      select public.save_my_questionnaire_response(
        p_version_key => 'compatibility_profile_v1',
        p_question_key => $1,
        p_choice_keys => $2,
        p_priority_choice_keys => $3,
        p_choice_contexts => $4,
        p_identity => $5,
        p_expected_revision => $6,
        p_expected_write_generation => $7,
        p_operation_id => $8
      )
    $q$;
    execute v_sql
      into v_result
      using p_question_key, p_choice_keys, p_priority_keys, p_contexts, p_identity,
            p_revision, p_write_generation, p_operation_id;
    return v_result;
  end if;

  return public.save_my_questionnaire_response(
    'compatibility_profile_v1',
    p_question_key,
    p_choice_keys,
    p_priority_keys,
    p_contexts,
    p_identity,
    p_revision,
    p_write_generation
  );
end;
$$;

select pg_temp._cp_as_postgres();

create temporary table _cp_users (
  label text primary key,
  user_id uuid not null,
  email text not null
);

insert into _cp_users (label, user_id, email)
values
  (
    'owner',
    pg_temp._cp_ensure_user('a1111111-1111-4111-8111-111111111111', 'cp_owner@example.com'),
    'cp_owner@example.com'
  ),
  (
    'other',
    pg_temp._cp_ensure_user('a2222222-2222-4222-8222-222222222222', 'cp_other@example.com'),
    'cp_other@example.com'
  );

do $$
begin
  if pg_temp._cp_has_tests_helper() then
    update _cp_users
    set user_id = tests.get_supabase_uid(email);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Authenticated direct INSERT/UPDATE on responses denied (or no privilege)
-- ---------------------------------------------------------------------------
select ok(
  not has_table_privilege('authenticated', 'public.user_questionnaire_responses', 'INSERT')
  and not has_table_privilege('authenticated', 'public.user_questionnaire_responses', 'UPDATE'),
  'authenticated lacks direct INSERT/UPDATE privilege on user_questionnaire_responses'
);

select pg_temp._cp_authenticate(
  (select user_id from _cp_users where label = 'owner'),
  (select email from _cp_users where label = 'owner')
);

select throws_ok(
  format(
    $sql$
      insert into public.user_questionnaire_responses (
        user_id, version_id, question_id, response_state, revision
      ) values (
        %L,
        public.forge_active_questionnaire_version_id(),
        '33333333-3333-4333-8333-000000000001',
        'answered',
        1
      )
    $sql$,
    (select user_id from _cp_users where label = 'owner')
  ),
  null,
  null,
  'authenticated direct INSERT into user_questionnaire_responses is denied'
);

-- ---------------------------------------------------------------------------
-- 2. Owner can SELECT own rows after RPC save
-- ---------------------------------------------------------------------------
select ok(
  (pg_temp._cp_save(
    'relationship_vision_intentions_q01',
    array['relationship_vision_intentions_q01_c01']
  )->>'ok')::boolean,
  'owner can save relationship_vision_intentions_q01 via RPC'
);

select isnt_empty(
  $sql$
    select 1
    from public.user_questionnaire_responses r
    join public.questionnaire_questions q on q.id = r.question_id
    where r.user_id = auth.uid()
      and q.question_key = 'relationship_vision_intentions_q01'
  $sql$,
  'owner can SELECT own questionnaire response rows after RPC save'
);

-- ---------------------------------------------------------------------------
-- 3. Another user cannot select first user's responses
-- ---------------------------------------------------------------------------
select pg_temp._cp_authenticate(
  (select user_id from _cp_users where label = 'other'),
  (select email from _cp_users where label = 'other')
);

select is_empty(
  $sql$
    select 1
    from public.user_questionnaire_responses r
    join public.questionnaire_questions q on q.id = r.question_id
    where q.question_key = 'relationship_vision_intentions_q01'
      and r.user_id = (select user_id from _cp_users where label = 'owner')
  $sql$,
  'other user cannot SELECT owner questionnaire responses'
);

select pg_temp._cp_authenticate(
  (select user_id from _cp_users where label = 'owner'),
  (select email from _cp_users where label = 'owner')
);

-- ---------------------------------------------------------------------------
-- 4. Selection-limit bypass rejected by RPC
-- ---------------------------------------------------------------------------
select is(
  pg_temp._cp_save(
    'relationship_vision_intentions_q05',
    array[
      'relationship_vision_intentions_q05_c01',
      'relationship_vision_intentions_q05_c02',
      'relationship_vision_intentions_q05_c03',
      'relationship_vision_intentions_q05_c04',
      'relationship_vision_intentions_q05_c05'
    ]
  )->>'message',
  'Too many choices were selected for this question.',
  'selection-limit bypass is rejected'
);

-- ---------------------------------------------------------------------------
-- 5. Mutually exclusive combination rejected
-- ---------------------------------------------------------------------------
select is(
  pg_temp._cp_save(
    'service_community_contribution_q02',
    array[
      'service_community_contribution_q02_c01',
      'service_community_contribution_q02_c18'
    ]
  )->>'message',
  'Mutually exclusive choices cannot be combined.',
  'mutually exclusive combination is rejected'
);

-- ---------------------------------------------------------------------------
-- 6. Cross-question choice rejected
-- ---------------------------------------------------------------------------
select is(
  pg_temp._cp_save(
    'relationship_vision_intentions_q01',
    array['relationship_vision_intentions_q02_c01'],
    '{}',
    '{}'::jsonb,
    '{}'::jsonb,
    pg_temp._cp_question_revision('relationship_vision_intentions_q01'),
    pg_temp._cp_write_generation()
  )->>'message',
  'One or more choices are invalid for this question.',
  'cross-question choice is rejected'
);

-- ---------------------------------------------------------------------------
-- 7. Duplicate choice keys rejected (or canonicalized without duplicate rows)
-- ---------------------------------------------------------------------------
select ok(
  (
    with save as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q03',
        array[
          'relationship_vision_intentions_q03_c01',
          'relationship_vision_intentions_q03_c01'
        ]
      ) as result
    ),
    rows as (
      select count(*)::int as n
      from public.user_questionnaire_selected_choices sc
      join public.user_questionnaire_responses r on r.id = sc.response_id
      join public.questionnaire_questions q on q.id = r.question_id
      join public.questionnaire_answer_choices ac on ac.id = sc.choice_id
      where r.user_id = auth.uid()
        and q.question_key = 'relationship_vision_intentions_q03'
        and ac.choice_key = 'relationship_vision_intentions_q03_c01'
    )
    select
      (select result->>'ok' from save) = 'false'
      or (select n from rows) = 1
  ),
  'duplicate choice keys are rejected or canonicalized to a single selected row'
);

-- ---------------------------------------------------------------------------
-- 8. Invalid priority rejected
-- ---------------------------------------------------------------------------
select is(
  pg_temp._cp_save(
    'relationship_vision_intentions_q05',
    array[
      'relationship_vision_intentions_q05_c01',
      'relationship_vision_intentions_q05_c02',
      'relationship_vision_intentions_q05_c03'
    ],
    array['relationship_vision_intentions_q05_c04']
  )->>'message',
  'Priority choices must be selected base choices.',
  'invalid priority (not in base selections) is rejected'
);

-- ---------------------------------------------------------------------------
-- 9. Response state derived (RPC has no p_response_state arg)
-- ---------------------------------------------------------------------------
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_my_questionnaire_response'
      and pg_get_function_identity_arguments(p.oid) ilike '%response_state%'
  ),
  'save_my_questionnaire_response has no p_response_state argument'
);

select is(
  (
    select r.response_state::text
    from public.user_questionnaire_responses r
    join public.questionnaire_questions q on q.id = r.question_id
    where r.user_id = auth.uid()
      and q.question_key = 'relationship_vision_intentions_q01'
  ),
  'answered',
  'response_state is derived server-side as answered after a normal save'
);

-- ---------------------------------------------------------------------------
-- 10. Invalid context/identity JSON types rejected
-- ---------------------------------------------------------------------------
select is(
  pg_temp._cp_save(
    'relationship_vision_intentions_q01',
    array['relationship_vision_intentions_q01_c02'],
    '{}',
    '{}'::jsonb,
    jsonb_build_object('refinement', 'should-fail'),
    pg_temp._cp_question_revision('relationship_vision_intentions_q01'),
    pg_temp._cp_write_generation()
  )->>'message',
  'Identity fields are not configured for this question.',
  'identity payload rejected for non structured_identity question'
);

select ok(
  (
    select (result->>'ok') = 'false'
    from (
      select public.save_my_questionnaire_response(
        'compatibility_profile_v1',
        'service_community_contribution_q02',
        array['service_community_contribution_q02_c19'],
        '{}',
        '["not-an-object"]'::jsonb,
        '{}'::jsonb,
        0,
        pg_temp._cp_write_generation()
      ) as result
    ) s
  ),
  'invalid choice_contexts JSON type is rejected'
);

-- ---------------------------------------------------------------------------
-- 11. Explicit empty answer for min_selections=0 completes as answered
-- ---------------------------------------------------------------------------
select ok(
  (
    with save as (
      select pg_temp._cp_save(
        'family_children_parenting_q04',
        array[]::text[]
      ) as result
    )
    select
      (select result->>'ok' from save) = 'true'
      and exists (
        select 1
        from public.user_questionnaire_responses r
        join public.questionnaire_questions q on q.id = r.question_id
        where r.user_id = auth.uid()
          and q.question_key = 'family_children_parenting_q04'
          and r.response_state = 'answered'
          and not exists (
            select 1
            from public.user_questionnaire_selected_choices sc
            where sc.response_id = r.id
          )
      )
  ),
  'empty answer for family_children_parenting_q04 (min_selections=0) completes as answered'
);

-- ---------------------------------------------------------------------------
-- 12. Required empty (min>0) remains unanswered via clear
-- ---------------------------------------------------------------------------
select ok(
  (
    with cleared as (
      select public.clear_my_questionnaire_question(
        'compatibility_profile_v1',
        'relationship_vision_intentions_q01',
        pg_temp._cp_question_revision('relationship_vision_intentions_q01'),
        pg_temp._cp_write_generation()
      ) as result
    )
    select
      (select result->>'ok' from cleared) = 'true'
      and exists (
        select 1
        from public.user_questionnaire_responses r
        join public.questionnaire_questions q on q.id = r.question_id
        where r.user_id = auth.uid()
          and q.question_key = 'relationship_vision_intentions_q01'
          and r.response_state = 'unanswered'
      )
  ),
  'clearing a required (min_selections>0) question leaves it unanswered'
);

-- ---------------------------------------------------------------------------
-- 13. Same operation_id retry returns original success (when supported)
-- ---------------------------------------------------------------------------
select ok(
  (
    case
      when exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'save_my_questionnaire_response'
          and pg_get_function_identity_arguments(p.oid) ilike '%operation%'
      ) then (
        with op as (
          select gen_random_uuid() as operation_id
        ),
        first_save as (
          select pg_temp._cp_save(
            'relationship_vision_intentions_q01',
            array['relationship_vision_intentions_q01_c03'],
            '{}',
            '{}'::jsonb,
            '{}'::jsonb,
            pg_temp._cp_question_revision('relationship_vision_intentions_q01'),
            pg_temp._cp_write_generation(),
            (select operation_id from op)
          ) as result
        ),
        retry as (
          select pg_temp._cp_save(
            'relationship_vision_intentions_q01',
            array['relationship_vision_intentions_q01_c03'],
            '{}',
            '{}'::jsonb,
            '{}'::jsonb,
            ((select result->>'revision' from first_save)::bigint - 1),
            pg_temp._cp_write_generation(),
            (select operation_id from op)
          ) as result
        )
        select
          (select result->>'ok' from first_save) = 'true'
          and (select result->>'ok' from retry) = 'true'
          and (select result->>'revision' from first_save)
            = (select result->>'revision' from retry)
      )
      else exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'save_my_questionnaire_response'
          and pg_get_function_identity_arguments(p.oid) ilike '%p_expected_revision%'
      )
    end
  ),
  'same operation_id retry returns original success (or revision CAS present until operation_id ships)'
);

-- ---------------------------------------------------------------------------
-- 14. Different operation with stale revision rejected
-- ---------------------------------------------------------------------------
select ok(
  (
    with baseline as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q02',
        array['relationship_vision_intentions_q02_c01'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        0,
        pg_temp._cp_write_generation()
      ) as result
    ),
    stale as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q02',
        array['relationship_vision_intentions_q02_c02'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        0,
        pg_temp._cp_write_generation()
      ) as result
    )
    select
      (select result->>'ok' from baseline) = 'true'
      and (select result->>'ok' from stale) = 'false'
      and (select result->>'code' from stale) = 'stale_revision'
  ),
  'different operation with stale revision is rejected'
);

-- ---------------------------------------------------------------------------
-- 15. Clear tombstone prevents resurrection with old revision
-- ---------------------------------------------------------------------------
select ok(
  (
    with saved as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q04',
        array['relationship_vision_intentions_q04_c01'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        0,
        pg_temp._cp_write_generation()
      ) as result
    ),
    rev as (
      select (select result->>'revision' from saved)::bigint as revision
    ),
    cleared as (
      select public.clear_my_questionnaire_question(
        'compatibility_profile_v1',
        'relationship_vision_intentions_q04',
        (select revision from rev),
        pg_temp._cp_write_generation()
      ) as result
    ),
    resurrect as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q04',
        array['relationship_vision_intentions_q04_c02'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        (select revision from rev),
        pg_temp._cp_write_generation()
      ) as result
    )
    select
      (select result->>'ok' from saved) = 'true'
      and (select result->>'ok' from cleared) = 'true'
      and (select result->>'ok' from resurrect) = 'false'
      and (select result->>'code' from resurrect) = 'stale_revision'
      and exists (
        select 1
        from public.user_questionnaire_responses r
        join public.questionnaire_questions q on q.id = r.question_id
        where r.user_id = auth.uid()
          and q.question_key = 'relationship_vision_intentions_q04'
          and r.response_state = 'unanswered'
      )
  ),
  'clear tombstone prevents resurrection with an old revision'
);

-- ---------------------------------------------------------------------------
-- 16. Category/full restart generation protection
-- ---------------------------------------------------------------------------
select ok(
  (
    with wg as (
      select pg_temp._cp_write_generation() as write_generation
    ),
    restarted as (
      select public.clear_my_questionnaire_category(
        'compatibility_profile_v1',
        'relationship_vision_intentions',
        (select write_generation from wg)
      ) as result
    ),
    blocked as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q01',
        array['relationship_vision_intentions_q01_c01'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        0,
        (select write_generation from wg)
      ) as result
    )
    select
      (select result->>'ok' from restarted) = 'true'
      and ((select result->>'write_generation' from restarted)::bigint)
        = (select write_generation from wg) + 1
      and (select result->>'ok' from blocked) = 'false'
      and (select result->>'code' from blocked) = 'stale_generation'
  ),
  'category restart bumps write_generation and blocks stale-generation saves'
);

select ok(
  (
    with wg as (
      select pg_temp._cp_write_generation() as write_generation
    ),
    restarted as (
      select public.clear_my_questionnaire_profile(
        'compatibility_profile_v1',
        (select write_generation from wg)
      ) as result
    ),
    blocked as (
      select pg_temp._cp_save(
        'relationship_vision_intentions_q01',
        array['relationship_vision_intentions_q01_c01'],
        '{}',
        '{}'::jsonb,
        '{}'::jsonb,
        0,
        (select write_generation from wg)
      ) as result
    )
    select
      (select result->>'ok' from restarted) = 'true'
      and (select result->>'ok' from blocked) = 'false'
      and (select result->>'code' from blocked) = 'stale_generation'
  ),
  'full profile restart bumps write_generation and blocks stale-generation saves'
);

-- ---------------------------------------------------------------------------
-- 17. Progress RPC cannot set completed directly (no p_status)
-- ---------------------------------------------------------------------------
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_my_questionnaire_progress_position'
      and pg_get_function_identity_arguments(p.oid) ilike '%p_status%'
  ),
  'save_my_questionnaire_progress_position has no p_status argument'
);

select ok(
  (
    with progress as (
      select public.save_my_questionnaire_progress_position(
        'compatibility_profile_v1',
        'relationship_vision_intentions',
        'relationship_vision_intentions_q01',
        'base',
        pg_temp._cp_write_generation()
      ) as result
    )
    select
      (select result->>'ok' from progress) = 'true'
      and coalesce((select result->>'status' from progress), '') <> 'completed'
  ),
  'progress RPC does not set status to completed from the client'
);

-- ---------------------------------------------------------------------------
-- 18. Mentions eligibility-aware completion helper exists
-- ---------------------------------------------------------------------------
select has_function(
  'public',
  'forge_question_currently_eligible',
  array['uuid', 'uuid'],
  'forge_question_currently_eligible helper exists'
);

select has_function(
  'public',
  'forge_questionnaire_response_is_complete',
  array['uuid'],
  'forge_questionnaire_response_is_complete helper exists'
);

select has_function(
  'public',
  'forge_user_open_to_parenting_or_stepparenting_role',
  array['uuid'],
  'forge_user_open_to_parenting_or_stepparenting_role eligibility helper exists'
);

select * from finish();
rollback;
