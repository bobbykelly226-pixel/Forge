begin;

select plan(14);

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

select ok(
  to_regprocedure('private.can_access_own_conversation_history(uuid)') is not null,
  'the private current-user conversation authorization helper exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'private.can_access_own_conversation_history(uuid)',
    'EXECUTE'
  ),
  'authenticated members can invoke the private policy helper'
);

select ok(
  not has_function_privilege(
    'anon',
    'private.can_access_own_conversation_history(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot invoke the private policy helper'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.forge_can_access_conversation_history(uuid,uuid)',
    'EXECUTE'
  ),
  'the parameterized public conversation helper remains unavailable to members'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where coalesce(qual, '') like '%forge_can_access_conversation_history%'
       or coalesce(with_check, '') like '%forge_can_access_conversation_history%'
  ),
  'RLS policies no longer call the revoked parameterized public helper'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authorized participants read conversation history attachments'
      and qual like '%private.can_access_own_conversation_history%'
  ),
  'conversation attachment reads use the private current-user helper'
);

select * from finish();
rollback;
