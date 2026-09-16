-- FIX-013: explicit endings are durable; block-only endings retain unblock semantics.
alter table public.connections add column explicitly_ended boolean not null default false;
-- Existing unblocked ended relationships are deliberate endings. For blocked pairs,
-- only backfill when the recorded block did not itself end an active connection.
update public.connections c set explicitly_ended = true
where c.status = 'ended' and (
  not public.forge_users_blocked(c.user_a_id, c.user_b_id)
  or not exists (
    select 1 from public.safety_action_audit a
    join public.user_blocks b on b.blocker_id = a.actor_user_id and b.blocked_id = a.target_user_id
    where least(a.actor_user_id, a.target_user_id) = c.user_a_id
      and greatest(a.actor_user_id, a.target_user_id) = c.user_b_id
      and a.action = 'block' and a.connection_was_active
  )
);
create or replace function public.forge_pair_has_ended(a uuid, b uuid)
returns boolean language sql volatile security definer
set search_path = pg_catalog, public
as $$ select exists (
 select 1 from public.connections c
 where c.user_a_id = least(a,b) and c.user_b_id = greatest(a,b)
 and (c.status = 'ended' or c.explicitly_ended)
) $$;
revoke all on function public.forge_pair_has_ended(uuid,uuid) from public, anon, authenticated;

create or replace function public.block_user(p_blocked_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_ended_at timestamptz := now();
  v_rows integer := 0;
  v_connection_id uuid;
  v_conversation_id uuid;
  v_connection_was_active boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot block yourself.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_blocked_user_id)::text || greatest(v_uid, p_blocked_user_id)::text, 13013));

  select ordered.user_a_id, ordered.user_b_id
  into v_a, v_b
  from public.forge_order_pair(v_uid, p_blocked_user_id) ordered;

  select
    connections.id,
    conversations.id,
    connections.status = 'active' and conversations.status = 'active'
  into
    v_connection_id,
    v_conversation_id,
    v_connection_was_active
  from public.connections connections
  left join public.conversations conversations
    on conversations.connection_id = connections.id
  where connections.user_a_id = v_a
    and connections.user_b_id = v_b
  limit 1;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_uid, p_blocked_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
  get diagnostics v_rows = row_count;

  update public.connections
  set status = 'ended', updated_at = v_ended_at
  where id = v_connection_id and status = 'active';

  update public.conversations
  set
    status = 'ended',
    ended_at = coalesce(ended_at, v_ended_at),
    ended_by_user_id = coalesce(ended_by_user_id, v_uid),
    updated_at = v_ended_at
  where id = v_conversation_id and status = 'active';

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id,
      target_user_id,
      conversation_id,
      action,
      connection_was_active
    )
    values (
      v_uid,
      p_blocked_user_id,
      v_conversation_id,
      'block',
      coalesce(v_connection_was_active, false)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'blocked', true,
    'already_blocked', v_rows = 0,
    'ended_at', v_ended_at
  );
end;
$$;

create or replace function public.end_connection(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_conn.user_a_id, v_conn.user_b_id)::text || greatest(v_conn.user_a_id, v_conn.user_b_id)::text, 13013));
  perform set_config('forge.allow_system_writes', 'on', true);

  update public.connections
  set status = 'ended', explicitly_ended = true, updated_at = v_ended_at
  where id = v_conn.id;

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

create or replace function public.forge_ensure_connection(
  p_user_1 uuid,
  p_user_2 uuid,
  p_source public.connection_source
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_a uuid;
  v_b uuid;
  v_id uuid;
begin
  if p_user_1 is null or p_user_2 is null or p_user_1 = p_user_2 then
    raise exception 'forge_ensure_connection: invalid pair';
  end if;

  select o.user_a_id, o.user_b_id into v_a, v_b
  from public.forge_order_pair(p_user_1, p_user_2) o;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_a, v_b)::text || greatest(v_a, v_b)::text, 13013));
  if public.forge_pair_has_ended(v_a, v_b) then
    raise exception 'This connection has ended.';
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.connections (user_a_id, user_b_id, source, status)
  values (v_a, v_b, p_source, 'active')
  on conflict (user_a_id, user_b_id) do update
    set status = 'active',
        source = excluded.source,
        updated_at = now()
  returning id into v_id;

  update public.conversations
  set status = 'active',
      ended_at = null,
      ended_by_user_id = null,
      updated_at = now()
  where connection_id = v_id
    and status = 'ended';

  update public.interests
  set status = 'mutual',
      updated_at = now()
  where status = 'pending'
    and (
      (sender_id = v_a and recipient_id = v_b)
      or (sender_id = v_b and recipient_id = v_a)
    );

  return v_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_eligible_discovery_profile(p_profile_id uuid)
