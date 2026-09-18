begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;

select plan(39);

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
select has_function(
  'public', 'accept_current_legal_document', array['text'],
  'per-document acceptance function exists'
);

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
select function_privs_are(
  'public', 'accept_current_legal_document', array['text'], 'anon', array[]::text[],
  'anonymous callers cannot record one document acceptance'
);
select function_privs_are(
  'public', 'accept_current_legal_document', array['text'], 'authenticated', array['EXECUTE'],
  'authenticated members may record one document acceptance'
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
select is(public.accept_current_legal_document('terms'), true, 'the member can accept Terms');
select is(public.has_current_legal_acceptance(), false, 'one document does not unlock member features');
select is(
  (select count(*)::integer from public.member_legal_acceptances),
  1,
  'one acceptance stores one evidence record'
);
select is(
  (select count(*)::integer from public.member_legal_acceptances where source = 'legal_document_review'),
  1,
  'the acceptance records its trusted review source'
);
select ok(
  exists (
    select 1
    from public.member_legal_acceptances acceptance
    join public.legal_document_versions version on version.id = acceptance.document_version_id
    where version.document_key = 'terms' and version.is_current
  ),
  'the evidence identifies the exact current document version'
);
select is(public.accept_current_legal_document('terms'), true, 'accepting the same version again succeeds');
select is(
  (select count(*)::integer from public.member_legal_acceptances),
  1,
  'repeat acceptance is idempotent'
);
select is(public.accept_current_legal_document('privacy'), true, 'the member can accept Privacy');
select is(public.accept_current_legal_document('community_standards'), true, 'the member can accept Community Standards');
select is(public.has_current_legal_acceptance(), false, 'three documents still do not unlock member features');
select is(public.accept_current_legal_document('sensitive_data_consent'), true, 'the member can accept Sensitive Data Processing');
select is(public.has_current_legal_acceptance(), true, 'all four persisted acceptances unlock member features');
select is(
  (select count(*)::integer from public.member_legal_acceptances),
  4,
  'one append-only record is stored for each current document'
);
select is(
  (select count(*)::integer from public.member_legal_acceptances where source = 'legal_document_review'),
  4,
  'each acceptance records its trusted source'
);
select is(public.accept_current_legal_documents(), true, 'the legacy batch function remains compatible');
select is(
  (select count(*)::integer from public.member_legal_acceptances),
  4,
  'the legacy batch function cannot duplicate evidence'
);

select * from finish();
rollback;
