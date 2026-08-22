begin;
select plan(28);

select has_table('public', 'account_lifecycle_state', 'private lifecycle state exists');
select has_table('public', 'account_lifecycle_events', 'append-only lifecycle audit exists');
select has_table('public', 'account_recent_auth_verifications', 'recent authentication records exist');
select has_table('public', 'account_export_tokens', 'one-time export tokens exist');

select is((select relrowsecurity from pg_class where oid = 'public.account_lifecycle_state'::regclass), true, 'lifecycle state has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.account_lifecycle_events'::regclass), true, 'lifecycle events have RLS');
select is((select relrowsecurity from pg_class where oid = 'public.account_recent_auth_verifications'::regclass), true, 'recent auth has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.account_export_tokens'::regclass), true, 'export tokens have RLS');

select ok(not has_table_privilege('anon', 'public.account_lifecycle_state', 'SELECT'), 'anon cannot read lifecycle state');
select ok(not has_table_privilege('authenticated', 'public.account_lifecycle_state', 'SELECT'), 'members cannot directly read lifecycle state');
select ok(not has_table_privilege('anon', 'public.account_lifecycle_events', 'SELECT'), 'anon cannot read lifecycle events');
select ok(not has_table_privilege('authenticated', 'public.account_lifecycle_events', 'SELECT'), 'members cannot read audit events');
select ok(not has_table_privilege('authenticated', 'public.account_recent_auth_verifications', 'SELECT'), 'members cannot read recent-auth records');
select ok(not has_table_privilege('authenticated', 'public.account_export_tokens', 'SELECT'), 'members cannot read export tokens');

select has_function('public', 'has_recent_account_auth', array[]::text[], 'recent authentication guard exists');
select has_function('public', 'get_my_account_lifecycle', array[]::text[], 'member lifecycle reader exists');
select has_function('public', 'set_my_account_lifecycle', array['text'], 'member lifecycle mutation exists');
select has_function('public', 'prepare_account_deletion', array['uuid', 'uuid'], 'service deletion preparation exists');
select has_function('public', 'complete_account_deletion', array['uuid', 'boolean', 'text'], 'service deletion completion exists');
select has_function('public', 'set_account_governance', array['uuid', 'uuid', 'boolean', 'text', 'text', 'timestamp with time zone'], 'governance RPC exists');
select has_function('public', 'consume_account_export_token', array['uuid', 'uuid'], 'atomic export consumption exists');

select ok(has_function_privilege('authenticated', 'public.get_my_account_lifecycle()', 'EXECUTE'), 'members can use guarded lifecycle reader');
select ok(has_function_privilege('authenticated', 'public.set_my_account_lifecycle(text)', 'EXECUTE'), 'members can use guarded lifecycle mutation');
select ok(not has_function_privilege('authenticated', 'public.prepare_account_deletion(uuid,uuid)', 'EXECUTE'), 'members cannot call destructive deletion preparation');
select ok(has_function_privilege('service_role', 'public.prepare_account_deletion(uuid,uuid)', 'EXECUTE'), 'service role can prepare deletion');
select ok(not has_function_privilege('authenticated', 'public.set_account_governance(uuid,uuid,boolean,text,text,timestamp with time zone)', 'EXECUTE'), 'members cannot change governance controls');
select ok(has_function_privilege('service_role', 'public.set_account_governance(uuid,uuid,boolean,text,text,timestamp with time zone)', 'EXECUTE'), 'service role can change governance after app operator checks');
select has_trigger('public', 'account_lifecycle_events', 'account_lifecycle_events_immutable', 'lifecycle audit is append-only');

select * from finish();
rollback;
