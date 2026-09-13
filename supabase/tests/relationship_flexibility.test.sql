begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(9);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '59595959-5959-4959-8959-595959595959',
  'authenticated', 'authenticated', 'flexible-intentions@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

select set_config('request.jwt.claim.sub', '59595959-5959-4959-8959-595959595959', true);
set local role authenticated;
select lives_ok($$select public.save_my_relationship_preferences('marriage', array['marriage','serious_relationship','serious_relationship'], 'slowly')$$, 'member saves goal, alternatives and pace together');
select is((select relationship_goal from public.profiles where id=auth.uid()), 'marriage', 'primary saved');
select is((select relationship_goals from public.profiles where id=auth.uid()), array['marriage','serious_relationship'], 'deduplicated alternatives saved after primary');
select is((select relationship_pace from public.profiles where id=auth.uid()), 'slowly', 'pace saved independently');
select is((select answer from public.profile_answers where user_id=auth.uid() and question_key='relationship_also_open_to'), '["serious_relationship"]'::jsonb, 'onboarding resume alternatives synchronized');
select throws_ok($$select public.save_my_relationship_preferences('marriage', array['invalid'], 'ready')$$, '22023', null, 'invalid alternatives rejected');
select is((select relationship_pace from public.profiles where id=auth.uid()), 'slowly', 'rejected save leaves previous pace intact');
select lives_ok($$select public.save_my_relationship_preferences('marriage', '{}', null)$$, 'optional preferences can be cleared');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select public.save_my_relationship_preferences('marriage', '{}', null)$$, '42501', null, 'missing identity cannot save');
reset role;
select * from finish();
rollback;
