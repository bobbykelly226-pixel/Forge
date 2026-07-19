-- Forge Conversation Experience V1
-- Conversations, participants, messages, reports + RPCs/RLS.
-- Attaches to existing connections / user_blocks. No Confidence metrics.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.conversation_status as enum ('active', 'ended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_reason as enum (
    'unwanted_behavior',
    'harassment',
    'fake_profile',
    'inappropriate_content',
    'safety_concern',
    'other'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. conversations — one per connection
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  status public.conversation_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz null,
  constraint conversations_connection_unique unique (connection_id)
);

comment on table public.conversations is
  'One conversation thread per mutual connection. Client inserts denied; use ensure_conversation_for_connection.';

create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc nulls last);

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

alter table public.conversations enable row level security;

-- ---------------------------------------------------------------------------
-- 3. conversation_participants — relational membership + unread
-- ---------------------------------------------------------------------------
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz null,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

comment on table public.conversation_participants is
  'Membership for conversation access and unread state. Client inserts denied.';

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

alter table public.conversation_participants enable row level security;

-- ---------------------------------------------------------------------------
-- 4. messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  client_message_id uuid null,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (
    char_length(body) >= 1 and char_length(body) <= 2000
  )
);

comment on table public.messages is
  'Conversation messages. Prefer send_conversation_message RPC. Sender must match auth.uid().';

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at desc, id desc);

create unique index if not exists messages_conversation_client_message_id_uidx
  on public.messages (conversation_id, client_message_id)
  where client_message_id is not null;

alter table public.messages enable row level security;

-- ---------------------------------------------------------------------------
-- 5. user_reports
-- ---------------------------------------------------------------------------
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid null references public.conversations (id) on delete set null,
  reason public.report_reason not null,
  details text null,
  created_at timestamptz not null default now(),
  constraint user_reports_no_self check (reporter_id <> reported_user_id),
  constraint user_reports_details_length check (
    details is null or char_length(details) <= 1000
  )
);

comment on table public.user_reports is
  'User-submitted safety reports. Reporter insert/select only. No auto-block.';

create index if not exists user_reports_reporter_id_idx on public.user_reports (reporter_id);
create index if not exists user_reports_reported_user_id_idx on public.user_reports (reported_user_id);

alter table public.user_reports enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Helper: is participant
-- ---------------------------------------------------------------------------
create or replace function public.forge_is_conversation_participant(
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
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

revoke all on function public.forge_is_conversation_participant(uuid, uuid) from public, anon;
grant execute on function public.forge_is_conversation_participant(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------
drop policy if exists "Participants read conversations" on public.conversations;
create policy "Participants read conversations"
on public.conversations for select to authenticated
using (public.forge_is_conversation_participant(id, auth.uid()));

grant select on public.conversations to authenticated;
revoke insert, update, delete on table public.conversations from authenticated, anon;

drop policy if exists "Participants read membership" on public.conversation_participants;
create policy "Participants read membership"
on public.conversation_participants for select to authenticated
using (
  user_id = auth.uid()
  or public.forge_is_conversation_participant(conversation_id, auth.uid())
);

-- Participants may update only their own last_read_at (via RPC preferred).
drop policy if exists "Participants update own membership" on public.conversation_participants;
create policy "Participants update own membership"
on public.conversation_participants for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, update on public.conversation_participants to authenticated;
revoke insert, delete on table public.conversation_participants from authenticated, anon;

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages"
on public.messages for select to authenticated
using (public.forge_is_conversation_participant(conversation_id, auth.uid()));

-- Direct inserts allowed only when sender is self and an active participant of an active conversation.
drop policy if exists "Participants insert own messages" on public.messages;
create policy "Participants insert own messages"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.forge_is_conversation_participant(conversation_id, auth.uid())
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and c.status = 'active'
  )
);

grant select, insert on public.messages to authenticated;
revoke update, delete on table public.messages from authenticated, anon;

drop policy if exists "Reporters manage reports select" on public.user_reports;
drop policy if exists "Reporters manage reports insert" on public.user_reports;

create policy "Reporters manage reports select"
on public.user_reports for select to authenticated
using (auth.uid() = reporter_id);

create policy "Reporters manage reports insert"
on public.user_reports for insert to authenticated
with check (auth.uid() = reporter_id and reporter_id <> reported_user_id);

grant select, insert on public.user_reports to authenticated;
revoke update, delete on table public.user_reports from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 8. ensure_conversation_for_connection
-- ---------------------------------------------------------------------------
create or replace function public.ensure_conversation_for_connection(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conn public.connections%rowtype;
  v_conversation_id uuid;
  v_created boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_connection_id is null then
    return jsonb_build_object('ok', false, 'message', 'Connection is required.');
  end if;

  select * into v_conn
  from public.connections c
  where c.id = p_connection_id
    and (c.user_a_id = v_uid or c.user_b_id = v_uid)
  limit 1;

  if v_conn.id is null then
    return jsonb_build_object('ok', false, 'message', 'Connection not found.');
  end if;

  if v_conn.status <> 'active' then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;

  if public.forge_users_blocked(v_conn.user_a_id, v_conn.user_b_id) then
    return jsonb_build_object('ok', false, 'message', 'This conversation is unavailable.');
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.connection_id = p_connection_id
  limit 1;

  if v_conversation_id is null then
    perform set_config('forge.allow_system_writes', 'on', true);

    insert into public.conversations (connection_id, status)
    values (p_connection_id, 'active')
    returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (v_conversation_id, v_conn.user_a_id),
      (v_conversation_id, v_conn.user_b_id);

    v_created := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'conversation_id', v_conversation_id,
    'created', v_created,
    'connection_id', p_connection_id
  );
