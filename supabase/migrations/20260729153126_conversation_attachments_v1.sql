-- Forge Conversation Attachments V1
-- Private, participant-authorized photos/files with attachment-aware messages.

alter table public.messages
  alter column body drop not null,
  add column if not exists attachment_path text null,
  add column if not exists attachment_name text null,
  add column if not exists attachment_mime_type text null,
  add column if not exists attachment_size integer null;

alter table public.messages drop constraint if exists messages_body_length;
alter table public.messages drop constraint if exists messages_content_required;
alter table public.messages drop constraint if exists messages_attachment_complete;
alter table public.messages drop constraint if exists messages_attachment_size;

alter table public.messages
  add constraint messages_body_length check (
    body is null or char_length(body) <= 2000
  ),
  add constraint messages_content_required check (
    char_length(trim(coalesce(body, ''))) >= 1 or attachment_path is not null
  ),
  add constraint messages_attachment_complete check (
    (attachment_path is null and attachment_name is null and attachment_mime_type is null and attachment_size is null)
    or
    (attachment_path is not null and attachment_name is not null and attachment_mime_type is not null and attachment_size is not null)
  ),
  add constraint messages_attachment_size check (
    attachment_size is null or attachment_size between 1 and 10485760
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Conversation participants read attachments" on storage.objects;
drop policy if exists "Conversation participants upload own attachments" on storage.objects;
drop policy if exists "Attachment owners delete unsent attachments" on storage.objects;

create policy "Conversation participants read attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'message-attachments'
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.user_id = auth.uid()
      and cp.conversation_id::text = (storage.foldername(name))[1]
  )
);

create policy "Conversation participants upload own attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversation_participants cp
    join public.conversations c on c.id = cp.conversation_id
    join public.connections conn on conn.id = c.connection_id
    where cp.user_id = auth.uid()
      and cp.conversation_id::text = (storage.foldername(name))[1]
      and c.status = 'active'
      and not public.forge_users_blocked(conn.user_a_id, conn.user_b_id)
  )
);

create policy "Attachment owners delete unsent attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.user_id = auth.uid()
      and cp.conversation_id::text = (storage.foldername(name))[1]
  )
);

drop function if exists public.send_conversation_message(uuid, text, uuid, text, text, text, integer);
create function public.send_conversation_message(
  p_conversation_id uuid,
  p_body text,
  p_client_message_id uuid default null,
  p_attachment_path text default null,
  p_attachment_name text default null,
  p_attachment_mime_type text default null,
  p_attachment_size integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_uid uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_peer uuid;
  v_body text := nullif(trim(coalesce(p_body, '')), '');
  v_message public.messages%rowtype;
  v_actor_name text;
  v_has_attachment boolean := p_attachment_path is not null;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_conversation_id is null then
    return jsonb_build_object('ok', false, 'message', 'Conversation is required.');
  end if;
  if v_body is null and not v_has_attachment then
    return jsonb_build_object('ok', false, 'message', 'Add a message or attachment.');
  end if;
  if char_length(coalesce(v_body, '')) > 2000 then
    return jsonb_build_object('ok', false, 'message', 'Message is too long.');
  end if;
  if not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  select * into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if v_conversation.id is null or v_conversation.status <> 'active' then
    return jsonb_build_object('ok', false, 'message', 'This conversation is unavailable.');
  end if;

  select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end
  into v_peer
  from public.connections conn
  where conn.id = v_conversation.connection_id;

  if v_peer is null or public.forge_users_blocked(v_uid, v_peer) then
    return jsonb_build_object('ok', false, 'message', 'This conversation is unavailable.');
  end if;

  if v_has_attachment then
    if p_attachment_name is null
       or p_attachment_mime_type is null
       or p_attachment_size is null
       or p_attachment_size not between 1 and 10485760
       or p_attachment_mime_type not in (
         'image/jpeg', 'image/png', 'image/webp', 'image/gif',
         'application/pdf', 'text/plain', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       )
       or p_attachment_path not like p_conversation_id::text || '/' || v_uid::text || '/%'
       or not exists (
         select 1 from storage.objects o
         where o.bucket_id = 'message-attachments'
           and o.name = p_attachment_path
           and coalesce((o.metadata->>'size')::bigint, 0) = p_attachment_size
           and coalesce(o.metadata->>'mimetype', '') = p_attachment_mime_type
       ) then
      return jsonb_build_object('ok', false, 'message', 'Attachment could not be verified.');
    end if;
  elsif p_attachment_name is not null
     or p_attachment_mime_type is not null
     or p_attachment_size is not null then
    return jsonb_build_object('ok', false, 'message', 'Attachment is incomplete.');
  end if;

  if p_client_message_id is not null then
    select * into v_message
    from public.messages m
    where m.conversation_id = p_conversation_id
      and m.client_message_id = p_client_message_id
    limit 1;

    if v_message.id is not null then
      return jsonb_build_object(
        'ok', true,
        'message_id', v_message.id,
        'created_at', v_message.created_at,
        'body', coalesce(v_message.body, ''),
        'attachment_path', v_message.attachment_path,
        'attachment_name', v_message.attachment_name,
        'attachment_mime_type', v_message.attachment_mime_type,
        'attachment_size', v_message.attachment_size,
        'duplicate', true
      );
    end if;
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.messages (
    conversation_id, sender_id, body, client_message_id,
    attachment_path, attachment_name, attachment_mime_type, attachment_size
  )
  values (
    p_conversation_id, v_uid, v_body, p_client_message_id,
    p_attachment_path, p_attachment_name, p_attachment_mime_type, p_attachment_size
  )
  returning * into v_message;

  update public.conversations
  set last_message_at = v_message.created_at, updated_at = now()
  where id = p_conversation_id;

  update public.conversation_participants
  set last_read_at = v_message.created_at
  where conversation_id = p_conversation_id and user_id = v_uid;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);
  perform public.forge_create_notification(
    v_peer,
    v_uid,
    'new_message'::public.notification_type,
    coalesce(v_actor_name, 'Someone') || ' sent you a message.',
    'message'::public.notification_entity_type,
    v_message.id,
    '/connections/c/' || p_conversation_id::text
  );

  return jsonb_build_object(
    'ok', true,
    'message_id', v_message.id,
    'created_at', v_message.created_at,
    'body', coalesce(v_message.body, ''),
    'attachment_path', v_message.attachment_path,
    'attachment_name', v_message.attachment_name,
    'attachment_mime_type', v_message.attachment_mime_type,
    'attachment_size', v_message.attachment_size,
    'duplicate', false
  );
