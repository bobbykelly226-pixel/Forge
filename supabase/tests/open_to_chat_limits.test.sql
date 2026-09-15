begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(11);

select has_index(
  'public',
  'open_to_chat_requests',
  'open_to_chat_sender_created_at_idx',
  'rolling-window queries have a sender/time index'
);

select ok(
  pg_get_functiondef('public.count_open_to_chat_sent_today(uuid)'::regprocedure)
    like '%created_at > now() - interval ''24 hours''%',
  'the count helper uses a rolling 24-hour window'
);

select ok(
  pg_get_functiondef('public.count_open_to_chat_sent_today(uuid)'::regprocedure)
    like '%p_user_id <> v_uid%',
  'a member cannot inspect another member count'
);

select ok(
  pg_get_functiondef('public.get_open_to_chat_allowance()'::regprocedure)
    like '%''remaining'', greatest(0, 3 - v_count)%'
    and pg_get_functiondef('public.get_open_to_chat_allowance()'::regprocedure)
      like '%v_oldest_window_send + interval ''24 hours''%',
  'members can retrieve their remaining allowance and next availability'
);

select function_privs_are(
  'public',
  'get_open_to_chat_allowance',
  array[]::text[],
  'authenticated',
  array['EXECUTE'],
  'only authenticated members can retrieve an allowance'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%pg_advisory_xact_lock%',
  'parallel sends are serialized per sender'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%v_daily_count >= 3%',
  'Founding Beta and free members are limited to three sends'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%v_recipient_last_sent_at > v_now - interval ''7 days''%',
  'the same recipient can be contacted once every seven days'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%v_last_sent_at > v_now - interval ''60 seconds''%',
  'successful sends have a one-minute anti-burst interval'
);

select ok(
  pg_get_functiondef('public.send_open_to_chat(uuid,text)'::regprocedure)
    like '%''premium_daily_limit'', 5%',
  'the approved future Premium ceiling is recorded without activating billing'
);

select function_privs_are(
  'public',
  'send_open_to_chat',
  array['uuid', 'text'],
  'authenticated',
  array['EXECUTE'],
  'only authenticated members can call the send function'
);

select * from finish();
rollback;
