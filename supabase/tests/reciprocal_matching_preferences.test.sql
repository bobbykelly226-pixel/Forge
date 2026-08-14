-- pgTAP contract tests for reciprocal identity, age, and distance eligibility.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(10);

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

select ok(public.forge_matching_preferences_complete('15151515-1515-4515-8515-151515151515'),
  'complete identity, age, distance, and coordinates satisfy the preference contract');
select ok(public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616'),
  'mutually compatible members match');
select ok(public.forge_profiles_match_preferences('16161616-1616-4616-8616-161616161616', '15151515-1515-4515-8515-151515151515'),
  'reciprocal evaluation is symmetric');

select throws_ok(
  $$
    update public.profile_preferences set gender_identity = 'nonbinary'
    where user_id = '16161616-1616-4616-8616-161616161616'
  $$,
  null,
  null,
  'the database rejects an unsupported sex value'
);

select throws_ok(
  $$
    update public.profile_preferences set interested_in = array['man', 'woman']
    where user_id = '16161616-1616-4616-8616-161616161616'
  $$,
  null,
  null,
  'the database rejects more than one interest choice'
);

update public.profile_preferences set interested_in = array['man']
where user_id = '16161616-1616-4616-8616-161616161616';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616'),
  'a one-way sex preference mismatch is excluded');

update public.profile_preferences set interested_in = array['woman'], preferred_age_max = 34
where user_id = '16161616-1616-4616-8616-161616161616';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616'),
  'a reciprocal age-range mismatch is excluded');

update public.profile_preferences set preferred_age_max = 40, max_distance_miles = 5
where user_id = '16161616-1616-4616-8616-161616161616';
update public.profile_private_details set latitude = 40.7500, longitude = -104.9800
where user_id = '16161616-1616-4616-8616-161616161616';
select ok(not public.forge_profiles_match_preferences('15151515-1515-4515-8515-151515151515', '16161616-1616-4616-8616-161616161616'),
  'members outside either distance limit are excluded');

update public.profile_private_details set latitude = null, longitude = null
where user_id = '16161616-1616-4616-8616-161616161616';
select ok(not public.forge_matching_preferences_complete('16161616-1616-4616-8616-161616161616'),
  'missing private coordinates fail closed');

update public.profiles set is_discoverable = true
where id = '16161616-1616-4616-8616-161616161616';
select is((select is_discoverable from public.profiles where id = '16161616-1616-4616-8616-161616161616'), false,
  'direct database activation cannot bypass incomplete matching eligibility');

select * from finish();
rollback;
