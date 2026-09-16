begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select no_plan();
create function pg_temp.ended_user(n integer) returns uuid language sql immutable
as $$ select md5('fix013-test-user-' || n)::uuid $$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', pg_temp.ended_user(n),
  'authenticated', 'authenticated', 'fix013-' || n || '@example.invalid',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from generate_series(1, 6) n;

select public.ensure_foundational_user_records(pg_temp.ended_user(n))
from generate_series(1, 6) n;

select set_config('forge.allow_system_writes', 'on', true);
update public.profile_private_details set date_of_birth = date '1990-01-01',
  latitude = 39.7392, longitude = -104.9903
where user_id in (select pg_temp.ended_user(n) from generate_series(1, 6) n);
update public.profile_preferences set gender_identity = 'man', interested_in = array['everyone'],
  preferred_age_min = 18, preferred_age_max = 100, max_distance_miles = 50
where user_id in (select pg_temp.ended_user(n) from generate_series(1, 6) n);
update public.profiles set status = 'active', is_discoverable = true, full_name = 'Test Member'
where id in (select pg_temp.ended_user(n) from generate_series(1, 6) n);

create temporary table pairs as
select n, public.forge_ensure_connection(pg_temp.ended_user(n),pg_temp.ended_user(n+1),'open_to_chat') id
from (values(1),(3),(5)) v(n);
grant select on pairs to authenticated;
select set_config('request.jwt.claim.sub',pg_temp.ended_user(1)::text,true);
select public.ensure_conversation_for_connection((select id from pairs where n=1));
select set_config('request.jwt.claim.sub',pg_temp.ended_user(3)::text,true);
select public.ensure_conversation_for_connection((select id from pairs where n=3));
select set_config('request.jwt.claim.sub',pg_temp.ended_user(5)::text,true);
select public.ensure_conversation_for_connection((select id from pairs where n=5));
insert into public.messages(conversation_id,sender_id,body)
select c.id,pg_temp.ended_user(1),'Retain this history' from public.conversations c where c.connection_id=(select id from pairs where n=1);
insert into public.open_to_chat_requests(sender_id,recipient_id,status)
values(pg_temp.ended_user(1),pg_temp.ended_user(2),'pending');
select set_config('request.jwt.claim.sub',pg_temp.ended_user(1)::text,true);
set local role authenticated;
select is(public.end_connection((select id from pairs where n=1))->>'ok','true','either participant can end');
select is(public.end_connection((select id from pairs where n=1))->>'ok','true','ending is idempotent');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.ended_user(1)::text,true);
set local role authenticated;
select is((select count(*)::integer from public.list_eligible_discovery_profiles(100) where id=pg_temp.ended_user(2)),0,'ended peer excluded bilaterally');
select is((select count(*)::integer from public.get_eligible_discovery_profile(pg_temp.ended_user(2))),1,'authorized retained profile remains readable');
select is(public.send_interest(pg_temp.ended_user(2))->>'ok','false','interest denied after end');
select is(public.send_open_to_chat(pg_temp.ended_user(2))->>'ok','false','chat request denied after end');
select is(public.save_profile_for_later(pg_temp.ended_user(2))->>'ok','false','save denied after end');
select is(public.pass_on_profile(pg_temp.ended_user(2))->>'ok','false','pass cannot change ended state');
select is(public.ensure_conversation_for_connection((select id from pairs where n=1))->>'ok','false','direct start denied');
select throws_ok($$insert into public.saved_profiles(saver_id,saved_id) values(pg_temp.ended_user(1),pg_temp.ended_user(2))$$,'P0001','This connection has ended.','direct saved-table write denied');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.ended_user(2)::text,true);
set local role authenticated;
select is((select count(*)::integer from public.list_eligible_discovery_profiles(100) where id=pg_temp.ended_user(1)),0,'ended peer excluded bilaterally');
select is((select count(*)::integer from public.get_eligible_discovery_profile(pg_temp.ended_user(1))),1,'authorized retained profile remains readable');
select is(public.send_interest(pg_temp.ended_user(1))->>'ok','false','interest denied after end');
select is(public.send_open_to_chat(pg_temp.ended_user(1))->>'ok','false','chat request denied after end');
select is(public.save_profile_for_later(pg_temp.ended_user(1))->>'ok','false','save denied after end');
select is(public.pass_on_profile(pg_temp.ended_user(1))->>'ok','false','pass cannot change ended state');
select is(public.ensure_conversation_for_connection((select id from pairs where n=1))->>'ok','false','direct start denied');
select throws_ok($$insert into public.saved_profiles(saver_id,saved_id) values(pg_temp.ended_user(2),pg_temp.ended_user(1))$$,'P0001','This connection has ended.','direct saved-table write denied');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.ended_user(4)::text,true);
set local role authenticated;
select is(public.end_connection((select id from pairs where n=3))->>'ok','true','either participant can end');
select is(public.end_connection((select id from pairs where n=3))->>'ok','true','ending is idempotent');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.ended_user(4)::text,true);
set local role authenticated;
select is((select count(*)::integer from public.list_eligible_discovery_profiles(100) where id=pg_temp.ended_user(3)),0,'ended peer excluded bilaterally');
select is((select count(*)::integer from public.get_eligible_discovery_profile(pg_temp.ended_user(3))),1,'authorized retained profile remains readable');
select is(public.send_interest(pg_temp.ended_user(3))->>'ok','false','interest denied after end');
select is(public.send_open_to_chat(pg_temp.ended_user(3))->>'ok','false','chat request denied after end');
select is(public.save_profile_for_later(pg_temp.ended_user(3))->>'ok','false','save denied after end');
select is(public.pass_on_profile(pg_temp.ended_user(3))->>'ok','false','pass cannot change ended state');
select is(public.ensure_conversation_for_connection((select id from pairs where n=3))->>'ok','false','direct start denied');
select throws_ok($$insert into public.saved_profiles(saver_id,saved_id) values(pg_temp.ended_user(4),pg_temp.ended_user(3))$$,'P0001','This connection has ended.','direct saved-table write denied');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.ended_user(3)::text,true);
set local role authenticated;
select is((select count(*)::integer from public.list_eligible_discovery_profiles(100) where id=pg_temp.ended_user(4)),0,'ended peer excluded bilaterally');
select is((select count(*)::integer from public.get_eligible_discovery_profile(pg_temp.ended_user(4))),1,'authorized retained profile remains readable');
select is(public.send_interest(pg_temp.ended_user(4))->>'ok','false','interest denied after end');
select is(public.send_open_to_chat(pg_temp.ended_user(4))->>'ok','false','chat request denied after end');
select is(public.save_profile_for_later(pg_temp.ended_user(4))->>'ok','false','save denied after end');
select is(public.pass_on_profile(pg_temp.ended_user(4))->>'ok','false','pass cannot change ended state');
select is(public.ensure_conversation_for_connection((select id from pairs where n=3))->>'ok','false','direct start denied');
select throws_ok($$insert into public.saved_profiles(saver_id,saved_id) values(pg_temp.ended_user(3),pg_temp.ended_user(4))$$,'P0001','This connection has ended.','direct saved-table write denied');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.ended_user(2)::text,true);
set local role authenticated;
select is(public.respond_open_to_chat((select id from public.open_to_chat_requests where sender_id=pg_temp.ended_user(1) and recipient_id=pg_temp.ended_user(2)),'accept')->>'ok','false','stale pending acceptance cannot reopen');
select is(public.block_user(pg_temp.ended_user(1))->>'ok','true','block remains available');
select is(public.unblock_user(pg_temp.ended_user(1))->>'messaging_reopened','false','unblock cannot reverse explicit end');
reset role;
select is((select status::text from public.connections where id=(select id from pairs where n=1)),'ended','explicit end persists');
select is((select count(*)::integer from public.messages where body='Retain this history'),1,'ending retains messages');
select throws_ok($$select public.forge_ensure_connection(pg_temp.ended_user(1),pg_temp.ended_user(2),'open_to_chat')$$,'P0001','This connection has ended.','internal helper also refuses resurrection');
select throws_ok($$update public.connections set status='active' where id=(select id from pairs where n=1)$$,'P0001','This connection has ended.','durable marker guards other lifecycle paths');
select set_config('request.jwt.claim.sub',pg_temp.ended_user(5)::text,true);
set local role authenticated;
select is(public.block_user(pg_temp.ended_user(6))->>'ok','true','active pair can block');
select is(public.unblock_user(pg_temp.ended_user(6))->>'messaging_reopened','true','block-only unblock behavior preserved');
select throws_ok($$select public.forge_pair_has_ended(pg_temp.ended_user(1),pg_temp.ended_user(2))$$,'42501','permission denied for function forge_pair_has_ended','internal pair helper cannot enumerate relationships');
reset role;
select * from finish();
rollback;