end;
$$;

revoke all on function public.send_conversation_message(uuid, text, uuid, text, text, text, integer)
  from public, anon;
grant execute on function public.send_conversation_message(uuid, text, uuid, text, text, text, integer)
  to authenticated;

create or replace function public.list_conversation_messages(
  p_conversation_id uuid,
  p_before timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 40
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 40), 100));
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_conversation_id is null
     or not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'messages', coalesce((
      select jsonb_agg(row_to_json(m)::jsonb order by m.created_at asc, m.id asc)
      from (
        select msg.id, msg.conversation_id, msg.sender_id, coalesce(msg.body, '') as body,
               msg.client_message_id, msg.created_at, msg.attachment_path,
               msg.attachment_name, msg.attachment_mime_type, msg.attachment_size
        from public.messages msg
        where msg.conversation_id = p_conversation_id
          and (
            p_before is null
            or msg.created_at < p_before
            or (msg.created_at = p_before and p_before_id is not null and msg.id < p_before_id)
          )
        order by msg.created_at desc, msg.id desc
        limit v_limit
      ) m
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_conversation_messages(uuid, timestamptz, uuid, integer)
  from public, anon;
grant execute on function public.list_conversation_messages(uuid, timestamptz, uuid, integer)
  to authenticated;

create or replace function public.list_my_conversations()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'conversations', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb order by x.sort_at desc nulls last)
      from (
        select c.id as conversation_id, c.connection_id, c.status, c.created_at,
          c.last_message_at, peer.id as peer_user_id,
          split_part(coalesce(dp.full_name, 'Member'), ' ', 1) as peer_first_name,
          dp.age as peer_age, dp.profile_photo_url as peer_photo_url,
          case
            when nullif(trim(coalesce(lm.body, '')), '') is not null then lm.body
            when lm.attachment_mime_type like 'image/%' then 'Photo'
            when lm.attachment_path is not null then 'Attachment'
            else null
          end as latest_message_body,
          lm.created_at as latest_message_at, lm.sender_id as latest_message_sender_id,
          case
            when lm.id is null or lm.sender_id = v_uid then false
            when cp.last_read_at is null or lm.created_at > cp.last_read_at then true
            else false
          end as unread,
          greatest(c.last_message_at, c.created_at) as sort_at
        from public.conversation_participants cp
        join public.conversations c on c.id = cp.conversation_id
        join public.connections conn on conn.id = c.connection_id
        join lateral (
          select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end as id
        ) peer on true
        left join public.discoverable_profiles dp on dp.id = peer.id
        left join lateral (
          select m.id, m.body, m.created_at, m.sender_id, m.attachment_path, m.attachment_mime_type
          from public.messages m
          where m.conversation_id = c.id
          order by m.created_at desc, m.id desc limit 1
        ) lm on true
        where cp.user_id = v_uid and not public.forge_users_blocked(v_uid, peer.id)
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_my_conversations() from public, anon;
grant execute on function public.list_my_conversations() to authenticated;