RETURNS SETOF public.discoverable_profiles
LANGUAGE plpgsql
STABLE SECURITY DEFINER
set search_path = pg_catalog, public
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_profile_id is null or p_profile_id = v_uid then return; end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then return; end if;
  if not exists (
    select 1 from public.connections c
    where c.status in ('active', 'ended')
      and ((c.user_a_id = v_uid and c.user_b_id = p_profile_id)
        or (c.user_b_id = v_uid and c.user_a_id = p_profile_id))
  ) and not public.forge_profiles_match_preferences(v_uid, p_profile_id) then
    return;
  end if;
  return query
  select dp.* from public.discoverable_profiles dp
  where dp.id = p_profile_id
  limit 1;
end;
$function$;

create or replace function public.list_eligible_discovery_profiles(p_limit int default 50)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_activate_discovery_visibility(v_uid) then
    return;
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id <> v_uid
    and public.forge_profiles_match_preferences(v_uid, dp.id)
    and not public.forge_users_blocked(v_uid, dp.id)
    and not exists (
      select 1 from public.passed_profiles pp
      where pp.passer_id = v_uid and pp.passed_id = dp.id
    )
    and not exists (
      select 1 from public.connections c
      where c.user_a_id = least(v_uid, dp.id)
        and c.user_b_id = greatest(v_uid, dp.id)
    )
  order by
    (select p.last_active_at from public.profiles p where p.id = dp.id) desc nulls last,
    (select p.updated_at from public.profiles p where p.id = dp.id) desc nulls last,
    dp.id asc
  limit v_limit;
end;
$$;

create or replace function public.pass_on_profile(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_profile_id is null or p_profile_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot pass on your own profile.');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_profile_id)::text || greatest(v_uid, p_profile_id)::text, 13013));
  if public.forge_pair_has_ended(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;

  -- Do not destroy existing connections
  if exists (
    select 1 from public.connections c
    where c.status = 'active'
      and c.user_a_id = least(v_uid, p_profile_id)
      and c.user_b_id = greatest(v_uid, p_profile_id)
  ) then
    return jsonb_build_object('ok', false, 'message', 'You are already connected with this person.');
  end if;

  delete from public.saved_profiles
  where saver_id = v_uid and saved_id = p_profile_id;

  insert into public.passed_profiles (passer_id, passed_id)
  values (v_uid, p_profile_id)
  on conflict (passer_id, passed_id) do nothing;

  return jsonb_build_object('ok', true, 'passed', true);
end;
$$;

create or replace function public.respond_open_to_chat(
  p_request_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
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
  where id = p_request_id
;

  if not found or v_req.recipient_id <> v_uid then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, v_req.sender_id)::text || greatest(v_uid, v_req.sender_id)::text, 13013));
  if public.forge_pair_has_ended(v_uid, v_req.sender_id) then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;
  
  select * into v_req from public.open_to_chat_requests where id = p_request_id for update;
  if v_req.status not in ('pending', 'deferred') then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  if coalesce(v_req.expires_at, v_req.created_at + interval '7 days') <= now() then
    update public.open_to_chat_requests
    set status = 'expired', updated_at = now()
    where id = p_request_id;

    return jsonb_build_object('ok', false, 'message', 'This request has expired.');
  end if;

  if public.forge_users_blocked(v_uid, v_req.sender_id) then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

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

    update public.notifications
    set actor_user_id = v_uid,
        body = v_actor_name || ' accepted your invitation to chat.',
        destination_path = '/connections?tab=mutual',
        read_at = null,
        created_at = now()
    where recipient_user_id = v_req.sender_id
      and notification_type = 'open_to_chat_accepted'
      and entity_type = 'open_to_chat_request'
      and entity_id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'accepted',
      'connection_id', v_connection_id,
      'message', 'You''re connected.'
    );
  elsif v_action in ('defer', 'not_right_now') then
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

