-- Make Open to Chat delivery durable and visible to the recipient.
-- Closed requests may be reused because sender/recipient pairs are unique.

create or replace function public.send_open_to_chat(
  p_recipient_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(trim(p_note), '');
  v_id uuid;
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

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.open_to_chat_requests as existing_request (
    sender_id,
    recipient_id,
    note,
    status
  )
  values (v_uid, p_recipient_id, v_note, 'pending')
  on conflict (sender_id, recipient_id) do update
    set note = excluded.note,
        status = 'pending',
        responded_at = null,
        created_at = now(),
        updated_at = now()
    where existing_request.status in ('declined', 'expired')
  returning id into v_id;

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
    'note_included', v_note is not null
  );
end;
$$;

revoke all on function public.send_open_to_chat(uuid, text) from public, anon;
grant execute on function public.send_open_to_chat(uuid, text) to authenticated;
