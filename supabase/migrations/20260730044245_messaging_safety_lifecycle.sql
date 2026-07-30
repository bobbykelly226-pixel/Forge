-- Forge Messaging Safety Lifecycle
-- Ended conversations become mutual read-only history. Blocking is asymmetric:
-- the blocker retains the record, while the blocked member loses access.

alter table public.conversations
  add column if not exists ended_at timestamptz null,
  add column if not exists ended_by_user_id uuid null
    references auth.users (id) on delete set null;

comment on column public.conversations.ended_at is
  'When messaging became read-only because the connection ended or a participant blocked the other.';
comment on column public.conversations.ended_by_user_id is
  'Participant who ended the connection or initiated the block. Null for legacy/system-ended records.';

create or replace function public.forge_can_access_conversation_history(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.connections conn on conn.id = c.connection_id
    join public.conversation_participants cp
      on cp.conversation_id = c.id and cp.user_id = p_user_id
    cross join lateral (
      select case
        when conn.user_a_id = p_user_id then conn.user_b_id
        else conn.user_a_id
      end as peer_user_id
    ) peer
    where c.id = p_conversation_id
      and (
        not public.forge_users_blocked(p_user_id, peer.peer_user_id)
        or exists (
          select 1
          from public.user_blocks ub
          where ub.blocker_id = p_user_id
            and ub.blocked_id = peer.peer_user_id
        )
      )
  );
$$;

revoke all on function public.forge_can_access_conversation_history(uuid, uuid)
  from public, anon, authenticated;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select to authenticated
using (
  recipient_user_id = (select auth.uid())
  and (
    actor_user_id is null
    or not public.forge_users_blocked((select auth.uid()), actor_user_id)
  )
);

create or replace function public.list_my_notifications(p_limit integer default 40)
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

  return jsonb_build_object(
    'ok', true,
    'notifications', coalesce(
      (
        select jsonb_agg(row_to_json(x)::jsonb)
        from (
          select
            n.id,
            n.recipient_user_id,
            n.actor_user_id,
            n.notification_type,
            n.body,
            n.entity_type,
            n.entity_id,
            n.destination_path,
            n.read_at,
            n.created_at,
            case
              when n.actor_user_id is null then null
              else public.forge_notification_actor_first_name(n.actor_user_id)
            end as actor_first_name,
            (
              select p.profile_photo_url
              from public.profiles p
              where p.id = n.actor_user_id
            ) as actor_photo_url
          from public.notifications n
          where n.recipient_user_id = v_uid
            and (
              n.actor_user_id is null
              or not public.forge_users_blocked(v_uid, n.actor_user_id)
            )
          order by n.created_at desc
          limit v_limit
        ) x
      ),
      '[]'::jsonb
    ),
    'unread_count', (
      select count(*)::int
      from public.notifications n
      where n.recipient_user_id = v_uid
        and n.read_at is null
        and (
          n.actor_user_id is null
          or not public.forge_users_blocked(v_uid, n.actor_user_id)
        )
    )
  );
end;
$$;

revoke all on function public.list_my_notifications(integer) from public, anon;
grant execute on function public.list_my_notifications(integer) to authenticated;

drop policy if exists "Participants read conversations" on public.conversations;
create policy "Authorized participants read conversation history"
on public.conversations for select to authenticated
using (public.forge_can_access_conversation_history(id, (select auth.uid())));

drop policy if exists "Participants read membership" on public.conversation_participants;
create policy "Authorized participants read conversation membership"
on public.conversation_participants for select to authenticated
using (
  public.forge_can_access_conversation_history(conversation_id, (select auth.uid()))
);

drop policy if exists "Participants update own membership" on public.conversation_participants;
create policy "Authorized participants update own read state"
on public.conversation_participants for update to authenticated
using (
  user_id = (select auth.uid())
  and public.forge_can_access_conversation_history(conversation_id, (select auth.uid()))
)
with check (
  user_id = (select auth.uid())
  and public.forge_can_access_conversation_history(conversation_id, (select auth.uid()))
);

drop policy if exists "Participants read messages" on public.messages;
create policy "Authorized participants read conversation messages"
on public.messages for select to authenticated
using (
  public.forge_can_access_conversation_history(conversation_id, (select auth.uid()))
);

drop policy if exists "Active participants read conversation attachments" on storage.objects;
create policy "Authorized participants read conversation history attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and public.forge_can_access_conversation_history(
    ((storage.foldername(name))[1])::uuid,
    (select auth.uid())
  )
);