create or replace function public.save_profile_for_later(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_profile_id is null or p_profile_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot save your own profile.');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_profile_id)::text || greatest(v_uid, p_profile_id)::text, 13013));
  if public.forge_pair_has_ended(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_profile_id)
     and not exists (
       select 1 from public.saved_profiles s where s.saver_id = v_uid and s.saved_id = p_profile_id
     ) then
    -- Allow re-save only if already saved; otherwise require discoverable target
    if not exists (select 1 from public.profiles p where p.id = p_profile_id and p.status = 'active') then
      return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
    end if;
  end if;

  delete from public.passed_profiles
  where passer_id = v_uid and passed_id = p_profile_id;

  insert into public.saved_profiles (saver_id, saved_id)
  values (v_uid, p_profile_id)
  on conflict (saver_id, saved_id) do nothing;

  return jsonb_build_object('ok', true, 'saved', true);
end;
$$;

create or replace function public.send_interest(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_reciprocal uuid;
  v_connection_id uuid;
  v_mutual boolean := false;
  v_interest_id uuid;
  v_actor_name text;
  v_was_withdrawn boolean := false;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot express interest in yourself.');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_recipient_id)::text || greatest(v_uid, p_recipient_id)::text, 13013));
  if public.forge_pair_has_ended(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;
  if public.forge_users_blocked(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;

  select i.status = 'withdrawn'
  into v_was_withdrawn
  from public.interests i
  where i.sender_id = v_uid
    and i.recipient_id = p_recipient_id
  limit 1;

  v_was_withdrawn := coalesce(v_was_withdrawn, false);

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.interests as existing_interest (sender_id, recipient_id, status)
  values (v_uid, p_recipient_id, 'pending')
  on conflict (sender_id, recipient_id) do update
    set status = 'pending', updated_at = now()
    where existing_interest.status = 'withdrawn'
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

      if v_was_withdrawn then
        update public.notifications
        set actor_user_id = v_uid,
            body = v_actor_name || ' is interested in connecting.',
            destination_path = '/connections',
            read_at = null,
            created_at = now()
        where recipient_user_id = p_recipient_id
          and notification_type = 'interest_received'
          and entity_type = 'interest'
          and entity_id = v_interest_id;
      end if;
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

create or replace function public.send_open_to_chat(
  p_recipient_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(trim(p_note), '');
  v_id uuid;
  v_expires_at timestamptz;
  v_actor_name text;
  v_reactivated boolean := false;
  v_now timestamptz;
  v_daily_count integer := 0;
  v_remaining integer := 0;
  v_third_newest_send timestamptz;
  v_last_sent_at timestamptz;
  v_recipient_last_sent_at timestamptz;
  v_next_available_at timestamptz;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot send Open to Chat to yourself.');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_recipient_id)::text || greatest(v_uid, p_recipient_id)::text, 13013));
  if public.forge_pair_has_ended(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This connection has ended.');
  end if;
  if public.forge_users_blocked(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if v_note is not null and char_length(v_note) > 200 then
    return jsonb_build_object('ok', false, 'message', 'Your note must be 200 characters or fewer.');
  end if;

  -- Serialize every sender's limit checks and write so parallel requests cannot bypass limits.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_uid::text, 11011)
  );
  -- Use actual send time after waiting for the lock, not transaction start time.
  v_now := clock_timestamp();

  perform set_config('forge.allow_system_writes', 'on', true);

  update public.open_to_chat_requests r
  set status = 'expired', updated_at = v_now
  where r.sender_id = v_uid
    and r.recipient_id = p_recipient_id
    and r.status in ('pending', 'deferred')
    and coalesce(r.expires_at, r.created_at + interval '7 days') <= v_now;

  select r.created_at
  into v_recipient_last_sent_at
  from public.open_to_chat_requests r
  where r.sender_id = v_uid and r.recipient_id = p_recipient_id
  limit 1;

  if v_recipient_last_sent_at is not null
     and v_recipient_last_sent_at > v_now - interval '7 days' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'recipient_cooldown',
      'message', 'Open to Chat can be sent to the same person once every seven days.',
      'retry_at', v_recipient_last_sent_at + interval '7 days'
    );
  end if;

  -- Recent requests return the same response regardless of the recipient's
  -- private decision. Older accepted or still-active requests cannot repeat.
  if exists (
    select 1 from public.open_to_chat_requests r
    where r.sender_id = v_uid and r.recipient_id = p_recipient_id
      and r.status in ('pending', 'deferred', 'accepted')
  ) then
    return jsonb_build_object(
      'ok', false,
      'reason', 'existing_request',
      'message', 'You already sent an Open to Chat request to this person.'
    );
  end if;

  select max(r.created_at)
  into v_last_sent_at
  from public.open_to_chat_requests r
  where r.sender_id = v_uid;

  select count(*)::integer, (array_agg(r.created_at order by r.created_at desc))[3]
  into v_daily_count, v_third_newest_send
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > v_now - interval '24 hours';

  if v_daily_count >= 3 then
    v_next_available_at := greatest(
      v_third_newest_send + interval '24 hours', v_last_sent_at + interval '60 seconds'
    );
    return jsonb_build_object(
      'ok', false,
      'reason', 'daily_limit',
      'message', 'You have used all 3 Open to Chat requests available in this 24-hour period.',
      'daily_limit', 3,
      'remaining', 0,
      'retry_at', v_next_available_at
    );
  end if;

  if v_last_sent_at is not null
     and v_last_sent_at > v_now - interval '60 seconds' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'send_cooldown',
      'message', 'Please take a moment before sending another Open to Chat request.',
      'retry_at', v_last_sent_at + interval '60 seconds'
    );
  end if;

  select r.status in ('declined', 'expired')
  into v_reactivated
  from public.open_to_chat_requests r
  where r.sender_id = v_uid and r.recipient_id = p_recipient_id
  limit 1;

  insert into public.open_to_chat_requests as existing_request (
    sender_id,
    recipient_id,
    note,
    status,
    created_at,
    expires_at
  )
  values (v_uid, p_recipient_id, v_note, 'pending', v_now, v_now + interval '7 days')
  on conflict (sender_id, recipient_id) do update
    set note = excluded.note,
        status = 'pending',
        expires_at = excluded.expires_at,
        responded_at = null,
        created_at = v_now,
        updated_at = v_now
    where existing_request.status in ('declined', 'expired')
  returning id, expires_at into v_id, v_expires_at;

  if v_id is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'existing_request',
      'message', 'You already sent an Open to Chat request to this person.'
    );
  end if;

  update public.user_app_state
  set open_to_chat_education_seen = true, updated_at = v_now
  where user_id = v_uid;

  v_actor_name := public.forge_notification_actor_first_name(v_uid);
  perform public.forge_create_notification(
    p_recipient_id,
    v_uid,
    'open_to_chat_received'::public.notification_type,
    v_actor_name || ' is open to starting a conversation.',
    'open_to_chat_request'::public.notification_entity_type,
    v_id,
    '/connections?tab=openToChat'
  );

  if v_reactivated then
    update public.notifications
    set actor_user_id = v_uid,
        body = v_actor_name || ' is open to starting a conversation.',
        destination_path = '/connections?tab=openToChat',
        read_at = null,
        created_at = v_now
    where recipient_user_id = p_recipient_id
      and notification_type = 'open_to_chat_received'
      and entity_type = 'open_to_chat_request'
      and entity_id = v_id;
  end if;

  select count(*)::integer, (array_agg(r.created_at order by r.created_at desc))[3]
  into v_daily_count, v_third_newest_send
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > v_now - interval '24 hours';

  v_remaining := greatest(0, 3 - v_daily_count);
  v_next_available_at := case
    when v_remaining = 0 then greatest(
      v_third_newest_send + interval '24 hours', v_now + interval '60 seconds'
    )
    else null
  end;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_id,
    'note_included', v_note is not null,
    'expires_at', v_expires_at,
    'daily_limit', 3,
    'premium_daily_limit', 5,
    'remaining', v_remaining,
    'next_available_at', v_next_available_at
  );
end;
$$;

create or replace function public.unblock_user(p_blocked_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows integer := 0;
  v_connection_id uuid;
  v_conversation_id uuid;
  v_restore_connection boolean := false;
  v_messaging_reopened boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot unblock yourself.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(v_uid, p_blocked_user_id)::text || greatest(v_uid, p_blocked_user_id)::text, 13013));

  select audit.connection_was_active
  into v_restore_connection
  from public.safety_action_audit audit
  where audit.actor_user_id = v_uid
    and audit.target_user_id = p_blocked_user_id
    and audit.action = 'block'
  order by audit.created_at desc, audit.id desc
  limit 1;

  delete from public.user_blocks
  where blocker_id = v_uid and blocked_id = p_blocked_user_id;
  get diagnostics v_rows = row_count;

  select connections.id, conversations.id
  into v_connection_id, v_conversation_id
  from public.connections connections
  left join public.conversations conversations
    on conversations.connection_id = connections.id
  where
    (connections.user_a_id = v_uid and connections.user_b_id = p_blocked_user_id)
    or
    (connections.user_a_id = p_blocked_user_id and connections.user_b_id = v_uid)
  limit 1;

  if v_rows > 0
     and coalesce(v_restore_connection, false)
     and not exists (select 1 from public.connections c where c.id = v_connection_id and c.explicitly_ended)
     and not public.forge_users_blocked(v_uid, p_blocked_user_id)
  then
    perform set_config('forge.allow_system_writes', 'on', true);

    update public.connections
    set status = 'active', updated_at = now()
    where id = v_connection_id and status = 'ended';

    update public.conversations
    set
      status = 'active',
      ended_at = null,
      ended_by_user_id = null,
      updated_at = now()
    where id = v_conversation_id and status = 'ended';

    v_messaging_reopened := found;
  end if;

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id,
      target_user_id,
      conversation_id,
      action,
      messaging_reopened
    )
    values (
      v_uid,
      p_blocked_user_id,
      v_conversation_id,
      'unblock',
      v_messaging_reopened
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'unblocked', v_rows > 0,
    'already_unblocked', v_rows = 0,
    'connection_restored', v_messaging_reopened,
    'messaging_reopened', v_messaging_reopened
  );
