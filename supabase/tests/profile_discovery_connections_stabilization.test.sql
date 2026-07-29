begin;

select plan(7);

select has_column(
  'public',
  'profiles',
  'relationship_goals',
  'profiles includes multi-select relationship goals'
);

select col_not_null(
  'public',
  'profiles',
  'relationship_goals',
  'relationship goals are always represented as an array'
);

select has_function(
  'public',
  'load_connection_hub_profiles',
  array['uuid[]'],
  'Connections has a guarded public-profile loader'
);

select function_privs_are(
  'public',
  'load_connection_hub_profiles',
  array['uuid[]'],
  'anon',
  array[]::text[],
  'anonymous callers cannot load Connections profiles'
);

select function_privs_are(
  'public',
  'load_connection_hub_profiles',
  array['uuid[]'],
  'authenticated',
  array['EXECUTE'],
  'signed-in callers may invoke the guarded loader'
);

select ok(
  (select definition like '%relationship_goals%'
   from pg_views
   where schemaname = 'public' and viewname = 'discoverable_profiles'),
  'discoverable profiles exposes relationship goals'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where relationship_goal is not null
      and not (relationship_goals @> array[relationship_goal])
  ),
  0,
  'legacy singular relationship goals were backfilled'
);

select * from finish();
rollback;
