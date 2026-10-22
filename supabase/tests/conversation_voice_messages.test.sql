begin;

set local search_path = public, extensions, pg_temp;
create function pg_temp.voice_assert(condition boolean, label text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'Voice verification failed: %',label; end if; end; $$;
create function pg_temp.voice_is(actual text, expected text, label text) returns void language sql as $$
select pg_temp.voice_assert(actual is not distinct from expected,label); $$;
select pg_temp.voice_assert(not has_table_privilege('authenticated','public.conversation_voice_checks','INSERT'),'members cannot forge voice inspection');
select pg_temp.voice_assert(not has_table_privilege('anon','public.conversation_voice_checks','SELECT'),'anonymous users cannot read voice inspections');
select pg_temp.voice_assert(has_table_privilege('service_role','public.conversation_voice_checks','INSERT'),'trusted server can record inspection');
select pg_temp.voice_assert(not has_function_privilege('anon','public.get_voice_upload_for_validation(uuid,text)','EXECUTE'),'anonymous inspection denied');
select pg_temp.voice_assert((select not public from storage.buckets where id='conversation-attachments'),'media bucket remains private');
select pg_temp.voice_assert((select 'audio/mp4'=any(allowed_mime_types) and 'audio/webm'=any(allowed_mime_types) from storage.buckets where id='conversation-attachments'),'recording containers allowed');

create function pg_temp.voice_user(n integer) returns uuid language sql immutable
as $$ select md5('voice-test-user-'||n)::uuid $$;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',pg_temp.voice_user(n),'authenticated','authenticated','voice-'||n||'@example.invalid',crypt('test-password',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now() from generate_series(1,3)n;
select public.ensure_foundational_user_records(pg_temp.voice_user(n)) from generate_series(1,3)n;
select set_config('forge.allow_system_writes','on',true);
create temporary table voice_pair as select public.forge_ensure_connection(pg_temp.voice_user(1),pg_temp.voice_user(2),'open_to_chat') id;
grant select on voice_pair to authenticated;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(1)::text,true);
select public.ensure_conversation_for_connection((select id from voice_pair));
create temporary table clip as select c.id conversation_id, gen_random_uuid() object_id, gen_random_uuid() client_message_id,
 c.id::text||'/'||pg_temp.voice_user(1)::text||'/voice-hello.m4a' path from public.conversations c where c.connection_id=(select id from voice_pair);
grant select on clip to authenticated;
insert into storage.objects(id,bucket_id,name,owner_id,metadata)
select object_id,'conversation-attachments',path,pg_temp.voice_user(1)::text,'{"mimetype":"audio/mp4","size":1000}'::jsonb from clip;
create function pg_temp.send_clip() returns jsonb language sql as $$
select public.send_conversation_message_with_attachments(conversation_id,'',client_message_id,jsonb_build_array(jsonb_build_object('storage_path',path,'file_name','voice-hello.m4a','mime_type','audio/mp4','file_size',1000))) from clip $$;
set local role authenticated;
select pg_temp.voice_is(pg_temp.send_clip()->>'ok','false','uninspected voice cannot be sent through direct RPC');
select pg_temp.voice_is(public.get_voice_upload_for_validation((select conversation_id from clip),(select path from clip))->>'object_id',(select object_id::text from clip),'sender can identify own upload');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(3)::text,true);
set local role authenticated;
select pg_temp.voice_is(public.get_voice_upload_for_validation((select conversation_id from clip),(select path from clip))::text,null::text,'outsider cannot inspect upload');
select pg_temp.voice_is(pg_temp.send_clip()->>'ok','false','outsider cannot send clip');
reset role;
insert into public.conversation_voice_checks(object_id,storage_path,sender_id,file_size,mime_type,duration_seconds)
select object_id,path,pg_temp.voice_user(1),1000,'audio/mp4',300 from clip;
do $$
begin
  begin
    update public.conversation_voice_checks set duration_seconds=300.001
    where object_id=(select object_id from clip);
    raise exception 'Voice verification failed: duration over five minutes was accepted';
  exception when check_violation then null;
  end;
end;
$$;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(1)::text,true);
set local role authenticated;
select pg_temp.voice_is(pg_temp.send_clip()->>'ok','true','inspected five-minute voice sends in active conversation');
select pg_temp.voice_is(pg_temp.send_clip()->>'duplicate','true','retry deduplicates voice sends');
select pg_temp.voice_assert((select count(*)=1 from public.messages where conversation_id=(select conversation_id from clip)),'retry creates only one message');
select pg_temp.voice_is(public.send_conversation_message_with_attachments((select conversation_id from clip),'',gen_random_uuid(),jsonb_build_array(jsonb_build_object('storage_path',(select path from clip),'file_name','voice.m4a','mime_type','audio/mp4','file_size',999)))->>'ok','false','tampered voice metadata is denied');
select pg_temp.voice_is(public.send_conversation_message_with_attachments((select conversation_id from clip),'',gen_random_uuid(),jsonb_build_array(jsonb_build_object('storage_path',(select path from clip),'file_name','voice.m4a','mime_type','audio/mp4','file_size',1000,'view_once',true)))->>'ok','false','voice cannot become view once');
select pg_temp.voice_is(public.send_conversation_message_with_attachments((select conversation_id from clip),'',gen_random_uuid(),jsonb_build_array(jsonb_build_object('storage_path',(select path from clip),'file_name','clip.mp4','mime_type','video/mp4','file_size',1000)))->>'message','Video messages are reserved for a future Premium release.','direct video sends are disabled');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(2)::text,true);
set local role authenticated;
select pg_temp.voice_assert((select count(*)=1 from storage.objects where bucket_id='conversation-attachments' and name=(select path from clip)),'recipient can read sent voice');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(3)::text,true);
set local role authenticated;
select pg_temp.voice_assert((select count(*)=0 from storage.objects where bucket_id='conversation-attachments' and name=(select path from clip)),'outsider cannot read voice');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.voice_user(1)::text,true);
set local role authenticated;
savepoint voice_block_test;
select pg_temp.voice_is(public.block_user(pg_temp.voice_user(2))->>'ok','true','member can block');
select pg_temp.voice_is(pg_temp.send_clip()->>'ok','false','blocked conversation cannot send voice');
select pg_temp.voice_is(public.get_voice_upload_for_validation((select conversation_id from clip),(select path from clip))::text,null::text,'blocked conversation cannot inspect uploads');
rollback to savepoint voice_block_test;
select pg_temp.voice_is(public.end_connection((select id from voice_pair))->>'ok','true','can end after voice');
select pg_temp.voice_is(pg_temp.send_clip()->>'ok','false','voice cannot bypass ended conversation');
reset role;
select 'Voice database assertions passed; all fixtures rolled back.' as result;
rollback;