end;
$$;

-- Direct table writes cannot bypass RPC checks.
create or replace function public.guard_ended_pair_engagement()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare a uuid; b uuid;
begin
 if TG_TABLE_NAME = 'saved_profiles' then a := NEW.saver_id; b := NEW.saved_id;
 elsif TG_TABLE_NAME = 'passed_profiles' then a := NEW.passer_id; b := NEW.passed_id;
 else
   if NEW.status::text not in ('pending','deferred','accepted','mutual') then return NEW; end if;
   a := NEW.sender_id; b := NEW.recipient_id;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(a, b)::text || greatest(a, b)::text, 13013));
 if public.forge_pair_has_ended(a,b) then raise exception 'This connection has ended.'; end if;
 return NEW;
end $$;
revoke all on function public.guard_ended_pair_engagement() from public, anon, authenticated;
create trigger ended_pair_guard before insert or update on public.interests for each row execute function public.guard_ended_pair_engagement();
create trigger ended_pair_guard before insert or update on public.open_to_chat_requests for each row execute function public.guard_ended_pair_engagement();
create trigger ended_pair_guard before insert or update on public.saved_profiles for each row execute function public.guard_ended_pair_engagement();
create trigger ended_pair_guard before insert or update on public.passed_profiles for each row execute function public.guard_ended_pair_engagement();

