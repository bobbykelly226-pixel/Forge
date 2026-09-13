begin;

select no_plan();

select has_table('public', 'beta_enrollment_settings', 'beta enrollment settings exist');
select has_table('public', 'beta_signup_links', 'hashed beta signup links exist');
select has_table('public', 'beta_signup_reservations', 'proof-bound signup reservations exist');
select ok((select relrowsecurity from pg_class where oid = 'public.beta_enrollment_settings'::regclass), 'enrollment settings have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.beta_signup_links'::regclass), 'signup links have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.beta_signup_reservations'::regclass), 'signup reservations have RLS');
select has_function('public', 'reserve_beta_signup_access', array['text', 'text', 'text'], 'reservation function exists');
select function_privs_are('public', 'reserve_beta_signup_access', array['text', 'text', 'text'], 'anon', array[]::text[], 'anonymous callers cannot reserve beta access');
select function_privs_are('public', 'reserve_beta_signup_access', array['text', 'text', 'text'], 'authenticated', array[]::text[], 'members cannot reserve beta access');
select function_privs_are('public', 'reserve_beta_signup_access', array['text', 'text', 'text'], 'service_role', array['EXECUTE'], 'only the service role may reserve beta access');
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'beta_signup_invitations'
      and policyname = 'Auth hook may record link signup invitations'
  ),
  'the Auth hook can record the accepted email audit row for link signups'
);

delete from public.beta_signup_reservations;
delete from public.beta_signup_invitations;
delete from public.beta_signup_links;
update public.beta_enrollment_settings
set enrollment_open = true, member_limit = 2, accepted_count = 0;

insert into public.beta_signup_links (id, label, token_hash, max_uses, expires_at)
values (
  '20000000-0000-0000-0000-000000000001',
  'Two-person test link',
  encode(extensions.digest('shared-token', 'sha256'), 'hex'),
  2,
  now() + interval '7 days'
);

select is(
  public.reserve_beta_signup_access(
    'FIRST@Example.com',
    encode(extensions.digest('shared-token', 'sha256'), 'hex'),
    encode(extensions.digest('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'sha256'), 'hex')
  )->>'ok',
  'true',
  'a valid shared link creates a reservation'
);
select is(
  (select proof_hash from public.beta_signup_reservations where email = 'first@example.com'),
  encode(extensions.digest('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'sha256'), 'hex'),
  'only the reservation proof hash is stored'
);
select ok(
  not exists (select 1 from public.beta_signup_links where token_hash = 'shared-token'),
  'the raw invitation token is never stored'
);
select is(
  public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000001',
    'email', 'first@example.com',
    'user_metadata', jsonb_build_object('forge_beta_reservation', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  ))),
  '{}'::jsonb,
  'the Auth hook consumes a proof-bound link reservation'
);
select is((select use_count from public.beta_signup_links where id = '20000000-0000-0000-0000-000000000001'), 1, 'link use count increments once');
select is((select accepted_count from public.beta_enrollment_settings where singleton), 1, 'global accepted count increments once');
select is((select accepted_user_id::text from public.beta_signup_reservations where email = 'first@example.com'), '30000000-0000-0000-0000-000000000001', 'reservation records the accepted Auth user');
select is(
  (public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000002',
    'email', 'first@example.com',
    'user_metadata', jsonb_build_object('forge_beta_reservation', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  ))) #>> '{error,http_code}')::integer,
  403,
  'a consumed proof cannot be replayed'
);

update public.beta_enrollment_settings set enrollment_open = false;
select is(
  public.reserve_beta_signup_access(
    'second@example.com',
    encode(extensions.digest('shared-token', 'sha256'), 'hex'),
    encode(extensions.digest('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'sha256'), 'hex')
  )->>'reason',
  'paused',
  'operator pause blocks public link reservations'
);

update public.beta_enrollment_settings set enrollment_open = true;
select is(
  public.reserve_beta_signup_access(
    'second@example.com',
    encode(extensions.digest('shared-token', 'sha256'), 'hex'),
    encode(extensions.digest('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'sha256'), 'hex')
  )->>'ok',
  'true',
  'reopening enrollment restores valid link reservations'
);
select is(
  public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000003',
    'email', 'second@example.com',
    'user_metadata', jsonb_build_object('forge_beta_reservation', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
  ))),
  '{}'::jsonb,
  'the second permitted link signup succeeds'
);
select is((select accepted_count from public.beta_enrollment_settings where singleton), 2, 'the global cap tracks both accepted accounts');
select is(
  public.reserve_beta_signup_access(
    'third@example.com',
    encode(extensions.digest('shared-token', 'sha256'), 'hex'),
    encode(extensions.digest('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 'sha256'), 'hex')
  )->>'reason',
  'full',
  'the global cap rejects another reservation'
);
select is((select use_count from public.beta_signup_links where id = '20000000-0000-0000-0000-000000000001'), 2, 'the shared link also stops at its use limit');

insert into public.beta_signup_invitations (email, expires_at)
values ('direct@example.com', now() + interval '7 days');
select is(
  (public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000004',
    'email', 'direct@example.com'
  ))) #>> '{error,http_code}')::integer,
  403,
  'direct email access still respects the global account cap'
);

update public.beta_enrollment_settings set enrollment_open = false, member_limit = 3;
select is(
  public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
    'id', '30000000-0000-0000-0000-000000000004',
    'email', 'direct@example.com'
  ))),
  '{}'::jsonb,
  'direct email access remains available for internal testing while public links are paused'
);
select is((select accepted_count from public.beta_enrollment_settings where singleton), 3, 'the direct invitation is included in the global beta count');
select is((select source_link_id from public.beta_signup_invitations where email = 'first@example.com'), '20000000-0000-0000-0000-000000000001'::uuid, 'accepted link signups retain their source-link audit reference');
select is((select count(*)::integer from public.beta_signup_invitations where accepted_at is not null), 3, 'all accepted beta accounts have invitation audit rows');