drop policy if exists "Senders delete unsent conversation attachments" on storage.objects;
create policy "Senders delete their unsent conversation attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id::text = (storage.foldername(name))[1]
      and cp.user_id = (select auth.uid())
  )
  and not exists (
    select 1
    from public.message_attachments a
    where a.storage_path = name
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;

create or replace function public.get_conversation_attachment_access(p_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
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
                'position', a.position
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

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_read_at timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  if p_conversation_id is null
     or not public.forge_can_access_conversation_history(p_conversation_id, v_uid)
  then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  update public.conversation_participants
  set last_read_at = v_read_at
  where conversation_id = p_conversation_id and user_id = v_uid;

  return jsonb_build_object('ok', true, 'read_at', v_read_at);
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.end_connection(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conn public.connections%rowtype;
  v_ended_at timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  select * into v_conn
  from public.connections c
  where c.id = p_connection_id
    and (c.user_a_id = v_uid or c.user_b_id = v_uid)
  limit 1;

  if v_conn.id is null then
    return jsonb_build_object('ok', false, 'message', 'Connection not found.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  update public.connections
  set status = 'ended', updated_at = v_ended_at
  where id = v_conn.id and status = 'active';

  update public.conversations
  set
    status = 'ended',
    ended_at = coalesce(ended_at, v_ended_at),
    ended_by_user_id = coalesce(ended_by_user_id, v_uid),
    updated_at = v_ended_at
  where connection_id = v_conn.id and status = 'active';

  return jsonb_build_object(
    'ok', true,
    'ended', true,
    'connection_id', v_conn.id,
    'ended_at', v_ended_at
  );
end;
$$;

revoke all on function public.end_connection(uuid) from public, anon;
grant execute on function public.end_connection(uuid) to authenticated;

create or replace function public.block_user(p_blocked_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_ended_at timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot block yourself.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_uid, p_blocked_user_id)
  on conflict (blocker_id, blocked_id) do nothing;

  select o.user_a_id, o.user_b_id
  into v_a, v_b
  from public.forge_order_pair(v_uid, p_blocked_user_id) o;

  update public.connections
  set status = 'ended', updated_at = v_ended_at
  where user_a_id = v_a and user_b_id = v_b and status = 'active';

  update public.conversations c
  set
    status = 'ended',
    ended_at = coalesce(c.ended_at, v_ended_at),
    ended_by_user_id = coalesce(c.ended_by_user_id, v_uid),
    updated_at = v_ended_at
  from public.connections conn
  where c.connection_id = conn.id
    and conn.user_a_id = v_a
    and conn.user_b_id = v_b
    and c.status = 'active';

  return jsonb_build_object(
    'ok', true,
    'blocked', true,
    'ended_at', v_ended_at
  );
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

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
        select
          c.id as conversation_id,
          c.connection_id,
          c.status,
          c.created_at,
          c.last_message_at,
          c.ended_at,
          c.ended_by_user_id = v_uid as ended_by_viewer,
          blocks.blocked_by_viewer,
          peer.id as peer_user_id,
          split_part(coalesce(p.full_name, 'Member'), ' ', 1) as peer_first_name,
          p.age as peer_age,
          p.profile_photo_url as peer_photo_url,
          case
            when nullif(trim(coalesce(lm.body, '')), '') is not null then lm.body
            when lm.attachment_kind = 'photo' then 'Photo'
            when lm.attachment_kind = 'file' then 'Attachment'
            else null
          end as latest_message_body,
          lm.created_at as latest_message_at,
          lm.sender_id as latest_message_sender_id,
          case
            when c.status = 'ended' or lm.id is null or lm.sender_id = v_uid then false
            when cp.last_read_at is null or lm.created_at > cp.last_read_at then true
            else false
          end as unread,
          greatest(c.last_message_at, c.ended_at, c.created_at) as sort_at
        from public.conversation_participants cp
        join public.conversations c on c.id = cp.conversation_id
        join public.connections conn on conn.id = c.connection_id
        join lateral (
          select case
            when conn.user_a_id = v_uid then conn.user_b_id
            else conn.user_a_id
          end as id
        ) peer on true
        left join public.profiles p on p.id = peer.id
        cross join lateral (
          select
            exists (
              select 1 from public.user_blocks ub
              where ub.blocker_id = v_uid and ub.blocked_id = peer.id
            ) as blocked_by_viewer,
            exists (
              select 1 from public.user_blocks ub
              where ub.blocker_id = peer.id and ub.blocked_id = v_uid
            ) as blocked_viewer
        ) blocks
        left join lateral (
          select
            m.id, m.body, m.created_at, m.sender_id,
            (
              select a.attachment_kind
              from public.message_attachments a
              where a.message_id = m.id
              order by a.position
              limit 1
            ) as attachment_kind
          from public.messages m
          where m.conversation_id = c.id
          order by m.created_at desc, m.id desc
          limit 1
        ) lm on true
        where cp.user_id = v_uid
          and not blocks.blocked_viewer
          and (
            not public.forge_users_blocked(v_uid, peer.id)
            or blocks.blocked_by_viewer
          )
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_my_conversations() from public, anon;
grant execute on function public.list_my_conversations() to authenticated;

create or replace function public.get_conversation_thread_meta(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  if p_conversation_id is null
     or not public.forge_can_access_conversation_history(p_conversation_id, v_uid)
  then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  select
    c.id as conversation_id,
    c.connection_id,
    c.status,
    c.created_at,
    c.last_message_at,
    c.ended_at,
    c.ended_by_user_id = v_uid as ended_by_viewer,
    peer.id as peer_user_id,
    split_part(coalesce(p.full_name, 'Member'), ' ', 1) as peer_first_name,
    p.full_name as peer_full_name,
    p.age as peer_age,
    p.profile_photo_url as peer_photo_url,
    public.forge_users_blocked(v_uid, peer.id) as is_blocked,
    exists (
      select 1 from public.user_blocks ub
      where ub.blocker_id = v_uid and ub.blocked_id = peer.id
    ) as blocked_by_viewer
  into v_row
  from public.conversations c
  join public.connections conn on conn.id = c.connection_id
  join lateral (
    select case
      when conn.user_a_id = v_uid then conn.user_b_id
      else conn.user_a_id
    end as id
  ) peer on true
  left join public.profiles p on p.id = peer.id
  where c.id = p_conversation_id;

  if v_row.conversation_id is null then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'conversation', row_to_json(v_row)::jsonb
  );
end;
$$;

revoke all on function public.get_conversation_thread_meta(uuid) from public, anon;
grant execute on function public.get_conversation_thread_meta(uuid) to authenticated;

