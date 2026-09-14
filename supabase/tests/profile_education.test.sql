begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(3);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '69696969-6969-4969-8969-696969696969',
  'authenticated', 'authenticated', 'education@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
select set_config('request.jwt.claim.sub', '69696969-6969-4969-8969-696969696969', true);
set local role authenticated;
select lives_ok($$update public.profiles set education='other', education_other='Nursing certification' where id=auth.uid()$$, 'owner can save education description');
select is((select education_other from public.profiles where id=auth.uid()), 'Nursing certification', 'description persists');
select throws_ok($$update public.profiles set education_other=repeat('x',201) where id=auth.uid()$$, '23514', null, 'long description rejected');
reset role;
select * from finish();
rollback;