-- Proof issuance does not consume a place or a link use; multiple independent
-- attempts must remain valid until one successfully enters Auth.
update public.beta_enrollment_settings set member_limit = 10, enrollment_open = true;
insert into public.beta_signup_links (id, label, token_hash, max_uses, expires_at)
values ('20000000-0000-0000-0000-000000000002', 'One-use link', repeat('e',64), 1, now() + interval '1 day');

select is(public.reserve_beta_signup_access(null, repeat('e',64), repeat('d',64))->>'reason', 'invalid', 'null email fails closed');
select is(public.reserve_beta_signup_access('retry@example.com', null, repeat('d',64))->>'reason', 'invalid', 'null link fails closed');
select is(public.reserve_beta_signup_access('retry@example.com', repeat('e',64), null)->>'reason', 'invalid', 'null proof fails closed');
select is(public.reserve_beta_signup_access('retry@example.com', repeat('e',64), encode(extensions.digest(repeat('d',64),'sha256'),'hex'))->>'ok', 'true', 'first attempt gets a proof');
select is(public.reserve_beta_signup_access('retry@example.com', repeat('e',64), encode(extensions.digest(repeat('f',64),'sha256'),'hex'))->>'ok', 'true', 'retry gets an independent proof');
select is((select count(*)::integer from public.beta_signup_reservations where email='retry@example.com'), 2, 'retry does not rotate the earlier proof');
select is((select accepted_count from public.beta_enrollment_settings where singleton), 3, 'pre-CAPTCHA attempts never occupy member capacity');
select is((select use_count from public.beta_signup_links where id='20000000-0000-0000-0000-000000000002'), 0, 'pre-CAPTCHA attempts never consume invitation uses');

select is(public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
'id','30000000-0000-0000-0000-000000000005','email','wrong@example.com','user_metadata',jsonb_build_object('forge_beta_reservation',repeat('d',64))
)))#>>'{error,http_code}', '403', 'a proof cannot be used for another email');

