begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(11);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '69696969-6969-4969-8969-696969696969',
  'authenticated', 'authenticated', 'multi-intentions@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
select set_config('request.jwt.claim.sub', '69696969-6969-4969-8969-696969696969', true);
set local role authenticated;
select public.save_my_relationship_preferences('marriage', array['serious_relationship'], 'slowly');
select lives_ok($$select public.save_my_relationship_goals(array['getting_to_know_someone','marriage','intentional_dating','lifelong_partnership','serious_relationship','marriage'])$$, 'all five choices save and duplicate input is normalized');
select is((select relationship_goals from public.profiles where id=auth.uid()), array['marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone'], 'all five stored in catalog order without ranking');
select is((select answer from public.profile_answers where user_id=auth.uid() and question_key='relationship_intention'), '["marriage","lifelong_partnership","serious_relationship","intentional_dating","getting_to_know_someone"]'::jsonb, 'onboarding resumes entire selection');
select is((select count(*) from public.profile_answers where user_id=auth.uid() and question_key='relationship_also_open_to'), 0::bigint, 'superseded alternatives do not reappear');
select is((select relationship_pace from public.profiles where id=auth.uid()), 'slowly', 'prior pace is retained rather than destructively rewritten');
select throws_ok($$select public.save_my_relationship_goals('{}')$$, '22023', null, 'empty selection rejected');
select throws_ok($$select public.save_my_relationship_goals(array['invalid'])$$, '22023', null, 'unknown selection rejected');
select lives_ok($$select public.save_my_relationship_goals(array['intentional_dating'])$$, 'member can change back to dating with intention');
select is((select relationship_goals from public.profiles where id=auth.uid()), array['intentional_dating'], 'deselected choices stay removed');
select set_config('request.jwt.claim.sub', '79797979-7979-4979-8979-797979797979', true);
select throws_ok($$select public.save_my_relationship_goals(array['marriage'])$$, '42501', null, 'another identity cannot edit the existing member');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select public.save_my_relationship_goals(array['marriage'])$$, '42501', null, 'missing identity rejected');
reset role;
select * from finish();
rollback;
