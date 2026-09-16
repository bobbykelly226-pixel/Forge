begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;
select no_plan();

select ok(
  not has_table_privilege('authenticated', 'public.message_attachments', 'UPDATE'),
  'members cannot mark video attachments viewed directly'
);
select ok(
  not has_function_privilege('anon', 'public.open_view_once_video(uuid)', 'EXECUTE'),
  'anonymous callers cannot open View Once videos'
);
select ok(
  has_function_privilege('authenticated', 'public.open_view_once_video(uuid)', 'EXECUTE'),
  'authenticated recipients can invoke the protected open RPC'
);

create function pg_temp.once_user(n integer) returns uuid language sql immutable
as $$ select md5('view-once-user-' || n)::uuid $$;

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
)
select
  '00000000-0000-0000-0000-000000000000', pg_temp.once_user(n),
  'authenticated','authenticated','once-' || n || '@example.invalid',
  crypt('test-password',gen_salt('bf')),now(),
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()
from generate_series(1,3) n;

select public.ensure_foundational_user_records(pg_temp.once_user(n))
from generate_series(1,3) n;
select set_config('forge.allow_system_writes','on',true);

create temporary table once_pair as
select public.forge_ensure_connection(
  pg_temp.once_user(1), pg_temp.once_user(2), 'open_to_chat'
) id;
grant select on once_pair to authenticated;

select set_config('request.jwt.claim.sub',pg_temp.once_user(1)::text,true);
select public.ensure_conversation_for_connection((select id from once_pair));

create temporary table once_clip as
select
  c.id conversation_id,
  gen_random_uuid() object_id,
  c.id::text || '/' || pg_temp.once_user(1)::text || '/view-once.mp4' path
from public.conversations c
where c.connection_id = (select id from once_pair);
grant select on once_clip to authenticated;

insert into storage.objects(id,bucket_id,name,owner_id,metadata)
select object_id,'conversation-attachments',path,pg_temp.once_user(1)::text,
  '{"mimetype":"video/mp4","size":1000}'::jsonb
from once_clip;

insert into public.conversation_video_checks(
  object_id,storage_path,sender_id,file_size,mime_type,duration_seconds
)
select object_id,path,pg_temp.once_user(1),1000,'video/mp4',14.5
from once_clip;

create temporary table once_send(result jsonb);
grant select on once_send to authenticated;
set local role authenticated;
insert into once_send(result)
select public.send_conversation_message_with_attachments(
  conversation_id,
  '',
  gen_random_uuid(),
  jsonb_build_array(jsonb_build_object(
    'storage_path',path,
    'file_name','view-once.mp4',
    'mime_type','video/mp4',
    'file_size',1000,
    'view_once',true
  ))
)
from once_clip;
reset role;

select is((select result->>'ok' from once_send), 'true', 'sender can send an inspected View Once video');

create temporary table once_attachment as
select a.id, a.storage_path
from public.message_attachments a
where a.message_id = ((select result->>'message_id' from once_send))::uuid;
grant select on once_attachment to authenticated;

select set_config('request.jwt.claim.sub',pg_temp.once_user(1)::text,true);
set local role authenticated;
select is(
  public.open_view_once_video((select id from once_attachment))->>'ok',
  'false',
  'sender cannot consume the recipient playback'
);
reset role;

select set_config('request.jwt.claim.sub',pg_temp.once_user(3)::text,true);
set local role authenticated;
select is(
  public.open_view_once_video((select id from once_attachment))->>'ok',
  'false',
  'conversation outsider cannot consume playback'
);
reset role;

select set_config('request.jwt.claim.sub',pg_temp.once_user(2)::text,true);
set local role authenticated;
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'conversation-attachments' and name = (select storage_path from once_attachment)),
  0,
  'recipient cannot bypass the one-opening RPC through Storage'
);
select is(
  public.open_view_once_video((select id from once_attachment))->>'ok',
  'true',
  'recipient can claim the first playback'
);
select is(
  public.open_view_once_video((select id from once_attachment))->>'message',
  'Video has already been viewed.',
  'a second playback claim is denied'
);
reset role;

select ok(
  (select viewed_at is not null from public.message_attachments where id = (select id from once_attachment)),
  'the durable viewed marker is recorded'
);

select * from finish();
rollback;
