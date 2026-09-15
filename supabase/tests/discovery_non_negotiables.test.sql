-- pgTAP contract tests for reciprocal identity, age, and distance eligibility.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '15151515-1515-4515-8515-151515151515',
   'authenticated', 'authenticated', 'matching-viewer@example.com', crypt('test-password', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '16161616-1616-4616-8616-161616161616',
   'authenticated', 'authenticated', 'matching-candidate@example.com', crypt('test-password', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

update public.profile_private_details
set date_of_birth = case when user_id = '15151515-1515-4515-8515-151515151515'
      then current_date - interval '35 years' else current_date - interval '33 years' end,
    latitude = case when user_id = '15151515-1515-4515-8515-151515151515' then 39.7392 else 39.7500 end,
    longitude = case when user_id = '15151515-1515-4515-8515-151515151515' then -104.9903 else -104.9800 end
where user_id in ('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616');

update public.profile_preferences
set gender_identity = case when user_id = '15151515-1515-4515-8515-151515151515' then 'woman' else 'man' end,
    interested_in = case when user_id = '15151515-1515-4515-8515-151515151515' then array['man'] else array['woman'] end,
    preferred_age_min = 30, preferred_age_max = 40, max_distance_miles = 25
where user_id in ('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616');


select ok(public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'all off preserves eligibility with unknown answers');
update public.profile_preferences set non_negotiables='{"smokeFree":true,"faith":[],"children":[]}' where user_id='15151515-1515-4515-8515-151515151515';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'unknown smoking fails enabled requirement');
update public.profiles set smoking='never' where id='16161616-1616-4616-8616-161616161616';
select ok(public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'smoke-free answer satisfies requirement');
update public.profile_preferences set non_negotiables='{"smokeFree":false,"faith":["catholic"],"children":["yes","open"]}' where user_id='16161616-1616-4616-8616-161616161616';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'candidate requirements apply reciprocally');
update public.profiles set faith_identity='catholic', children='open' where id='15151515-1515-4515-8515-151515151515';
select ok(public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'accepted faith and future children restore reciprocal eligibility');
update public.profiles set children='prefer_not_to_say' where id='15151515-1515-4515-8515-151515151515';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'private answer does not satisfy enabled requirement');
update public.profile_preferences set non_negotiables='{"smokeFree":false,"faith":[],"children":[]}' where user_id='16161616-1616-4616-8616-161616161616';
select ok(public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616'), 'turning requirement off restores eligibility');
select ok(not public.forge_valid_non_negotiables('{"smokeFree":false,"faith":["invalid"],"children":[]}'), 'invalid identities rejected');
select ok(not public.forge_valid_non_negotiables('{"smokeFree":"true","faith":[],"children":[]}'), 'invalid toggle type rejected');
select function_privs_are('public','forge_meets_non_negotiables',array['jsonb','text','text','text'],'anon',array[]::text[],'anonymous comparison RPC unavailable');

-- Discovery excludes mismatches; existing active connections keep profile access.
update public.profiles set status='active', is_discoverable=true where id='16161616-1616-4616-8616-161616161616';
update public.profiles set smoking='regularly' where id='16161616-1616-4616-8616-161616161616';
select set_config('request.jwt.claim.sub','15151515-1515-4515-8515-151515151515',true);
set local role authenticated;
select is((select count(*)::integer from public.get_eligible_discovery_profile('16161616-1616-4616-8616-161616161616')),0,'unconnected mismatch is not accessible through Discovery');
select is((with changed as (
update public.profile_preferences set non_negotiables='{"smokeFree":false,"faith":[],"children":[]}' where user_id='16161616-1616-4616-8616-161616161616' returning user_id
) select count(*)::integer from changed),0,'member cannot change another member requirements');
select lives_ok($$update public.profile_preferences set non_negotiables='{"smokeFree":true,"faith":[],"children":[]}' where user_id='15151515-1515-4515-8515-151515151515'$$,'member may save their own requirements');
reset role;
insert into public.connections(user_a_id,user_b_id,source,status) values('15151515-1515-4515-8515-151515151515','16161616-1616-4616-8616-161616161616','mutual_interest','active');
set local role authenticated;
select is((select count(*)::integer from public.get_eligible_discovery_profile('16161616-1616-4616-8616-161616161616')),1,'active connection can still open profile despite non-negotiable mismatch');
reset role;
select * from finish();

rollback;
