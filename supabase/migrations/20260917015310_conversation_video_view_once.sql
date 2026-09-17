-- Server-enforced one-opening delivery for conversation video messages.
begin;

alter table public.message_attachments
  add column view_once boolean not null default false,
  add column viewed_at timestamptz;

alter table public.message_attachments
  add constraint message_attachments_view_once_video_only check (
    not view_once or mime_type in ('video/mp4', 'video/webm')
  ),
  add constraint message_attachments_viewed_once_only check (
    viewed_at is null or view_once
  );

comment on column public.message_attachments.view_once is
  'When true, member playback is available only through the atomic open_view_once_video RPC.';
comment on column public.message_attachments.viewed_at is
  'Time the recipient claimed the single member playback. The media remains server-accessible for safety reporting.';

create or replace function public.forge_storage_path_is_reusable_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1
    from public.message_attachments a
    where a.storage_path = p_path
      and not a.view_once
  );
$$;

revoke all on function public.forge_storage_path_is_reusable_attachment(text)
  from public, anon, authenticated;

drop policy if exists "Authorized participants read conversation history attachments" on storage.objects;
create policy "Authorized participants read reusable conversation attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and public.forge_can_access_conversation_history(
    ((storage.foldername(name))[1])::uuid,
    (select auth.uid())
  )
  and public.forge_storage_path_is_reusable_attachment(name)
);

create or replace function public.get_conversation_attachment_access(p_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_attachment public.message_attachments%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select * into v_attachment
  from public.message_attachments
  where id = p_attachment_id;

  if v_attachment.id is null
     or v_attachment.view_once
     or not public.forge_can_access_conversation_history(
       v_attachment.conversation_id,
       v_uid
     )
  then
    return jsonb_build_object('ok', false, 'message', 'Attachment is unavailable.');
  end if;

  return jsonb_build_object('ok', true, 'attachment', to_jsonb(v_attachment));
end;
$$;

revoke all on function public.get_conversation_attachment_access(uuid) from public, anon;
grant execute on function public.get_conversation_attachment_access(uuid) to authenticated;

create or replace function public.open_view_once_video(p_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_attachment public.message_attachments%rowtype;
  v_viewed_at timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select * into v_attachment
  from public.message_attachments
  where id = p_attachment_id
  for update;

  if v_attachment.id is null
     or not v_attachment.view_once
     or v_attachment.mime_type not in ('video/mp4', 'video/webm')
     or v_attachment.sender_id = v_uid
     or not public.forge_can_access_conversation_history(
       v_attachment.conversation_id,
       v_uid
     )
  then
    return jsonb_build_object('ok', false, 'message', 'Video is unavailable.');
  end if;

  if v_attachment.viewed_at is not null then
    return jsonb_build_object('ok', false, 'message', 'Video has already been viewed.');
  end if;

  v_viewed_at := clock_timestamp();
  update public.message_attachments
  set viewed_at = v_viewed_at
  where id = v_attachment.id;

  return jsonb_build_object(
    'ok', true,
    'attachment_id', v_attachment.id,
    'conversation_id', v_attachment.conversation_id,
    'storage_path', v_attachment.storage_path,
    'viewed_at', v_viewed_at
  );
end;
$$;

revoke all on function public.open_view_once_video(uuid) from public, anon;
grant execute on function public.open_view_once_video(uuid) to authenticated;

create or replace function public.list_conversation_messages(
  p_conversation_id uuid,
  p_before timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 40
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 40), 100));
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  if p_conversation_id is null
     or not public.forge_can_access_conversation_history(p_conversation_id, v_uid)
  then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'messages', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb order by x.created_at asc, x.id asc)
      from (
        select
          m.id, m.conversation_id, m.sender_id, m.body,
          m.client_message_id, m.created_at,
          coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', a.id,
                'storage_path', a.storage_path,
                'file_name', a.file_name,
                'mime_type', a.mime_type,
                'file_size', a.file_size,
                'attachment_kind', a.attachment_kind,
                'width', a.width,
                'height', a.height,
                'position', a.position,
                'view_once', a.view_once,
                'viewed_at', a.viewed_at
              )
              order by a.position, a.id
            )
            from public.message_attachments a
            where a.message_id = m.id
          ), '[]'::jsonb) as attachments
        from public.messages m
        where m.conversation_id = p_conversation_id
          and (
            p_before is null
            or m.created_at < p_before
            or (
              m.created_at = p_before
              and p_before_id is not null
              and m.id < p_before_id
            )
          )
        order by m.created_at desc, m.id desc
        limit v_limit
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_conversation_messages(
  uuid, timestamptz, uuid, integer
) from public, anon;
grant execute on function public.list_conversation_messages(
  uuid, timestamptz, uuid, integer
) to authenticated;

create or replace function public.send_conversation_message_with_attachments(
  p_conversation_id uuid,
  p_body text,
  p_client_message_id uuid default null,
  p_attachments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
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
    if (v_attachment->>'mime_type') like 'video/%' and not exists (
      select 1 from public.conversation_video_checks v join storage.objects o on o.id = v.object_id
      where o.bucket_id = 'conversation-attachments' and o.name = v_attachment->>'storage_path'
        and v.storage_path = o.name and v.sender_id = v_uid and o.owner_id = v_uid::text
        and v.mime_type = v_attachment->>'mime_type'
        and v.file_size = (v_attachment->>'file_size')::bigint
        and v.duration_seconds > 0 and v.duration_seconds <= 15
    ) then
      return jsonb_build_object('ok', false, 'message', 'Video must be inspected before sending.');
    end if;
    v_kind := case when (v_attachment->>'mime_type') like 'image/%' then 'photo' else 'file' end;
    if (v_attachment->>'storage_path') not like p_conversation_id::text || '/' || v_uid::text || '/%'
       or (v_attachment->>'storage_path') like '%..%'
       or char_length(coalesce(v_attachment->>'file_name', '')) not between 1 and 255
       or (v_attachment->>'file_name') ~ '[[:cntrl:]/\\]'
       or (v_attachment->>'mime_type') not in (
         'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'text/plain', 'video/mp4', 'video/webm'
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
      when v_count = 1 and (p_attachments->0->>'mime_type') like 'video/%' and char_length(v_body) = 0 then v_actor_name || ' sent you a video.'
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
$$;

revoke all on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb)
  from public, anon;
grant execute on function public.send_conversation_message_with_attachments(uuid, text, uuid, jsonb)
  to authenticated;

commit;
