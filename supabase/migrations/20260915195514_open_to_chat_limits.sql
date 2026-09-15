-- FIX-011: intentional, server-enforced Open to Chat limits.
-- Founding Beta/free: 3 successful sends per rolling 24 hours.
-- Future Premium ceiling: 5 per rolling 24 hours (not activated by this migration).
-- Same recipient: once per 7 days. No carryover or purchased/earned extras.

create index if not exists open_to_chat_sender_created_at_idx
  on public.open_to_chat_requests (sender_id, created_at);

create or replace function public.count_open_to_chat_sent_today(p_user_id uuid default null)
returns integer
language plpgsql
stable
security definer
set search_path to pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_user_id is not null and p_user_id <> v_uid then
    raise exception 'Not authorized';
  end if;

  select count(*)::integer
  into v_count
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > now() - interval '24 hours';

  return v_count;
end;
$$;

revoke all on function public.count_open_to_chat_sent_today(uuid) from public, anon;
grant execute on function public.count_open_to_chat_sent_today(uuid) to authenticated;

create or replace function public.get_open_to_chat_allowance()
returns jsonb
language plpgsql
stable
security definer
set search_path to pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_oldest_window_send timestamptz;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select count(*)::integer, min(r.created_at)
  into v_count, v_oldest_window_send
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > now() - interval '24 hours';

  return jsonb_build_object(
    'ok', true,
    'daily_limit', 3,
    'premium_daily_limit', 5,
    'remaining', greatest(0, 3 - v_count),
    'next_available_at', case
      when v_count >= 3 then v_oldest_window_send + interval '24 hours'
      else null
    end
  );
end;
$$;

revoke all on function public.get_open_to_chat_allowance() from public, anon;
grant execute on function public.get_open_to_chat_allowance() to authenticated;

create or replace function public.send_open_to_chat(
  p_recipient_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(trim(p_note), '');
  v_id uuid;
  v_expires_at timestamptz;
  v_actor_name text;
  v_reactivated boolean := false;
  v_now timestamptz := now();
  v_daily_count integer := 0;
  v_remaining integer := 0;
  v_oldest_window_send timestamptz;
  v_last_sent_at timestamptz;
  v_recipient_last_sent_at timestamptz;
  v_next_available_at timestamptz;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot send Open to Chat to yourself.');
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

  perform set_config('forge.allow_system_writes', 'on', true);

  update public.open_to_chat_requests r
  set status = 'expired', updated_at = v_now
  where r.sender_id = v_uid
    and r.recipient_id = p_recipient_id
    and r.status in ('pending', 'deferred')
    and coalesce(r.expires_at, r.created_at + interval '7 days') <= v_now;

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

  select max(r.created_at)
  into v_last_sent_at
  from public.open_to_chat_requests r
  where r.sender_id = v_uid;

  if v_last_sent_at is not null
     and v_last_sent_at > v_now - interval '60 seconds' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'send_cooldown',
      'message', 'Please take a moment before sending another Open to Chat request.',
      'retry_at', v_last_sent_at + interval '60 seconds'
    );
  end if;

  select count(*)::integer, min(r.created_at)
  into v_daily_count, v_oldest_window_send
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > v_now - interval '24 hours';

  if v_daily_count >= 3 then
    v_next_available_at := v_oldest_window_send + interval '24 hours';
    return jsonb_build_object(
      'ok', false,
      'reason', 'daily_limit',
      'message', 'You have used all 3 Open to Chat requests available in this 24-hour period.',
      'daily_limit', 3,
      'remaining', 0,
      'retry_at', v_next_available_at
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
    expires_at
  )
  values (v_uid, p_recipient_id, v_note, 'pending', v_now + interval '7 days')
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

  select count(*)::integer, min(r.created_at)
  into v_daily_count, v_oldest_window_send
  from public.open_to_chat_requests r
  where r.sender_id = v_uid
    and r.created_at > v_now - interval '24 hours';

  v_remaining := greatest(0, 3 - v_daily_count);
  v_next_available_at := case
    when v_remaining = 0 then v_oldest_window_send + interval '24 hours'
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

revoke all on function public.send_open_to_chat(uuid, text) from public, anon;
grant execute on function public.send_open_to_chat(uuid, text) to authenticated;
