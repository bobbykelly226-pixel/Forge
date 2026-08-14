begin;

select plan(8);

select ok(
  not has_function_privilege(
    'anon',
    'public.ensure_foundational_user_records(uuid)',
    'EXECUTE'
  ),
  'anonymous callers cannot invoke foundational record repair'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.ensure_foundational_user_records(uuid)',
    'EXECUTE'
  ),
  'authenticated members can invoke their protected self-repair RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.ensure_foundational_user_records(uuid)',
    'EXECUTE'
  ),
  'the trusted service role can invoke foundational record repair'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.handle_new_user()',
    'EXECUTE'
  ),
  'anonymous callers cannot invoke the new-user trigger function directly'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.handle_new_user()',
    'EXECUTE'
  ),
  'authenticated members cannot invoke the new-user trigger function directly'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.handle_new_user()',
    'EXECUTE'
  ),
  'the trusted service role retains trigger-function access'
);

select function_privs_are(
  'public',
  'ensure_foundational_user_records',
  array['uuid'],
  'anon',
  array[]::text[],
  'foundational record repair has no effective anonymous privileges'
);

select function_privs_are(
  'public',
  'handle_new_user',
  array[]::text[],
  'authenticated',
  array[]::text[],
  'new-user trigger function has no effective member privileges'
);

select * from finish();
rollback;
