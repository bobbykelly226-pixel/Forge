begin;

select plan(6);

select is(
  (
    select c.reloptions @> array['security_invoker=true']::text[]
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'discoverable_profile_photos'
      and c.relkind = 'v'
  ),
  true,
  'the legacy Discovery photo view respects caller RLS'
);

select ok(
  to_regprocedure('public.list_eligible_discovery_profile_photos(uuid[])') is not null,
  'the viewer-scoped Discovery photo RPC exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_eligible_discovery_profile_photos(uuid[])',
    'EXECUTE'
  ),
  'authenticated members can call the Discovery photo RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_eligible_discovery_profile_photos(uuid[])',
    'EXECUTE'
  ),
  'anonymous users cannot call the Discovery photo RPC'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where n.nspname = 'public'
      and p.proname = 'list_eligible_discovery_profile_photos'
      and pg_get_function_identity_arguments(p.oid) = 'p_profile_ids uuid[]'
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot call the Discovery photo RPC'
);

select is(
  (
    select p.proconfig[1]
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'list_eligible_discovery_profile_photos'
      and pg_get_function_identity_arguments(p.oid) = 'p_profile_ids uuid[]'
  ),
  'search_path=pg_catalog, public',
  'the security-definer RPC pins pg_catalog first in its search path'
);

select * from finish();
rollback;
