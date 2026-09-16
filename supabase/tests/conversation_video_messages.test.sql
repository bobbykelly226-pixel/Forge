begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select no_plan();
select ok(not has_table_privilege('authenticated','public.conversation_video_checks','INSERT'),'members cannot forge video inspection');
select ok(not has_table_privilege('anon','public.conversation_video_checks','SELECT'),'anonymous users cannot read video inspections');
select ok(has_table_privilege('service_role','public.conversation_video_checks','INSERT'),'trusted server can record inspection');
select ok(not has_function_privilege('anon','public.get_video_upload_for_validation(uuid,text)','EXECUTE'),'anonymous inspection denied');
select ok((select not public from storage.buckets where id='conversation-attachments'),'media bucket remains private');
select ok((select 'video/mp4'=any(allowed_mime_types) and 'video/webm'=any(allowed_mime_types) from storage.buckets where id='conversation-attachments'),'recording containers allowed');

create function pg_temp.video_user(n integer) returns uuid language sql immutable
as $$ select md5('video-test-user-'||n)::uuid $$;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',pg_temp.video_user(n),'authenticated','authenticated','video-'||n||'@example.invalid',crypt('test-password',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now() from generate_series(1,3)n;
select public.ensure_foundational_user_records(pg_temp.video_user(n)) from generate_series(1,3)n;
select set_config('forge.allow_system_writes','on',true);
create temporary table video_pair as select public.forge_ensure_connection(pg_temp.video_user(1),pg_temp.video_user(2),'open_to_chat') id;
grant select on video_pair to authenticated;
select set_config('request.jwt.claim.sub',pg_temp.video_user(1)::text,true);
select public.ensure_conversation_for_connection((select id from video_pair));
create temporary table clip as select c.id conversation_id, gen_random_uuid() object_id,
 c.id::text||'/'||pg_temp.video_user(1)::text||'/video-hello.mp4' path from public.conversations c where c.connection_id=(select id from video_pair);
grant select on clip to authenticated;
insert into storage.objects(id,bucket_id,name,owner_id,metadata)
select object_id,'conversation-attachments',path,pg_temp.video_user(1)::text,'{"mimetype":"video/mp4","size":1000}'::jsonb from clip;
create function pg_temp.send_clip() returns jsonb language sql as $$
select public.send_conversation_message_with_attachments(conversation_id,'',gen_random_uuid(),jsonb_build_array(jsonb_build_object('storage_path',path,'file_name','video-hello.mp4','mime_type','video/mp4','file_size',1000))) from clip $$;
set local role authenticated;
select is(pg_temp.send_clip()->>'ok','false','uninspected video cannot be sent through direct RPC');
select is(public.get_video_upload_for_validation((select conversation_id from clip),(select path from clip))->>'object_id',(select object_id::text from clip),'sender can identify own upload');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.video_user(3)::text,true);
set local role authenticated;
select is(public.get_video_upload_for_validation((select conversation_id from clip),(select path from clip)),null::jsonb,'outsider cannot inspect upload');
select is(pg_temp.send_clip()->>'ok','false','outsider cannot send clip');
reset role;
insert into public.conversation_video_checks(object_id,storage_path,sender_id,file_size,mime_type,duration_seconds)
select object_id,path,pg_temp.video_user(1),1000,'video/mp4',14.5 from clip;
select set_config('request.jwt.claim.sub',pg_temp.video_user(1)::text,true);
set local role authenticated;
select is(pg_temp.send_clip()->>'ok','true','inspected owner video sends in active conversation');
select is(public.end_connection((select id from video_pair))->>'ok','true','can end after video');
select is(pg_temp.send_clip()->>'ok','false','video cannot bypass ended conversation');
reset role;
select * from finish();
rollback;
