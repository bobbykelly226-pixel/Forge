-- A previously ended connection uses the same unique member pair. When those
-- members deliberately reconnect through mutual interest or an accepted Open
-- to Chat request, restore the pair (and its conversation) instead of merely
-- touching updated_at on the ended row.
create or replace function public.forge_ensure_connection(
  p_user_1 uuid,
  p_user_2 uuid,
  p_source public.connection_source
)
returns uuid
language plpgsql
security definer
set search_path = ''
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

  return v_id;
end;
$$;

revoke all on function public.forge_ensure_connection(
  uuid, uuid, public.connection_source
) from public, anon, authenticated;

-- Acceptance notifications are unique to a request. If a historical request
-- is reactivated and accepted again, refresh the existing notification so the
-- sender receives a current unread event.
create or replace function public.respond_open_to_chat(
  p_request_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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

  if not found or v_req.recipient_id <> v_uid then
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
