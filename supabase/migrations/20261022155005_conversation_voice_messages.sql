-- Recorded voice replaces new video sends. Historical videos and safety evidence remain intact.
begin;

create table public.conversation_voice_checks (
  object_id uuid primary key references storage.objects(id) on delete cascade,
  storage_path text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  file_size bigint not null check (file_size between 1 and 10485760),
  mime_type text not null check (mime_type in ('audio/mp4', 'audio/webm')),
  duration_seconds double precision not null check (duration_seconds > 0 and duration_seconds <= 60),
  created_at timestamptz not null default now()
);
create index conversation_voice_checks_sender_idx on public.conversation_voice_checks(sender_id);
alter table public.conversation_voice_checks enable row level security;
revoke all on public.conversation_voice_checks from public, anon, authenticated;
grant select, insert, update, delete on public.conversation_voice_checks to service_role;
comment on table public.conversation_voice_checks is 'Server-only audio inspections bound to immutable private storage object identities.';

alter table public.message_attachments drop constraint message_attachments_mime_type_check;
alter table public.message_attachments add constraint message_attachments_mime_type_check check (
  mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/webm', 'audio/mp4', 'audio/webm')
);
alter table public.reported_video_evidence drop constraint reported_video_evidence_mime_type_check;
alter table public.reported_video_evidence add constraint reported_video_evidence_mime_type_check check (
  mime_type in ('video/mp4', 'video/webm', 'audio/mp4', 'audio/webm')
);
-- Preserve existing bucket permissions and historical media types.
update storage.buckets set allowed_mime_types = array(
  select distinct unnest(allowed_mime_types || array['audio/mp4', 'audio/webm'])
) where id in ('conversation-attachments', 'reported-video-evidence');

