-- Keep PostgreSQL system objects ahead of application schemas for every
-- SECURITY DEFINER function, and pin the remaining public-schema functions
-- that previously inherited the caller's mutable search_path.
--
-- Existing access grants are intentionally preserved. Client-facing RPCs
-- remain callable by authenticated members, while the prior grant-hardening
-- migration continues to keep PUBLIC and anon away from privileged functions.

set local search_path = pg_catalog, public;

do $migration$
declare
  function_record record;
  configured_search_path text;
begin
  for function_record in
    select
      p.oid::regprocedure as function_signature,
      p.proconfig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.prosecdef
        or not exists (
          select 1
          from unnest(coalesce(p.proconfig, array[]::text[])) as setting
          where setting like 'search_path=%'
        )
      )
  loop
    select setting
      into configured_search_path
    from unnest(coalesce(function_record.proconfig, array[]::text[])) as setting
    where setting like 'search_path=%'
    limit 1;

    if configured_search_path like '%storage%' then
      execute format(
        'alter function %s set search_path to pg_catalog, public, storage',
        function_record.function_signature
      );
    elsif configured_search_path like '%pg_temp%' then
      execute format(
        'alter function %s set search_path to pg_catalog, public, pg_temp',
        function_record.function_signature
      );
    else
      execute format(
        'alter function %s set search_path to pg_catalog, public',
        function_record.function_signature
      );
    end if;
  end loop;
end
$migration$;