end;
$$;

revoke all on function public.ensure_conversation_for_connection(uuid) from public, anon;
grant execute on function public.ensure_conversation_for_connection(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. send_conversation_message
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

  -- Idempotent retry for the same client_message_id
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
-- 10. list_my_conversations
-- ---------------------------------------------------------------------------
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
          peer.id as peer_user_id,
          split_part(coalesce(dp.full_name, 'Member'), ' ', 1) as peer_first_name,
          dp.age as peer_age,
          dp.profile_photo_url as peer_photo_url,
          lm.body as latest_message_body,
          lm.created_at as latest_message_at,
          lm.sender_id as latest_message_sender_id,
          case
            when lm.id is null then false
            when lm.sender_id = v_uid then false
            when cp.last_read_at is null then true
            when lm.created_at > cp.last_read_at then true
            else false
          end as unread,
          greatest(c.last_message_at, c.created_at) as sort_at
        from public.conversation_participants cp
        join public.conversations c on c.id = cp.conversation_id
        join public.connections conn on conn.id = c.connection_id
        join lateral (
          select case
            when conn.user_a_id = v_uid then conn.user_b_id
            else conn.user_a_id
          end as id
        ) peer on true
        left join public.discoverable_profiles dp on dp.id = peer.id
        left join lateral (
          select m.id, m.body, m.created_at, m.sender_id
          from public.messages m
          where m.conversation_id = c.id
          order by m.created_at desc, m.id desc
          limit 1
        ) lm on true
        where cp.user_id = v_uid
          and not public.forge_users_blocked(v_uid, peer.id)
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_my_conversations() from public, anon;
grant execute on function public.list_my_conversations() to authenticated;

-- ---------------------------------------------------------------------------
-- 11. list_conversation_messages (cursor pagination)
-- ---------------------------------------------------------------------------
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
        select msg.id, msg.conversation_id, msg.sender_id, msg.body,
               msg.client_message_id, msg.created_at
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

revoke all on function public.list_conversation_messages(uuid, timestamptz, uuid, integer) from public, anon;
grant execute on function public.list_conversation_messages(uuid, timestamptz, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. mark_conversation_read
-- ---------------------------------------------------------------------------
create or replace function public.mark_conversation_read(p_conversation_id uuid)
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
  if p_conversation_id is null
     or not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = v_uid;

  return jsonb_build_object('ok', true, 'read_at', now());
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 13. end_connection
-- ---------------------------------------------------------------------------
create or replace function public.end_connection(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_conn public.connections%rowtype;
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
  set status = 'ended', updated_at = now()
  where id = v_conn.id;

  update public.conversations
  set status = 'ended', updated_at = now()
  where connection_id = v_conn.id
    and status = 'active';

  return jsonb_build_object('ok', true, 'ended', true, 'connection_id', v_conn.id);
end;
$$;

revoke all on function public.end_connection(uuid) from public, anon;
grant execute on function public.end_connection(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 14. block_user (ends connection + blocks)
-- ---------------------------------------------------------------------------
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

  select o.user_a_id, o.user_b_id into v_a, v_b
  from public.forge_order_pair(v_uid, p_blocked_user_id) o;

  update public.connections
  set status = 'ended', updated_at = now()
  where user_a_id = v_a
    and user_b_id = v_b
    and status = 'active';

  update public.conversations c
  set status = 'ended', updated_at = now()
  from public.connections conn
  where c.connection_id = conn.id
    and conn.user_a_id = v_a
    and conn.user_b_id = v_b
    and c.status = 'active';

  return jsonb_build_object('ok', true, 'blocked', true);
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 15. report_user
-- ---------------------------------------------------------------------------
create or replace function public.report_user(
  p_reported_user_id uuid,
  p_reason public.report_reason,
  p_details text default null,
  p_conversation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_details text := nullif(trim(coalesce(p_details, '')), '');
  v_report_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_reported_user_id is null or p_reported_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot report yourself.');
  end if;
  if p_reason is null then
    return jsonb_build_object('ok', false, 'message', 'A report reason is required.');
  end if;
  if v_details is not null and char_length(v_details) > 1000 then
    return jsonb_build_object('ok', false, 'message', 'Report details are too long.');
  end if;
  if p_conversation_id is not null
     and not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  insert into public.user_reports (
    reporter_id, reported_user_id, conversation_id, reason, details
  )
  values (v_uid, p_reported_user_id, p_conversation_id, p_reason, v_details)
  returning id into v_report_id;

  return jsonb_build_object('ok', true, 'report_id', v_report_id);
end;
$$;

revoke all on function public.report_user(uuid, public.report_reason, text, uuid) from public, anon;
grant execute on function public.report_user(uuid, public.report_reason, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 16. get_conversation_thread_meta
-- ---------------------------------------------------------------------------
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
     or not public.forge_is_conversation_participant(p_conversation_id, v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;

  select
    c.id as conversation_id,
    c.connection_id,
    c.status,
    c.created_at,
    c.last_message_at,
    peer.id as peer_user_id,
    split_part(coalesce(dp.full_name, 'Member'), ' ', 1) as peer_first_name,
    dp.full_name as peer_full_name,
    dp.age as peer_age,
    dp.profile_photo_url as peer_photo_url,
    public.forge_users_blocked(v_uid, peer.id) as is_blocked
  into v_row
  from public.conversations c
  join public.connections conn on conn.id = c.connection_id
  join lateral (
    select case when conn.user_a_id = v_uid then conn.user_b_id else conn.user_a_id end as id
  ) peer on true
  left join public.discoverable_profiles dp on dp.id = peer.id
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