update public.beta_signup_links set revoked_at=now() where id='20000000-0000-0000-0000-000000000002';
select is(public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
'id','30000000-0000-0000-0000-000000000005','email','retry@example.com','user_metadata',jsonb_build_object('forge_beta_reservation',repeat('d',64))
)))#>>'{error,http_code}', '403', 'revocation between preflight and Auth is enforced');
update public.beta_signup_links set revoked_at=null where id='20000000-0000-0000-0000-000000000002';

update public.beta_enrollment_settings set enrollment_open=false;
select is(public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
'id','30000000-0000-0000-0000-000000000005','email','retry@example.com','user_metadata',jsonb_build_object('forge_beta_reservation',repeat('d',64))
)))#>>'{error,http_code}', '403', 'pause between preflight and Auth is enforced');
update public.beta_enrollment_settings set enrollment_open=true;

update public.beta_signup_reservations set reserved_at=now()-interval '2 hours', expires_at=now()-interval '1 hour'
where email='retry@example.com' and proof_hash=encode(extensions.digest(repeat('f',64),'sha256'),'hex');
select is(public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
'id','30000000-0000-0000-0000-000000000005','email','retry@example.com','user_metadata',jsonb_build_object('forge_beta_reservation',repeat('f',64))
)))#>>'{error,http_code}', '403', 'expired proofs are rejected');
select is(public.hook_enforce_beta_signup_invitation(jsonb_build_object('user', jsonb_build_object(
'id','30000000-0000-0000-0000-000000000005','email','retry@example.com','user_metadata',jsonb_build_object('forge_beta_reservation',repeat('d',64))
))), '{}'::jsonb, 'the original proof still succeeds after retry and restored availability');
select is(public.reserve_beta_signup_access('next@example.com', repeat('e',64), repeat('c',64))->>'reason','link_full','a single-use link closes after one accepted signup');

select is(public.set_beta_member_limit(3,'30000000-0000-0000-0000-000000000001'),false,'cap cannot be reduced below occupied places');
select is(public.set_beta_member_limit(4,'30000000-0000-0000-0000-000000000001'),true,'cap may equal occupied places');
select is(public.set_beta_member_limit(null,'30000000-0000-0000-0000-000000000001'),false,'null capacity fails closed');
select function_privs_are('public','set_beta_member_limit',array['integer','uuid'],'authenticated',array[]::text[],'members cannot change capacity');
select function_privs_are('public','beta_enrollment_counts',array[]::text[],'anon',array[]::text[],'verified member counts are private');
select is((public.beta_enrollment_counts()->>'verified_count')::integer,(select count(*)::integer from auth.users where email_confirmed_at is not null),'verified count derives only from Auth email confirmations');
select is((public.beta_enrollment_counts()->>'pending_count')::integer,(select count(*)::integer from auth.users where email_confirmed_at is null),'pending confirmation accounts are separate');

select ok((select relrowsecurity from pg_class where oid='public.beta_enrollment_waitlist'::regclass),'waitlist has RLS');
select function_privs_are('public','join_beta_waitlist',array['text','text'],'anon',array[]::text[],'anonymous callers cannot directly write waitlist');
select is(public.join_beta_waitlist('  WAIT@Example.com  ','Test Waitlist'),true,'waitlist accepts normalized email');
select is(public.join_beta_waitlist('wait@example.com','Changed Name'),true,'duplicate waitlist signup succeeds idempotently');
select is((select count(*)::integer from public.beta_enrollment_waitlist where email='wait@example.com'),1,'duplicates do not create extra records');
select is((select name from public.beta_enrollment_waitlist where email='wait@example.com'),'Test Waitlist','duplicate submission does not overwrite someone else’s original details');
select is(public.join_beta_waitlist(null,'Name'),false,'null waitlist email rejected');
select is(public.join_beta_waitlist('bad-email','Name'),false,'malformed waitlist email rejected');

select * from finish();
rollback;
