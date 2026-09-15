begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select no_plan();

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
      like '%v_third_newest_send + interval ''24 hours''%',
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

-- Exercise the real RPCs and privileges on disposable fixture members.
-- This entire suite runs inside a transaction and rolls back its data.
create function pg_temp.otc_user(n integer) returns uuid language sql immutable
as $$ select md5('fix011-test-user-' || n)::uuid $$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', pg_temp.otc_user(n),
  'authenticated', 'authenticated', 'fix011-' || n || '@example.invalid',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from generate_series(1, 8) n;

select public.ensure_foundational_user_records(pg_temp.otc_user(n))
from generate_series(1, 8) n;

select set_config('forge.allow_system_writes', 'on', true);
update public.profile_private_details set date_of_birth = date '1990-01-01',
  latitude = 39.7392, longitude = -104.9903
where user_id in (select pg_temp.otc_user(n) from generate_series(1, 8) n);
update public.profile_preferences set gender_identity = 'man', interested_in = array['everyone'],
  preferred_age_min = 18, preferred_age_max = 100, max_distance_miles = 50
where user_id in (select pg_temp.otc_user(n) from generate_series(1, 8) n);
update public.profiles set status = 'active', is_discoverable = true, full_name = 'Test Member'
where id in (select pg_temp.otc_user(n) from generate_series(1, 8) n);
select is((select count(*)::integer from public.discoverable_profiles
  where id in (select pg_temp.otc_user(n) from generate_series(1, 8) n)),
  8, 'fixture members satisfy the real Discovery eligibility rules');

create temporary table otc_results (label text primary key, result jsonb not null);
grant select, insert on otc_results to authenticated;

select throws_ok($$select public.get_open_to_chat_allowance()$$,
  'P0001', 'Authentication required', 'allowance requires a member identity');
select throws_ok($$select public.send_open_to_chat(pg_temp.otc_user(2))$$,
  'P0001', 'Authentication required', 'send requires a member identity');

set local role anon;
select throws_ok($$select public.get_open_to_chat_allowance()$$,
  '42501', 'permission denied for function get_open_to_chat_allowance',
  'anonymous callers cannot execute allowance');
select throws_ok($$select public.send_open_to_chat(pg_temp.otc_user(2))$$,
  '42501', 'permission denied for function send_open_to_chat',
  'anonymous callers cannot execute send');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.otc_user(1)::text, true);
set local role authenticated;
select is(public.count_open_to_chat_sent_today(), 0, 'new sender has no successful sends');
select is(public.get_open_to_chat_allowance()->>'remaining', '3', 'new sender has three slots');
select is(public.send_open_to_chat(pg_temp.otc_user(1))->>'ok', 'false', 'self send is denied');
select is(public.send_open_to_chat(pg_temp.otc_user(2), repeat('x', 201))->>'ok',
  'false', 'overlong note is denied');
select is(public.count_open_to_chat_sent_today(), 0, 'failed validation consumes no slots');

insert into otc_results values ('first', public.send_open_to_chat(pg_temp.otc_user(2), 'Hello'));
select is((select result->>'ok' from otc_results where label = 'first'), 'true', 'first send succeeds');
select is((select result->>'remaining' from otc_results where label = 'first'), '2', 'success returns remaining slots');
select is((select expires_at - created_at from public.open_to_chat_requests
  where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2)),
  interval '7 days', 'expiration uses actual successful send time');
select ok((select created_at > transaction_timestamp() from public.open_to_chat_requests
  where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2)),
  'send timestamps are captured after acquiring the lock');

select throws_ok($$insert into public.open_to_chat_requests (sender_id, recipient_id)
  values (pg_temp.otc_user(1), pg_temp.otc_user(3))$$,
  '42501', 'permission denied for table open_to_chat_requests', 'direct INSERT cannot bypass limits');
select throws_ok($$update public.open_to_chat_requests set created_at = now() - interval '8 days'$$,
  '42501', 'permission denied for table open_to_chat_requests', 'direct UPDATE cannot erase send history');
select throws_ok($$delete from public.open_to_chat_requests$$,
  '42501', 'permission denied for table open_to_chat_requests', 'direct DELETE cannot restore slots');

select is(public.send_open_to_chat(pg_temp.otc_user(3))->>'reason', 'send_cooldown',
  'another recipient is blocked during the 60-second cooldown');
select is(public.count_open_to_chat_sent_today(), 1, 'cooldown failures consume no slots');
insert into otc_results values ('pending-repeat', public.send_open_to_chat(pg_temp.otc_user(2)));
select is((select result->>'reason' from otc_results where label = 'pending-repeat'),
  'recipient_cooldown', 'recent pending requests use the recipient cooldown response');

reset role;
update public.open_to_chat_requests set status = 'deferred' where sender_id = pg_temp.otc_user(1);
set local role authenticated;
select is(public.send_open_to_chat(pg_temp.otc_user(2)),
  (select result from otc_results where label = 'pending-repeat'),
  'deferred repeat response is identical to pending');
reset role;
update public.open_to_chat_requests set status = 'declined' where sender_id = pg_temp.otc_user(1);
set local role authenticated;
select is(public.send_open_to_chat(pg_temp.otc_user(2)),
  (select result from otc_results where label = 'pending-repeat'),
  'private decline does not change the repeat-send response or retry timestamp');

