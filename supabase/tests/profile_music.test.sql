begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select plan(5);
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '69696969-6969-4969-8969-696969696969',
  'authenticated', 'authenticated', 'music@example.com', crypt('test-password', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
select set_config('request.jwt.claim.sub', '69696969-6969-4969-8969-696969696969', true);
set local role authenticated;
select lives_ok($$update public.profiles set favorite_music_genres=array['Country','Rock'], favorite_music_other=null, favorite_music_meaningful_song='My song' where id=auth.uid()$$, 'owner can save music');
select is((select favorite_music_genres from public.profiles where id=auth.uid()), array['Country','Rock'], 'genres persist');
select is((select favorite_music_meaningful_song from public.profiles where id=auth.uid()), 'My song', 'song persists');
select throws_ok($$update public.profiles set favorite_music_genres=array['Country','Rock','Pop','Jazz','Blues','Metal','Punk'] where id=auth.uid()$$, '23514', null, 'seventh genre rejected');
select throws_ok($$update public.profiles set favorite_music_genres=array['Unknown'] where id=auth.uid()$$, '23514', null, 'unknown genre rejected');
reset role;
select * from finish();
rollback;
