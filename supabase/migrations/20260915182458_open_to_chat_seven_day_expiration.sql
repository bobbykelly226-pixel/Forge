-- FIX-010: every active Open to Chat request has one seven-day response window.
-- Expiration is enforced by trusted functions and active client reads so an old
-- request cannot be accepted even before a scheduled cleanup job exists.

alter table public.open_to_chat_requests
  alter column expires_at set default (now() + interval '7 days');

select set_config('forge.allow_system_writes', 'on', true);

update public.open_to_chat_requests
set expires_at = created_at + interval '7 days',
    updated_at = now()
where status in ('pending', 'deferred')
  and expires_at is null;

update public.open_to_chat_requests
set status = 'expired',
    updated_at = now()
where status in ('pending', 'deferred')
  and expires_at <= now();

create index if not exists open_to_chat_active_expiration_idx
  on public.open_to_chat_requests (expires_at)
  where status in ('pending', 'deferred');

create or replace function public.protect_open_to_chat_system_columns()
returns trigger
language plpgsql
set search_path to pg_catalog, public
as $$
begin
  if coalesce(current_setting('forge.allow_system_writes', true), 'off') = 'on' then
    if tg_op = 'INSERT' then
      if new.sender_id = new.recipient_id then
        raise exception 'open_to_chat_requests: cannot request yourself';
      end if;
      if new.note is not null and char_length(new.note) > 200 then
        raise exception 'open_to_chat_requests: note exceeds 200 characters';
      end if;
      new.expires_at := now() + interval '7 days';
      return new;
    end if;
    if new.sender_id is distinct from old.sender_id
       or new.recipient_id is distinct from old.recipient_id then
      raise exception 'open_to_chat_requests: participant ids are immutable';
    end if;
    if new.note is not null and char_length(new.note) > 200 then
      raise exception 'open_to_chat_requests: note exceeds 200 characters';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.sender_id := auth.uid();
      new.status := 'pending';
      new.responded_at := null;
    end if;
    if new.sender_id = new.recipient_id then
      raise exception 'open_to_chat_requests: cannot request yourself';
    end if;
    if new.note is not null and char_length(new.note) > 200 then
      raise exception 'open_to_chat_requests: note exceeds 200 characters';
    end if;
    new.expires_at := now() + interval '7 days';
    return new;
  end if;

  if new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id then
    raise exception 'open_to_chat_requests: participant ids are immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null
     and (
       new.status is distinct from old.status
       or new.responded_at is distinct from old.responded_at
       or new.expires_at is distinct from old.expires_at
       or new.note is distinct from old.note
     ) then
    raise exception 'open_to_chat_requests: status fields are system-managed';
  end if;

  return new;
end;
$$;

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

  perform set_config('forge.allow_system_writes', 'on', true);

  update public.open_to_chat_requests r
  set status = 'expired', updated_at = now()
  where r.sender_id = v_uid
    and r.recipient_id = p_recipient_id
    and r.status in ('pending', 'deferred')
    and coalesce(r.expires_at, r.created_at + interval '7 days') <= now();

  if exists (
    select 1 from public.open_to_chat_requests r
    where r.sender_id = v_uid and r.recipient_id = p_recipient_id
      and r.status in ('pending', 'deferred', 'accepted')
  ) then
    return jsonb_build_object('ok', false, 'message', 'You already sent an Open to Chat request to this person.');
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
  values (v_uid, p_recipient_id, v_note, 'pending', now() + interval '7 days')
  on conflict (sender_id, recipient_id) do update
    set note = excluded.note,
        status = 'pending',
        expires_at = excluded.expires_at,
        responded_at = null,
        created_at = now(),
        updated_at = now()
    where existing_request.status in ('declined', 'expired')
  returning id, expires_at into v_id, v_expires_at;

  if v_id is null then
    return jsonb_build_object('ok', false, 'message', 'You already sent an Open to Chat request to this person.');
  end if;

  update public.user_app_state
  set open_to_chat_education_seen = true, updated_at = now()
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
        created_at = now()
    where recipient_user_id = p_recipient_id
      and notification_type = 'open_to_chat_received'
      and entity_type = 'open_to_chat_request'
      and entity_id = v_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_id,
    'note_included', v_note is not null,
    'expires_at', v_expires_at
  );
end;
$$;

revoke all on function public.send_open_to_chat(uuid, text) from public, anon;
grant execute on function public.send_open_to_chat(uuid, text) to authenticated;

create or replace function public.respond_open_to_chat(
  p_request_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public
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
  for update;

  if not found or v_req.recipient_id <> v_uid then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

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

revoke all on function public.respond_open_to_chat(uuid, text)
  from public, anon;
grant execute on function public.respond_open_to_chat(uuid, text)
  to authenticated;