reset role;
update public.open_to_chat_requests set created_at = now() - interval '60 seconds'
where sender_id = pg_temp.otc_user(1);
set local role authenticated;
select is(public.send_open_to_chat(pg_temp.otc_user(3))->>'ok', 'true',
  'a second send is allowed after the 60-second boundary');
reset role;
update public.open_to_chat_requests set created_at = now() - interval '2 minutes'
where sender_id = pg_temp.otc_user(1);
set local role authenticated;
insert into otc_results values ('third', public.send_open_to_chat(pg_temp.otc_user(4)));
select is((select result->>'remaining' from otc_results where label = 'third'), '0',
  'the third successful send uses the final slot');
select is(public.send_open_to_chat(pg_temp.otc_user(5))->>'reason', 'daily_limit',
  'an immediate fourth send reports the quota instead of suggesting a one-minute retry');
reset role;
update public.open_to_chat_requests set created_at = now() - interval '2 minutes'
where sender_id = pg_temp.otc_user(1);
set local role authenticated;
select is(public.send_open_to_chat(pg_temp.otc_user(5))->>'reason', 'daily_limit',
  'fourth send in rolling 24 hours is denied');
select is(public.count_open_to_chat_sent_today(), 3, 'declined requests still count as successful sends');
select throws_ok($$select public.count_open_to_chat_sent_today(pg_temp.otc_user(2))$$,
  'P0001', 'Not authorized', 'members cannot inspect another member allowance');
reset role;
select is((select count(*)::integer from public.notifications where actor_user_id = pg_temp.otc_user(1)
  and notification_type = 'open_to_chat_received'), 3, 'only successful sends generate notifications');

-- Requests exactly 24 hours old have left the rolling window.
update public.open_to_chat_requests set created_at = now() - interval '24 hours'
where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2);
set local role authenticated;
select is(public.count_open_to_chat_sent_today(), 2, 'the exact 24-hour boundary is excluded');
select is(public.send_open_to_chat(pg_temp.otc_user(5))->>'ok', 'true', 'an expired slot can be used');
reset role;

-- Simulate four legacy sends before the cap was activated. The third-newest
-- timestamp determines when there will be fewer than three in the window.
update public.open_to_chat_requests r set created_at = now() - n * interval '1 hour'
from generate_series(2, 5) n
where r.sender_id = pg_temp.otc_user(1) and r.recipient_id = pg_temp.otc_user(n);
set local role authenticated;
select is(public.get_open_to_chat_allowance()->>'remaining', '0', 'legacy excess sends never yield negative slots');
select is((public.get_open_to_chat_allowance()->>'next_available_at')::timestamptz,
  now() + interval '20 hours', 'legacy excess allowance uses third-newest send');
select is((public.send_open_to_chat(pg_temp.otc_user(6))->>'retry_at')::timestamptz,
  now() + interval '20 hours', 'send denial agrees with allowance on legacy excess sends');
reset role;

-- Resending is possible only after seven days, with a fresh allowance/expiry.
update public.open_to_chat_requests set created_at = now() - interval '24 hours' + interval '30 seconds'
where sender_id = pg_temp.otc_user(1);
update public.open_to_chat_requests set created_at = now()
where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2);
set local role authenticated;
select is((public.get_open_to_chat_allowance()->>'next_available_at')::timestamptz,
  now() + interval '60 seconds', 'allowance also respects cooldown when the quota clears sooner');
select is((public.send_open_to_chat(pg_temp.otc_user(6))->>'retry_at')::timestamptz,
  now() + interval '60 seconds', 'retry time respects both quota and cooldown');
reset role;

update public.open_to_chat_requests set created_at = now() - interval '8 days',
  expires_at = now() - interval '1 day'
where sender_id = pg_temp.otc_user(1);
update public.open_to_chat_requests set status = 'accepted'
where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(3);
update public.open_to_chat_requests set created_at = now() - interval '7 days'
where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2);
set local role authenticated;
select is(public.send_open_to_chat(pg_temp.otc_user(3))->>'reason', 'existing_request',
  'an accepted request is never resent even after seven days');
select is(public.send_open_to_chat(pg_temp.otc_user(2))->>'ok', 'true',
  'a declined request can be resent at the seven-day boundary');
select is(public.count_open_to_chat_sent_today(), 1, 'reactivated request consumes one fresh slot');
select is((select expires_at - created_at from public.open_to_chat_requests
  where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2)),
  interval '7 days', 'reactivated request receives a fresh seven-day expiry');
reset role;
select is((select count(*)::integer from public.notifications where actor_user_id = pg_temp.otc_user(1)
  and recipient_user_id = pg_temp.otc_user(2) and notification_type = 'open_to_chat_received'),
  1, 'resend reactivates the notification without duplicates');

select set_config('request.jwt.claim.sub', pg_temp.otc_user(2)::text, true);
set local role authenticated;
select is(public.respond_open_to_chat((select id from public.open_to_chat_requests
  where sender_id = pg_temp.otc_user(1) and recipient_id = pg_temp.otc_user(2)), 'accept')->>'ok',
  'true', 'recipient response RPC still works after direct table writes are revoked');
reset role;

select * from finish();
rollback;
