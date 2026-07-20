-- Forge Notifications & Conversation Polish V1
-- Durable in-app notifications. Conversation unread remains on
-- conversation_participants.last_read_at (unchanged).
-- Client inserts denied; trusted RPCs call forge_create_notification.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.notification_type as enum (
    'new_message',
    'mutual_connection',
    'open_to_chat_accepted',
    'interest_received'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_entity_type as enum (
    'message',
    'conversation',
    'connection',
    'open_to_chat_request',
    'interest'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  actor_user_id uuid null references auth.users (id) on delete set null,
  notification_type public.notification_type not null,
  body text not null,
  entity_type public.notification_entity_type not null,
  entity_id uuid not null,
  destination_path text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint notifications_body_nonempty check (char_length(trim(body)) > 0),
  constraint notifications_destination_nonempty check (char_length(trim(destination_path)) > 0)
);

comment on table public.notifications is
  'In-app notifications. Inserts only via forge_create_notification from trusted RPCs.';

-- Deduplicate the same logical event for a recipient.
do $$ begin
  alter table public.notifications
    add constraint notifications_dedupe_uidx
    unique (recipient_user_id, notification_type, entity_type, entity_id);
exception when duplicate_object then null;
end $$;

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

-- Recipients may read their own rows.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (recipient_user_id = auth.uid());

-- No direct client writes. Mark-read goes through security definer RPCs.
drop policy if exists notifications_update_own on public.notifications;
revoke insert, update, delete on public.notifications from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3. forge_create_notification — trusted insert helper
-- ---------------------------------------------------------------------------
create or replace function public.forge_create_notification(
  p_recipient_user_id uuid,
  p_actor_user_id uuid,
  p_notification_type public.notification_type,
  p_body text,
  p_entity_type public.notification_entity_type,
  p_entity_id uuid,
  p_destination_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_body text := trim(coalesce(p_body, ''));
  v_dest text := trim(coalesce(p_destination_path, ''));
begin
  if p_recipient_user_id is null then
    return null;
  end if;
  -- Never notify the actor about their own action.
  if p_actor_user_id is not null and p_actor_user_id = p_recipient_user_id then
    return null;
  end if;
  if p_entity_id is null or p_notification_type is null or p_entity_type is null then
    return null;
  end if;
  if char_length(v_body) < 1 or char_length(v_dest) < 1 then
    return null;
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    notification_type,
    body,
    entity_type,
    entity_id,
    destination_path
  )
  values (
    p_recipient_user_id,
    p_actor_user_id,
    p_notification_type,
    v_body,
    p_entity_type,
    p_entity_id,
    v_dest
  )
  on conflict (recipient_user_id, notification_type, entity_type, entity_id)
  do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.forge_create_notification(
  uuid, uuid, public.notification_type, text, public.notification_entity_type, uuid, text
) from public, anon, authenticated;

comment on function public.forge_create_notification is
  'Trusted notification insert. Not granted to clients; called from other security definer RPCs.';

-- ---------------------------------------------------------------------------
-- 4. Actor first-name helper
-- ---------------------------------------------------------------------------
create or replace function public.forge_notification_actor_first_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim(split_part(coalesce(p.full_name, ''), ' ', 1)), ''),
    'Someone'
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.forge_notification_actor_first_name(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Client RPCs — list / mark read
-- ---------------------------------------------------------------------------
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
    )
  );
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_read_at timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_notification_id is null then
    return jsonb_build_object('ok', false, 'message', 'Notification is required.');
  end if;

  update public.notifications n
  set read_at = coalesce(n.read_at, now())
  where n.id = p_notification_id
    and n.recipient_user_id = v_uid
  returning n.read_at into v_read_at;

  if v_read_at is null then
    return jsonb_build_object('ok', false, 'message', 'Notification not found.');
  end if;

  return jsonb_build_object('ok', true, 'read_at', v_read_at);
end;
$$;

create or replace function public.mark_all_notifications_read()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;

  update public.notifications n
  set read_at = now()
  where n.recipient_user_id = v_uid
    and n.read_at is null;

  get diagnostics v_count = row_count;

  return jsonb_build_object('ok', true, 'updated', v_count);
end;
$$;

revoke all on function public.list_my_notifications(integer) from public, anon;
revoke all on function public.mark_notification_read(uuid) from public, anon;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.list_my_notifications(integer) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Patch send_conversation_message — notify peer
-- ---------------------------------------------------------------------------
create or replace function public.send_conversation_message(
  p_conversation_id uuid,
  p_body text,
  p_client_message_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_peer uuid;
  v_body text := trim(coalesce(p_body, ''));
  v_message public.messages%rowtype;
  v_actor_name text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_conversation_id is null then
    return jsonb_build_object('ok', false, 'message', 'Conversation is required.');
  end if;
  if char_length(v_body) < 1 then
    return jsonb_build_object('ok', false, 'message', 'Message cannot be empty.');
  end if;
  if char_length(v_body) > 2000 then
    return jsonb_build_object('ok', false, 'message', 'Message is too long.');
  end if;

  if not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  select * into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if v_conversation.id is null then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  if v_conversation.status <> 'active' then
    return jsonb_build_object('ok', false, 'message', 'This conversation has ended.');
  end if;

  select case
    when conn.user_a_id = v_uid then conn.user_b_id
    else conn.user_a_id
  end into v_peer
  from public.connections conn
  where conn.id = v_conversation.connection_id;

  if v_peer is null or public.forge_users_blocked(v_uid, v_peer) then
    return jsonb_build_object('ok', false, 'message', 'This conversation is unavailable.');
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
        'duplicate', true
      );
    end if;
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.messages (conversation_id, sender_id, body, client_message_id)
  values (p_conversation_id, v_uid, v_body, p_client_message_id)
  returning * into v_message;

  update public.conversations
  set last_message_at = v_message.created_at,
      updated_at = now()
  where id = p_conversation_id;

  update public.conversation_participants
  set last_read_at = v_message.created_at
  where conversation_id = p_conversation_id
    and user_id = v_uid;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);
  perform public.forge_create_notification(
    v_peer,
    v_uid,
    'new_message'::public.notification_type,
    v_actor_name || ' sent you a message.',
    'message'::public.notification_entity_type,
    v_message.id,
    '/connections/c/' || p_conversation_id::text
  );

  return jsonb_build_object(
    'ok', true,
    'message_id', v_message.id,
    'created_at', v_message.created_at,
    'body', v_message.body,
    'duplicate', false
  );
