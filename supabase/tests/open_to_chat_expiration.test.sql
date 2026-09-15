begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(7);

select col_has_default(
  'public',
  'open_to_chat_requests',
  'expires_at',
  'Open to Chat expiration has a database default'
);

select ok(
  not exists (
    select 1
    from public.open_to_chat_requests
    where status in ('pending', 'deferred')
      and expires_at is null
  ),
  'every active Open to Chat request has an expiration'
);

select ok(
  not exists (
    select 1
    from public.open_to_chat_requests
    where status in ('pending', 'deferred')
      and expires_at <= now()
  ),
  'already stale active requests are closed during migration'
);

select ok(
  pg_get_functiondef('public.protect_open_to_chat_system_columns()'::regprocedure)
    like '%new.expires_at := now() + interval ''7 days''%',
  'direct inserts receive the same seven-day window'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%expires_at = excluded.expires_at%',
  'reactivated requests receive a fresh expiration'
);

select ok(
  pg_get_functiondef('public.respond_open_to_chat(uuid,text)'::regprocedure)
    like '%This request has expired.%',
  'response function rejects stale requests'
);

select function_privs_are(
  'public',
  'respond_open_to_chat',
  array['uuid', 'text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated recipients retain response access'
);

select * from finish();
rollback;
