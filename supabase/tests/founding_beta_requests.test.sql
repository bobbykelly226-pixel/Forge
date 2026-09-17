begin;

select plan(17);

select has_table('public', 'founding_beta_requests', 'Founding Beta requests are stored');
select has_table('public', 'founding_beta_request_events', 'Founding Beta decisions have an audit ledger');
select ok((select relrowsecurity from pg_class where oid = 'public.founding_beta_requests'::regclass), 'request table has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.founding_beta_request_events'::regclass), 'event table has RLS');
select table_privs_are('public', 'founding_beta_requests', 'anon', array[]::text[], 'anonymous users have no direct request-table privileges');
select table_privs_are('public', 'founding_beta_requests', 'authenticated', array[]::text[], 'members have no direct request-table privileges');
select function_privs_are('public', 'approve_founding_beta_request', array['uuid','uuid','text'], 'anon', array[]::text[], 'anonymous users cannot approve requests');
select function_privs_are('public', 'approve_founding_beta_request', array['uuid','uuid','text'], 'authenticated', array[]::text[], 'members cannot approve requests');

insert into public.founding_beta_requests (
  id, first_name, email, location, gender, interested_in, relationship_goal,
  adult_confirmed, feedback_agreed, standards_agreed
) values (
  '10000000-0000-0000-0000-000000000010', 'Jordan', 'jordan@example.com',
  'Denver, Colorado', 'woman', array['men'], 'serious_relationship', true, true, true
);

select is(
  (public.approve_founding_beta_request(
    '10000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000099',
    'Balanced founding cohort candidate.'
  )->>'email'),
  'jordan@example.com',
  'approval returns the normalized invitee email'
);

select is((select status from public.founding_beta_requests where email = 'jordan@example.com'), 'approved', 'approval updates request status');
select ok((select expires_at between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour' from public.beta_signup_invitations where email = 'jordan@example.com'), 'approval creates a seven-day invitation');
select is((select count(*)::integer from public.founding_beta_request_events where request_id = '10000000-0000-0000-0000-000000000010'), 1, 'approval appends one audit event');

select ok(public.record_founding_beta_invitation_delivery(
  '10000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000099',
  true,
  null,
  false
), 'successful delivery is recorded');
select is((select status from public.founding_beta_requests where email = 'jordan@example.com'), 'invited', 'successful delivery marks the request invited');

insert into public.founding_beta_requests (
  id, first_name, email, location, gender, interested_in, relationship_goal,
  adult_confirmed, feedback_agreed, standards_agreed
) values (
  '10000000-0000-0000-0000-000000000011', 'Taylor', 'taylor@example.com',
  'Boulder, Colorado', 'man', array['women'], 'marriage', true, true, true
);

select ok(public.decline_founding_beta_request(
  '10000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000099',
  'Cohort balance decision.'
), 'a pending request can be declined');
select is((select status from public.founding_beta_requests where email = 'taylor@example.com'), 'declined', 'decline updates request status');
select is((select count(*)::integer from public.founding_beta_request_events where request_id = '10000000-0000-0000-0000-000000000011'), 1, 'decline appends one audit event');

select * from finish();
rollback;
