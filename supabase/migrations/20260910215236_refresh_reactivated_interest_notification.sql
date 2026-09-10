-- Treat a renewed interest as a new recipient-facing event while keeping
-- ordinary duplicate requests idempotent. The unique interest row remains the
-- authoritative pair record; only a transition from withdrawn to pending
-- refreshes its existing notification.

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
  v_was_withdrawn boolean := false;
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

revoke all on function public.send_interest(uuid) from public, anon;
grant execute on function public.send_interest(uuid) to authenticated;
