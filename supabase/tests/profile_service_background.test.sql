begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(3);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '69696969-6969-4969-8969-696969696969',
  'authenticated', 'authenticated', 'service@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
select set_config('request.jwt.claim.sub', '69696969-6969-4969-8969-696969696969', true);
set local role authenticated;
select lives_ok($$update public.profiles set service_backgrounds=array['healthcare','other'], service_background_other='HVAC technician' where id=auth.uid()$$, 'owner can save service description');
select is((select service_background_other from public.profiles where id=auth.uid()), 'HVAC technician', 'description persists');
select throws_ok($$update public.profiles set service_background_other=repeat('x',201) where id=auth.uid()$$, '23514', null, 'long description rejected');
reset role;
select * from finish();
rollback;
