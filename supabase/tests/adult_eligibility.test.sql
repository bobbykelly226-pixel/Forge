-- pgTAP contract tests for adult eligibility and derived public age.
-- Run with: supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;

select plan(12);

select is(
  public.forge_profile_age(date '2000-02-29', date '2025-02-28'),
  25,
  'February 29 birthdays advance on February 28 in non-leap years'
);

select ok(
  public.forge_is_adult_date_of_birth(date '2007-08-14', date '2025-08-14'),
  'the exact eighteenth birthday is eligible'
);

select ok(
  not public.forge_is_adult_date_of_birth(date '2007-08-15', date '2025-08-14'),
  'one day before the eighteenth birthday is ineligible'
);

select ok(
  not public.forge_is_adult_date_of_birth(date '1900-01-01', date '2025-08-14'),
  'implausible dates older than 120 years are rejected'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '14141414-1414-4414-8414-141414141414',
  'authenticated',
  'authenticated',
  'adult-eligibility-test@example.com',
  crypt('test-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

select throws_ok(
  $$
    update public.profile_private_details
    set date_of_birth = current_date - interval '17 years'
    where user_id = '14141414-1414-4414-8414-141414141414'
  $$,
  '23514',
  'profile_private_details: date_of_birth must belong to an adult age 18 through 120',
  'the database rejects an under-18 DOB even when the UI is bypassed'
);

update public.profiles
set age = 35, is_discoverable = true, status = 'active'
where id = '14141414-1414-4414-8414-141414141414';

select is(
  (select age from public.profiles where id = '14141414-1414-4414-8414-141414141414'),
  null::integer,
  'a manually supplied public age is erased when private DOB is missing'
);

select is(
  (select is_discoverable from public.profiles where id = '14141414-1414-4414-8414-141414141414'),
  false,
  'a profile without DOB cannot be made discoverable directly'
);

select ok(
  not public.can_activate_discovery_visibility('14141414-1414-4414-8414-141414141414'),
  'the discovery activation gate rejects missing DOB'
);

update public.profile_private_details
set date_of_birth = date '1990-08-14', latitude = 39.7392, longitude = -104.9903
where user_id = '14141414-1414-4414-8414-141414141414';

update public.profile_preferences
set gender_identity = 'woman', interested_in = array['everyone'],
    preferred_age_min = 18, preferred_age_max = 100, max_distance_miles = 50
where user_id = '14141414-1414-4414-8414-141414141414';

select is(
  (select age from public.profiles where id = '14141414-1414-4414-8414-141414141414'),
  public.forge_profile_age(date '1990-08-14', current_date),
  'saving private DOB synchronizes derived public age'
);

update public.profiles
set is_discoverable = true, status = 'active'
where id = '14141414-1414-4414-8414-141414141414';

select ok(
  public.can_activate_discovery_visibility('14141414-1414-4414-8414-141414141414'),
  'a valid adult DOB satisfies the discovery activation gate'
);

select is(
  (
    select age
    from public.discoverable_profiles
    where id = '14141414-1414-4414-8414-141414141414'
  ),
  public.forge_profile_age(date '1990-08-14', current_date),
  'Discovery exposes only the derived current age'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'discoverable_profiles'
      and column_name = 'date_of_birth'
  ),
  'Discovery never exposes full date of birth'
);

select * from finish();
rollback;
