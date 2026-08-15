begin;

select plan(6);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  0,
  'anonymous users cannot execute public SECURITY DEFINER functions'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and exists (
        select 1
        from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
        where acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
  ),
  0,
  'PUBLIC cannot execute public SECURITY DEFINER functions'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as setting
        where setting like 'search_path=pg_catalog,%'
          or setting = 'search_path=pg_catalog'
      )
  ),
  0,
  'every public SECURITY DEFINER function puts pg_catalog first'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as setting
        where setting like 'search_path=%'
      )
  ),
  0,
  'every public-schema function has an explicit search_path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_eligible_discovery_profiles(integer)',
    'EXECUTE'
  ),
  'authenticated members retain the Discovery RPC they need'
);

select ok(
  (
    select 'storage' = any(
      string_to_array(
        replace(setting, 'search_path=', ''),
        ', '
      )
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(p.proconfig) as setting
    where n.nspname = 'public'
      and p.proname = 'report_user'
      and setting like 'search_path=%'
  ),
  'the reporting RPC retains access to the storage schema'
);

select * from finish();
rollback;
