begin;
set local search_path=public,extensions,pg_temp;
create function pg_temp.trust_assert(condition boolean,label text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'Trust test failed: %',label; end if; end $$;
create function pg_temp.trust_error(statement text,code text,fragment text) returns void language plpgsql as $$
begin
  begin execute statement; exception when others then
    if sqlstate=code and position(fragment in sqlerrm)>0 then return; end if;
    raise exception 'Unexpected error: % % (wanted % %)',sqlstate,sqlerrm,code,fragment;
  end;
  raise exception 'Expected rejection: %',statement;
end $$;
create function pg_temp.trust_user(n integer) returns uuid language sql immutable as $$select md5('forge-trust-test-20261022-'||n)::uuid$$;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',pg_temp.trust_user(n),'authenticated','authenticated','trust-'||n||'@example.invalid',crypt('fixture-password',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now() from generate_series(1,15)n;
select public.ensure_foundational_user_records(pg_temp.trust_user(n)) from generate_series(1,15)n;
select set_config('forge.allow_system_writes','on',true);
update public.profile_private_details set date_of_birth='1990-01-01',latitude=39,longitude=-105 where user_id in(select pg_temp.trust_user(n) from generate_series(1,15)n);
update public.profile_preferences set gender_identity='man',interested_in=array['everyone'],preferred_age_min=18,preferred_age_max=100,max_distance_miles=100 where user_id in(select pg_temp.trust_user(n) from generate_series(1,15)n);
insert into storage.objects(bucket_id,name,owner_id,metadata)
select 'profile-photos',pg_temp.trust_user(n)::text||'/approved.png',pg_temp.trust_user(n)::text,'{"size":100,"mimetype":"image/png"}'::jsonb from generate_series(1,15)n;
insert into public.profile_photos(user_id,storage_path,moderation_status,is_primary,display_order,reviewed_at,reviewed_by)
select pg_temp.trust_user(n),pg_temp.trust_user(n)::text||'/approved.png','approved',true,0,now(),pg_temp.trust_user(15) from generate_series(1,15)n;
update public.profiles set status='active',is_discoverable=true,relationship_goal='serious_relationship',relationship_goals=array['serious_relationship'],short_bio='A real description for this isolated test.' where id in(select pg_temp.trust_user(n) from generate_series(1,15)n);
select pg_temp.trust_assert((select count(*)=15 from public.discoverable_profiles where id in(select pg_temp.trust_user(n) from generate_series(1,15)n)),'ready fixtures are discoverable');
select pg_temp.trust_assert(not has_table_privilege('authenticated','public.interests','insert'),'direct Interest inserts revoked');
select pg_temp.trust_assert(not has_function_privilege('authenticated','private.forge_record_contact_rate(uuid,uuid,text)','execute'),'members cannot alter allowances');
select pg_temp.trust_assert(not has_table_privilege('authenticated','private.contact_rate_events','select'),'rate metadata is private');

select set_config('request.jwt.claim.sub',pg_temp.trust_user(1)::text,true);
set local role authenticated;
select pg_temp.trust_error(format('insert into public.interests(sender_id,recipient_id,status) values(%L,%L,''pending'')',pg_temp.trust_user(1),pg_temp.trust_user(2)),'42501','permission denied');
select pg_temp.trust_assert((public.send_interest(pg_temp.trust_user(2))->>'ok')::boolean,'ordinary Interest works');
select pg_temp.trust_assert((public.send_interest(pg_temp.trust_user(2))->>'ok')::boolean,'Interest retry remains idempotent');
reset role;
select pg_temp.trust_assert((select count(*)=1 from private.contact_rate_events where user_id=pg_temp.trust_user(1)),'retry consumes one allowance');
set local role authenticated;
select public.withdraw_interest(pg_temp.trust_user(2));
select pg_temp.trust_error(format('select public.send_interest(%L)',pg_temp.trust_user(2)),'P0001','FORGE_INTEREST_REPEAT_LIMIT');
select public.send_interest(pg_temp.trust_user(n)) from generate_series(3,11)n;
select pg_temp.trust_error(format('select public.send_interest(%L)',pg_temp.trust_user(12)),'P0001','FORGE_INTEREST_RATE_LIMIT');
reset role;
select pg_temp.trust_assert((select count(*)=10 from private.contact_rate_events where user_id=pg_temp.trust_user(1)),'rejected Interest rolls back allowance');
delete from private.contact_rate_events where user_id=pg_temp.trust_user(1);

create temporary table trust_thread as select public.forge_ensure_connection(pg_temp.trust_user(1),pg_temp.trust_user(2),'open_to_chat') connection_id;
grant select on trust_thread to authenticated;
select public.ensure_conversation_for_connection((select connection_id from trust_thread));
alter table trust_thread add column conversation_id uuid;
update trust_thread t set conversation_id=c.id from public.conversations c where c.connection_id=t.connection_id;
create temporary table trust_message_id as select gen_random_uuid() id;
grant select on trust_message_id to authenticated;
set local role authenticated;
select pg_temp.trust_assert((public.send_conversation_message_with_attachments((select conversation_id from trust_thread),'Hello',(select id from trust_message_id),'[]')->>'ok')::boolean,'normal message works');
select pg_temp.trust_assert((public.send_conversation_message_with_attachments((select conversation_id from trust_thread),'Hello',(select id from trust_message_id),'[]')->>'duplicate')::boolean,'message retry deduplicates');
select public.send_conversation_message((select conversation_id from trust_thread),'Text '||n,gen_random_uuid()) from generate_series(2,30)n;
select pg_temp.trust_error('select public.send_conversation_message((select conversation_id from trust_thread),''Too fast'',gen_random_uuid())','P0001','FORGE_MESSAGE_RATE_LIMIT');
select pg_temp.trust_error('select public.send_conversation_message_with_attachments((select conversation_id from trust_thread),''Too fast'',gen_random_uuid(),''[]'')','P0001','FORGE_MESSAGE_RATE_LIMIT');
reset role;
select pg_temp.trust_assert((select count(*)=30 from public.messages where conversation_id=(select conversation_id from trust_thread)),'both endpoints share atomic message limit');
delete from private.contact_rate_events where user_id=pg_temp.trust_user(1);

-- A voluntary pause preserves existing conversations.
update public.profiles set status='paused',is_discoverable=false where id=pg_temp.trust_user(1);
set local role authenticated;
select pg_temp.trust_assert((public.send_conversation_message((select conversation_id from trust_thread),'Still talking',gen_random_uuid())->>'ok')::boolean,'voluntary pause keeps existing conversation');
reset role;
update public.profiles set status='active',is_discoverable=true where id=pg_temp.trust_user(1);
create temporary table trust_report as select gen_random_uuid() id;
insert into public.user_reports(id,reporter_id,reported_user_id,conversation_id,reason,details)
select id,pg_temp.trust_user(3),pg_temp.trust_user(1),null,'other','Isolated enforcement verification.' from trust_report;
select public.review_safety_report((select id from trust_report),pg_temp.trust_user(15),'suspend','Isolated test suspension',false);
-- Existing JWT identity remains unchanged: no fresh login is needed for enforcement.
set local role authenticated;
select pg_temp.trust_assert(public.send_conversation_message((select conversation_id from trust_thread),'After suspension',gen_random_uuid())->>'ok'='false','text send denied after suspension');
select pg_temp.trust_assert(public.send_conversation_message_with_attachments((select conversation_id from trust_thread),'After suspension',gen_random_uuid(),'[]')->>'ok'='false','attachment/voice send denied after suspension');
select pg_temp.trust_assert(not public.forge_can_access_conversation_attachments((select conversation_id from trust_thread),pg_temp.trust_user(1)),'suspension denies media signing/upload');
select pg_temp.trust_assert(public.send_interest(pg_temp.trust_user(13))->>'ok'='false','Interest denied after suspension');
select pg_temp.trust_assert(public.send_open_to_chat(pg_temp.trust_user(14),'Hello')->>'ok'='false','Open to Chat denied after suspension');
reset role;
select pg_temp.trust_error(format('insert into public.messages(conversation_id,sender_id,body,client_message_id) values(%L,%L,''Direct suspended send'',gen_random_uuid())',(select conversation_id from trust_thread),pg_temp.trust_user(1)),'P0001','FORGE_CONTACT_UNAVAILABLE');
select set_config('request.jwt.claim.sub',pg_temp.trust_user(2)::text,true);
set local role authenticated;
select pg_temp.trust_assert(public.send_conversation_message((select conversation_id from trust_thread),'To suspended member',gen_random_uuid())->>'ok'='false','text send to suspended member denied');
select pg_temp.trust_error(format('update public.profiles set profile_photo_url=''https://example.invalid/unreviewed.png'' where id=%L',pg_temp.trust_user(2)),'23514','profiles_no_legacy_photo_url');
update storage.objects set metadata='{"size":999,"mimetype":"image/png"}' where bucket_id='profile-photos' and name=pg_temp.trust_user(2)::text||'/approved.png';
reset role;
select pg_temp.trust_assert((select metadata->>'size'='100' from storage.objects where bucket_id='profile-photos' and name=pg_temp.trust_user(2)::text||'/approved.png'),'approved bytes cannot be overwritten via storage metadata');
set local role authenticated;
select pg_temp.trust_error(format('update public.profile_photos set approved_object_id=gen_random_uuid() where user_id=%L',pg_temp.trust_user(2)),'P0001','Photo approval is managed');
reset role;
select set_config('request.jwt.claim.sub','',true);
-- Model the new object identity produced by a same-path deletion/recreation.
-- This touches only the disposable metadata fixture and never deletes real storage.
update storage.objects set id=gen_random_uuid(),metadata='{"size":999,"mimetype":"image/png"}'
where bucket_id='profile-photos' and name=pg_temp.trust_user(2)::text||'/approved.png';
select pg_temp.trust_assert(not private.forge_profile_ready(pg_temp.trust_user(2)),'same-path replacement loses readiness');
select pg_temp.trust_assert(not exists(select 1 from public.discoverable_profiles where id=pg_temp.trust_user(2)),'unapproved replacement disappears from Discovery');
update public.profiles set short_bio=null,more_about=null where id=pg_temp.trust_user(3);
select pg_temp.trust_assert(not public.can_activate_discovery_visibility(pg_temp.trust_user(3)),'empty biography cannot activate Discovery');
update public.profiles set relationship_goal=null,relationship_goals='{}' where id=pg_temp.trust_user(4);
select pg_temp.trust_assert(not public.can_activate_discovery_visibility(pg_temp.trust_user(4)),'missing intention cannot activate Discovery');
select set_config('request.jwt.claim.sub',pg_temp.trust_user(5)::text,true);
set local role authenticated;
select pg_temp.trust_assert((select count(*)<=3 from public.list_discovery_candidate_page(null,3)),'candidate pagination bounded');
select pg_temp.trust_assert((select count(*)=0 from public.list_eligible_discovery_profile_photos(array[pg_temp.trust_user(2)])),'unapproved replacement cannot be projected');
reset role;
select 'Trust hardening database assertions passed; fixture rollback follows.' as result;
rollback;