end;
$$;

revoke all on function public.send_conversation_message(uuid, text, uuid) from public, anon;
grant execute on function public.send_conversation_message(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Patch send_interest — interest_received or mutual_connection
-- ---------------------------------------------------------------------------
create or replace function public.send_interest(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reciprocal uuid;
  v_connection_id uuid;
  v_mutual boolean := false;
  v_interest_id uuid;
  v_actor_name text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot express interest in yourself.');
  end if;
  if public.forge_users_blocked(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.interests (sender_id, recipient_id, status)
  values (v_uid, p_recipient_id, 'pending')
  on conflict (sender_id, recipient_id) do nothing
  returning id into v_interest_id;

  if v_interest_id is null then
    select i.id into v_interest_id
    from public.interests i
    where i.sender_id = v_uid
      and i.recipient_id = p_recipient_id
    limit 1;
  end if;

  select i.id into v_reciprocal
  from public.interests i
  where i.sender_id = p_recipient_id
    and i.recipient_id = v_uid
    and i.status in ('pending', 'mutual')
  limit 1;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);

  if v_reciprocal is not null then
    update public.interests
    set status = 'mutual', updated_at = now()
    where (sender_id = v_uid and recipient_id = p_recipient_id)
       or (sender_id = p_recipient_id and recipient_id = v_uid);

    v_connection_id := public.forge_ensure_connection(
      v_uid, p_recipient_id, 'mutual_interest'::public.connection_source
    );
    v_mutual := true;

    -- Notify the peer only (actor already sees the mutual UI).
    perform public.forge_create_notification(
      p_recipient_id,
      v_uid,
      'mutual_connection'::public.notification_type,
      'You and ' || v_actor_name || ' are now connected.',
      'connection'::public.notification_entity_type,
      v_connection_id,
      '/discovery/profile/' || v_uid::text
    );
  else
    -- Incoming interest is already visible in Connections; notify recipient.
    if v_interest_id is not null then
      perform public.forge_create_notification(
        p_recipient_id,
        v_uid,
        'interest_received'::public.notification_type,
        v_actor_name || ' is interested in connecting.',
        'interest'::public.notification_entity_type,
        v_interest_id,
        '/connections'
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'interested', true,
    'mutual', v_mutual,
    'connection_id', v_connection_id
  );
end;
$$;

revoke all on function public.send_interest(uuid) from public, anon;
grant execute on function public.send_interest(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Patch respond_open_to_chat — notify original sender on accept
-- ---------------------------------------------------------------------------
create or replace function public.respond_open_to_chat(
  p_request_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.open_to_chat_requests%rowtype;
  v_connection_id uuid;
  v_action text := lower(trim(p_action));
  v_actor_name text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.open_to_chat_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if v_req.recipient_id <> v_uid then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if v_req.status not in ('pending', 'deferred') then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if public.forge_users_blocked(v_uid, v_req.sender_id) then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  if v_action = 'accept' then
    update public.open_to_chat_requests
    set status = 'accepted', responded_at = now(), updated_at = now()
    where id = p_request_id;

    v_connection_id := public.forge_ensure_connection(
      v_uid, v_req.sender_id, 'open_to_chat'::public.connection_source
    );

    v_actor_name := public.forge_notification_actor_first_name(v_uid);
    perform public.forge_create_notification(
      v_req.sender_id,
      v_uid,
      'open_to_chat_accepted'::public.notification_type,
      v_actor_name || ' accepted your invitation to chat.',
      'open_to_chat_request'::public.notification_entity_type,
      p_request_id,
      '/connections?tab=mutual'
    );

    return jsonb_build_object(
      'ok', true,
      'status', 'accepted',
      'connection_id', v_connection_id,
      'message', 'You''re connected.'
    );
  elsif v_action = 'defer' or v_action = 'not_right_now' then
    update public.open_to_chat_requests
    set status = 'deferred', responded_at = now(), updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'deferred',
      'message', 'Saved for later. The sender was not notified.'
    );
  elsif v_action = 'decline' then
    update public.open_to_chat_requests
    set status = 'declined', responded_at = now(), updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'declined',
      'message', 'Request removed. The sender was not notified.'
    );
  else
    return jsonb_build_object('ok', false, 'message', 'Unknown action.');
  end if;
end;
$$;

revoke all on function public.respond_open_to_chat(uuid, text) from public, anon;
grant execute on function public.respond_open_to_chat(uuid, text) to authenticated;