CREATE OR REPLACE FUNCTION public.get_voice_upload_for_validation(p_conversation_id uuid, p_path text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
declare v_uid uuid := auth.uid(); v_result jsonb;
begin
 if v_uid is null or p_path not like p_conversation_id::text || '/' || v_uid::text || '/%'
   or not public.forge_can_access_conversation_attachments(p_conversation_id, v_uid)
 then return null; end if;
 select jsonb_build_object('object_id', o.id, 'file_size', (o.metadata->>'size')::bigint, 'mime_type', o.metadata->>'mimetype')
 into v_result from storage.objects o where o.bucket_id = 'conversation-attachments'
 and o.name = p_path and o.owner_id = v_uid::text;
 return v_result;
end; $function$
;
revoke all on function public.get_voice_upload_for_validation(uuid, text) from public, anon;
grant execute on function public.get_voice_upload_for_validation(uuid, text) to authenticated;

CREATE OR REPLACE FUNCTION public.send_conversation_message_with_attachments(p_conversation_id uuid, p_body text, p_client_message_id uuid DEFAULT NULL::uuid, p_attachments jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_peer uuid;
  v_body text := trim(coalesce(p_body, ''));
  v_message public.messages%rowtype;
  v_attachment jsonb;
  v_count integer;
  v_position smallint;
  v_kind text;
  v_view_once boolean;
  v_actor_name text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object('ok', false, 'message', 'Attachments are invalid.');
  end if;
  v_count := jsonb_array_length(coalesce(p_attachments, '[]'::jsonb));
  if char_length(v_body) < 1 and v_count < 1 then
    return jsonb_build_object('ok', false, 'message', 'Add a message or attachment.');
  end if;
  if char_length(v_body) > 2000 or v_count > 4 then
    return jsonb_build_object('ok', false, 'message', 'Message or attachment limit exceeded.');
  end if;
  if not public.forge_can_access_conversation_attachments(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  if p_client_message_id is not null then
    select * into v_message from public.messages
    where conversation_id = p_conversation_id and client_message_id = p_client_message_id;
    if v_message.id is not null then
      return jsonb_build_object(
        'ok', true, 'message_id', v_message.id, 'created_at', v_message.created_at,
        'body', v_message.body, 'attachments', coalesce((
          select jsonb_agg(to_jsonb(a) order by a.position, a.id)
          from public.message_attachments a where a.message_id = v_message.id
        ), '[]'::jsonb), 'duplicate', true
      );
    end if;
  end if;

  for v_attachment in select value from jsonb_array_elements(p_attachments)
  loop
    if v_attachment ? 'view_once'
       and coalesce(v_attachment->>'view_once', '') not in ('true', 'false')
    then
      return jsonb_build_object('ok', false, 'message', 'Video delivery choice is invalid.');
    end if;
    v_view_once := coalesce((v_attachment->>'view_once')::boolean, false);
    if v_view_once and (v_attachment->>'mime_type') not in ('video/mp4', 'video/webm') then
      return jsonb_build_object('ok', false, 'message', 'Only videos can be sent as View Once.');
    end if;
    if (v_attachment->>'mime_type') like 'video/%' then
      return jsonb_build_object('ok', false, 'message', 'Video messages are reserved for a future Premium release.');
    end if;
    if (v_attachment->>'mime_type') like 'audio/%' and not exists (
      select 1 from public.conversation_voice_checks v join storage.objects o on o.id = v.object_id
      where o.bucket_id = 'conversation-attachments' and o.name = v_attachment->>'storage_path'
        and v.storage_path = o.name and v.sender_id = v_uid and o.owner_id = v_uid::text
        and v.mime_type = v_attachment->>'mime_type'
        and v.file_size = (v_attachment->>'file_size')::bigint
        and v.duration_seconds > 0 and v.duration_seconds <= 60
    ) then
      return jsonb_build_object('ok', false, 'message', 'Voice message must be inspected before sending.');
    end if;
    v_kind := case when (v_attachment->>'mime_type') like 'image/%' then 'photo' else 'file' end;
    if (v_attachment->>'storage_path') not like p_conversation_id::text || '/' || v_uid::text || '/%'
       or (v_attachment->>'storage_path') like '%..%'
       or char_length(coalesce(v_attachment->>'file_name', '')) not between 1 and 255
       or (v_attachment->>'file_name') ~ '[[:cntrl:]/\\]'
       or (v_attachment->>'mime_type') not in (
         'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'text/plain', 'audio/mp4', 'audio/webm'
       )
       or (v_attachment->>'file_size')::bigint not between 1 and 10485760
       or (v_kind = 'photo' and (
         (v_attachment->>'width')::integer not between 1 and 12000
         or (v_attachment->>'height')::integer not between 1 and 12000
       ))
       or not exists (
         select 1 from storage.objects o
         where o.bucket_id = 'conversation-attachments'
           and o.name = v_attachment->>'storage_path'
           and o.owner_id = v_uid::text
           and o.metadata->>'mimetype' = v_attachment->>'mime_type'
           and o.metadata->>'size' = v_attachment->>'file_size'
       )
    then
      return jsonb_build_object('ok', false, 'message', 'One or more uploads could not be verified.');
    end if;
  end loop;

  select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end
  into v_peer
  from public.conversations c join public.connections conn on conn.id = c.connection_id
  where c.id = p_conversation_id;

  perform set_config('forge.allow_system_writes', 'on', true);
  insert into public.messages (conversation_id, sender_id, body, client_message_id)
  values (p_conversation_id, v_uid, v_body, p_client_message_id)
  returning * into v_message;

  for v_attachment, v_position in
    select value, (ordinality - 1)::smallint
    from jsonb_array_elements(p_attachments) with ordinality
  loop
    v_kind := case when (v_attachment->>'mime_type') like 'image/%' then 'photo' else 'file' end;
    v_view_once := coalesce((v_attachment->>'view_once')::boolean, false);
    insert into public.message_attachments (
      message_id, conversation_id, sender_id, storage_path, file_name, mime_type,
      file_size, attachment_kind, width, height, position, view_once
    ) values (
      v_message.id, p_conversation_id, v_uid, v_attachment->>'storage_path',
      v_attachment->>'file_name', v_attachment->>'mime_type',
      (v_attachment->>'file_size')::bigint, v_kind,
      nullif(v_attachment->>'width', '')::integer,
      nullif(v_attachment->>'height', '')::integer, v_position, v_view_once
    );
  end loop;

  update public.conversations
  set last_message_at = v_message.created_at, updated_at = now()
  where id = p_conversation_id;
  update public.conversation_participants
  set last_read_at = v_message.created_at
  where conversation_id = p_conversation_id and user_id = v_uid;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);
  perform public.forge_create_notification(
    v_peer, v_uid, 'new_message'::public.notification_type,
    case
      when v_count = 1 and (p_attachments->0->>'mime_type') like 'audio/%' and char_length(v_body) = 0 then v_actor_name || ' sent you a voice message.'
      when v_count = 1 and (p_attachments->0->>'mime_type') like 'image/%'
        and char_length(v_body) = 0 then v_actor_name || ' sent you a photo.'
      when v_count > 0 and char_length(v_body) = 0 then v_actor_name || ' sent you a file.'
      else v_actor_name || ' sent you a message.'
    end,
    'message'::public.notification_entity_type, v_message.id,
    '/connections/c/' || p_conversation_id::text
  );

  return jsonb_build_object(
    'ok', true, 'message_id', v_message.id, 'created_at', v_message.created_at,
    'body', v_message.body, 'attachments', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.position, a.id)
      from public.message_attachments a where a.message_id = v_message.id
    ), '[]'::jsonb), 'duplicate', false
  );
end;
$function$
;
revoke all on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb) from public, anon;
grant execute on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb) to authenticated;

commit;