-- Explicit ending cannot be cleared by another privileged lifecycle path.
create or replace function public.guard_explicit_connection_end()
returns trigger language plpgsql set search_path = pg_catalog, public
as $$
begin
 if OLD.explicitly_ended and (not NEW.explicitly_ended or NEW.status <> 'ended') then
   raise exception 'This connection has ended.';
 end if;
 return NEW;
end $$;
revoke all on function public.guard_explicit_connection_end() from public, anon, authenticated;
create trigger explicit_end_guard before update on public.connections for each row execute function public.guard_explicit_connection_end();

-- Serialize message creation and conversation opening against End Connection,
-- including direct table writes and requests that began before the end committed.
create or replace function public.guard_ended_conversation_write()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare a uuid; b uuid; connection uuid;
begin
 if TG_TABLE_NAME = 'conversations' then
   if NEW.status <> 'active' then return NEW; end if;
   connection := NEW.connection_id;
 else
   select c.connection_id into connection from public.conversations c where c.id = NEW.conversation_id;
 end if;
 select c.user_a_id, c.user_b_id into a,b from public.connections c where c.id = connection;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(a,b)::text || greatest(a,b)::text, 13013));
 if public.forge_pair_has_ended(a,b) then raise exception 'This connection has ended.'; end if;
 return NEW;
end $$;
revoke all on function public.guard_ended_conversation_write() from public, anon, authenticated;
create trigger ended_conversation_guard before insert or update on public.conversations for each row execute function public.guard_ended_conversation_write();
create trigger ended_message_guard before insert on public.messages for each row execute function public.guard_ended_conversation_write();
