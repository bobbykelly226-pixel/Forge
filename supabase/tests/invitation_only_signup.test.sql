begin;

select plan(15);

select has_table(
  'public',
  'beta_signup_invitations',
  'Founding Beta signup invitations are stored'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.beta_signup_invitations'::regclass),
  'signup invitation allowlist has RLS enabled'
);

select has_function(
  'public',
  'hook_enforce_beta_signup_invitation',
  array['jsonb'],
  'before-user-created invitation hook exists'
);

select function_privs_are(
  'public',
  'hook_enforce_beta_signup_invitation',
  array['jsonb'],
  'anon',
  array[]::text[],
  'anonymous callers cannot invoke the invitation hook directly'
);

select function_privs_are(
  'public',
  'hook_enforce_beta_signup_invitation',
  array['jsonb'],
  'authenticated',
  array[]::text[],
  'authenticated members cannot invoke the invitation hook directly'
);

select function_privs_are(
  'public',
  'hook_enforce_beta_signup_invitation',
  array['jsonb'],
  'supabase_auth_admin',
  array['EXECUTE'],
  'only Supabase Auth may invoke the invitation hook'
);

insert into public.beta_signup_invitations (email, invited_at, expires_at, revoked_at)
values
  ('invited@example.com', now(), now() + interval '7 days', null),
  ('expired@example.com', now() - interval '2 days', now() - interval '1 day', null),
  ('revoked@example.com', now(), now() + interval '7 days', now());

-- The Supabase pgTAP runner cannot assume the internal supabase_auth_admin
-- role. The privilege assertions above verify the production execution
-- boundary; the disposable database owner exercises the hook behavior below.

select is(
  public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000001',
      'email', 'Invited@Example.com'
    ))
  ),
  '{}'::jsonb,
  'an active invitation allows signup and normalizes the submitted email'
);

select is(
  (select accepted_user_id::text from public.beta_signup_invitations where email = 'invited@example.com'),
  '10000000-0000-0000-0000-000000000001',
  'the hook reserves the invitation for the new Auth user'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000002',
      'email', 'invited@example.com'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'a consumed invitation cannot be replayed'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000003',
      'email', 'not-invited@example.com'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'an email not on the allowlist is rejected'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000004',
      'email', 'expired@example.com'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'an expired invitation is rejected'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000005',
      'email', 'revoked@example.com'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'a revoked invitation is rejected'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', 'not-a-uuid',
      'email', 'invited@example.com'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'an invalid user UUID is rejected without exposing database details'
);

select is(
  (public.hook_enforce_beta_signup_invitation(
    jsonb_build_object('user', jsonb_build_object(
      'id', '10000000-0000-0000-0000-000000000006',
      'email', 'invalid-email'
    ))
  ) #>> '{error,http_code}')::integer,
  403,
  'an invalid email is rejected'
);

select is(
  (select count(*)::integer from public.beta_signup_invitations where accepted_at is not null),
  1,
  'only the valid invitation was consumed'
);

select * from finish();
rollback;
