begin;

select plan(8);

select is(
  (select public from storage.buckets where id = 'profile-photos'),
  false,
  'the profile photo bucket is private'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Profile photos are publicly readable'
  ),
  'the public storage read policy is absent'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Eligible members can read profile photos'
  ),
  'the authenticated owner-or-eligible-viewer policy exists'
);

select is(
  (
    select pg_get_expr(d.adbin, d.adrelid)
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = 'public'
      and c.relname = 'profile_photos'
      and a.attname = 'moderation_status'
  ),
  '''pending''::photo_moderation_status',
  'new profile photos default to pending moderation'
);

select ok(
  to_regprocedure('private.can_read_profile_photo_object(text)') is not null,
  'the private-object authorization helper exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'private.can_read_profile_photo_object(text)',
    'EXECUTE'
  ),
  'authenticated members can invoke the authorization helper'
);

select ok(
  not has_function_privilege(
    'anon',
    'private.can_read_profile_photo_object(text)',
    'EXECUTE'
  ),
  'anonymous users cannot invoke the authorization helper'
);

select is(
  (
    select p.proconfig[1]
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'can_read_profile_photo_object'
      and pg_get_function_identity_arguments(p.oid) = 'p_name text'
  ),
  'search_path=pg_catalog',
  'the security-definer helper pins pg_catalog first in its search path'
);

select * from finish();
rollback;
