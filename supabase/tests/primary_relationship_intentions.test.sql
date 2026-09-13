begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(8);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '49494949-4949-4949-8949-494949494949',
  'authenticated', 'authenticated', 'intentions-contract@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
select lives_ok(format('update public.profiles set relationship_goal = %L, relationship_goals = array[%L] where id = %L',
  goal, goal, '49494949-4949-4949-8949-494949494949'), 'accepts ' || goal)
from unnest(array['marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone']) goal;
select throws_ok($$update public.profiles set relationship_goals = array['invalid'] where id = '49494949-4949-4949-8949-494949494949'$$,
  '23514', null, 'rejects unsupported goal');
select lives_ok($$update public.profiles set relationship_goal = 'marriage', relationship_goals = array['marriage','serious_relationship'] where id = '49494949-4949-4949-8949-494949494949'$$,
  'legacy arrays remain valid without data loss');
select is((select relationship_goal from public.profiles where id = '49494949-4949-4949-8949-494949494949'), 'marriage', 'primary remains intact');
select * from finish();
rollback;
