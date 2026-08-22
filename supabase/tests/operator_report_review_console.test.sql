begin;
select plan(26);

select has_table('public', 'operator_report_cases', 'private operator case state exists');
select has_table('public', 'operator_report_events', 'append-only operator events exist');
select has_table('public', 'operator_member_enforcements', 'operator enforcement records exist');
select has_table('public', 'safety_report_appeals', 'member appeal intake exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.operator_report_cases'::regclass),
  true,
  'operator case state has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.operator_report_events'::regclass),
  true,
  'operator events have RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.operator_member_enforcements'::regclass),
  true,
  'operator enforcements have RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.safety_report_appeals'::regclass),
  true,
  'appeals have RLS enabled'
);

select ok(not has_table_privilege('anon', 'public.operator_report_cases', 'SELECT'), 'anon cannot read operator cases');
select ok(not has_table_privilege('authenticated', 'public.operator_report_cases', 'SELECT'), 'members cannot read operator cases');
select ok(not has_table_privilege('anon', 'public.operator_report_events', 'SELECT'), 'anon cannot read operator events');
select ok(not has_table_privilege('authenticated', 'public.operator_report_events', 'SELECT'), 'members cannot read operator events');
select ok(not has_table_privilege('anon', 'public.operator_member_enforcements', 'SELECT'), 'anon cannot read enforcement records');
select ok(not has_table_privilege('authenticated', 'public.operator_member_enforcements', 'SELECT'), 'members cannot read enforcement records');

select has_function('public', 'review_safety_report', array['uuid', 'uuid', 'text', 'text', 'boolean'], 'review RPC exists');
select has_function('public', 'record_safety_member_notification', array['uuid', 'uuid', 'boolean', 'text'], 'notification outcome RPC exists');
select has_function('public', 'submit_safety_report_appeal', array['uuid', 'text'], 'appeal intake RPC exists');

select ok(
  not has_function_privilege('anon', 'public.review_safety_report(uuid,uuid,text,text,boolean)', 'EXECUTE'),
  'anon cannot review reports'
);
select ok(
  not has_function_privilege('authenticated', 'public.review_safety_report(uuid,uuid,text,text,boolean)', 'EXECUTE'),
  'members cannot review reports'
);
select ok(
  has_function_privilege('service_role', 'public.review_safety_report(uuid,uuid,text,text,boolean)', 'EXECUTE'),
  'service role can review reports after application operator checks'
);
select ok(
  not has_function_privilege('anon', 'public.submit_safety_report_appeal(uuid,text)', 'EXECUTE'),
  'anon cannot submit appeals'
);
select ok(
  has_function_privilege('authenticated', 'public.submit_safety_report_appeal(uuid,text)', 'EXECUTE'),
  'authenticated reported members can reach guarded appeal intake'
);

select has_trigger('public', 'operator_report_events', 'operator_report_events_immutable', 'operator audit events are immutable');
select has_trigger('public', 'operator_member_enforcements', 'operator_member_enforcements_immutable', 'enforcement records cannot be deleted');
select has_trigger('public', 'operator_member_enforcements', 'operator_member_enforcements_limit_update', 'enforcement records only permit a notification outcome transition');
select has_trigger('public', 'user_reports', 'user_reports_create_operator_case', 'new reports automatically enter the operator queue');

select * from finish();
rollback;
