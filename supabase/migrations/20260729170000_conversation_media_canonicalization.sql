-- Remove the unused duplicate attachment path from conversation_attachments_v1.
-- The canonical message_attachments relation and conversation-attachments bucket remain.

update public.messages set body = coalesce(body, '');

alter table public.messages
  drop constraint if exists messages_content_required,
  drop constraint if exists messages_attachment_complete,
  drop constraint if exists messages_attachment_size,
  drop constraint if exists messages_body_length,
  drop column if exists attachment_path,
  drop column if exists attachment_name,
  drop column if exists attachment_mime_type,
  drop column if exists attachment_size,
  alter column body set not null;

alter table public.messages
  add constraint messages_body_length check (char_length(body) <= 2000);

drop function if exists public.send_conversation_message(
  uuid, text, uuid, text, text, text, integer
);

drop policy if exists "Conversation participants read attachments" on storage.objects;
drop policy if exists "Conversation participants upload own attachments" on storage.objects;
drop policy if exists "Attachment owners delete unsent attachments" on storage.objects;

-- The empty duplicate bucket is left inert because Supabase requires bucket
-- deletion through the Storage API. No policies or application code reference it.

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
      select jsonb_agg(row_to_json(x)::jsonb order by x.created_at asc, x.id asc)
      from (
        select m.id, m.conversation_id, m.sender_id, m.body, m.client_message_id,
          m.created_at,
          coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', a.id, 'storage_path', a.storage_path, 'file_name', a.file_name,
                'mime_type', a.mime_type, 'file_size', a.file_size,
                'attachment_kind', a.attachment_kind, 'width', a.width,
                'height', a.height, 'position', a.position
              ) order by a.position, a.id
            )
            from public.message_attachments a where a.message_id = m.id
          ), '[]'::jsonb) as attachments
        from public.messages m
        where m.conversation_id = p_conversation_id
          and (
            p_before is null or m.created_at < p_before
            or (m.created_at = p_before and p_before_id is not null and m.id < p_before_id)
          )
        order by m.created_at desc, m.id desc limit v_limit
      ) x
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
declare v_uid uuid := auth.uid();
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
            when lm.attachment_kind = 'photo' then 'Photo'
            when lm.attachment_kind = 'file' then 'Attachment'
            else null
          end as latest_message_body,
          lm.created_at as latest_message_at, lm.sender_id as latest_message_sender_id,
          case
            when lm.id is null or lm.sender_id = v_uid then false
            when cp.last_read_at is null or lm.created_at > cp.last_read_at then true
            else false
          end as unread, greatest(c.last_message_at, c.created_at) as sort_at
        from public.conversation_participants cp
        join public.conversations c on c.id = cp.conversation_id
        join public.connections conn on conn.id = c.connection_id
        join lateral (
          select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end as id
        ) peer on true
        left join public.discoverable_profiles dp on dp.id = peer.id
        left join lateral (
          select m.id, m.body, m.created_at, m.sender_id,
            (select a.attachment_kind from public.message_attachments a
             where a.message_id = m.id order by a.position limit 1) as attachment_kind
          from public.messages m where m.conversation_id = c.id
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
