begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;

select plan(24);

select has_table('public', 'legal_document_versions', 'legal document versions are stored');
select has_table('public', 'member_legal_acceptances', 'member acceptance history is stored');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.legal_document_versions'::regclass),
  'legal document versions have RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.member_legal_acceptances'::regclass),
  'member acceptance history has RLS enabled'
);

select is(
  (select count(*)::integer from public.legal_document_versions where is_current),
  4,
  'all four required current legal documents are seeded'
);
select is(
  (select count(distinct document_key)::integer from public.legal_document_versions where is_current),
  4,
  'only one current version exists for each required document'
);

select has_function('public', 'has_current_legal_acceptance', array[]::text[], 'acceptance status function exists');
select has_function('public', 'accept_current_legal_documents', array[]::text[], 'acceptance write function exists');

select function_privs_are(
  'public', 'has_current_legal_acceptance', array[]::text[], 'anon', array[]::text[],
  'anonymous callers cannot read acceptance status'
);
select function_privs_are(
  'public', 'accept_current_legal_documents', array[]::text[], 'anon', array[]::text[],
  'anonymous callers cannot record acceptance'
);
select function_privs_are(
  'public', 'has_current_legal_acceptance', array[]::text[], 'authenticated', array['EXECUTE'],
  'authenticated members may read their acceptance status'
);
select function_privs_are(
  'public', 'accept_current_legal_documents', array[]::text[], 'authenticated', array['EXECUTE'],
  'authenticated members may record their own acceptance'
);

select ok(
  not has_table_privilege('anon', 'public.legal_document_versions', 'SELECT'),
  'anonymous callers cannot query the version catalog'
);
select ok(
  not has_table_privilege('anon', 'public.member_legal_acceptances', 'SELECT'),
  'anonymous callers cannot query acceptance history'
);
select ok(
  has_table_privilege('authenticated', 'public.legal_document_versions', 'SELECT'),
  'authenticated members can read the current version catalog through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.member_legal_acceptances', 'SELECT'),
  'authenticated members can read only their own acceptance history through RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.member_legal_acceptances', 'INSERT'),
  'authenticated members cannot bypass the acceptance function with direct inserts'
);
select ok(
  not has_table_privilege('authenticated', 'public.member_legal_acceptances', 'UPDATE'),
  'authenticated members cannot rewrite acceptance evidence'
);
select ok(
  not has_table_privilege('authenticated', 'public.member_legal_acceptances', 'DELETE'),
  'authenticated members cannot delete acceptance evidence'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '21212121-2121-4212-8212-212121212121',
  'authenticated', 'authenticated', 'legal-acceptance-test@example.com',
  crypt('test-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);

select set_config('request.jwt.claim.sub', '21212121-2121-4212-8212-212121212121', true);
set local role authenticated;

select is(public.has_current_legal_acceptance(), false, 'a member starts without current acceptance');
select is(public.accept_current_legal_documents(), true, 'the member can accept the complete current set');
select is(public.has_current_legal_acceptance(), true, 'the member is current immediately after acceptance');
select is(
  (select count(*)::integer from public.member_legal_acceptances),
  4,
  'one append-only record is stored for each current document'
);
select is(
  (select count(*)::integer from public.member_legal_acceptances where source = 'legal_acceptance_gate'),
  4,
  'each acceptance records its trusted source'
);

select * from finish();
rollback;
