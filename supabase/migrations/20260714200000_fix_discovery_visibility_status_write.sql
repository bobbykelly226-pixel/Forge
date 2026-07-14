-- Fix Discovery visibility writes.
-- Root cause: protect_profiles_system_columns never honored forge.allow_system_writes,
-- so set_my_discovery_visibility failed with "profiles: status is system-managed"
-- when activating draft profiles for Discovery.

create or replace function public.protect_profiles_system_columns()
returns trigger
language plpgsql
as $$
declare
  v_system boolean := coalesce(current_setting('forge.allow_system_writes', true), 'off') = 'on';
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not v_system then
      new.id := auth.uid();
      new.status := 'draft';
      new.is_discoverable := false;
      new.onboarding_completed_at := null;
      new.profile_completed_at := null;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'profiles: id is immutable';
  end if;

  new.created_at := old.created_at;

  -- Trusted RPCs (e.g. set_my_discovery_visibility) may change status / stamps.
  if v_system then
    return new;
  end if;

  if auth.uid() is not null then
    if new.status is distinct from old.status then
      raise exception 'profiles: status is system-managed';
    end if;

    if new.onboarding_completed_at is distinct from old.onboarding_completed_at then
      if old.onboarding_completed_at is not null
         or new.onboarding_completed_at is null then
        raise exception 'profiles: onboarding_completed_at is system-managed';
      end if;
    end if;

    if new.profile_completed_at is distinct from old.profile_completed_at then
      if old.profile_completed_at is not null
         or new.profile_completed_at is null then
        raise exception 'profiles: profile_completed_at is system-managed';
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.protect_profiles_system_columns() is
  'Protects profile system columns for ordinary clients. Trusted RPCs set forge.allow_system_writes=on.';

-- Harden set_my_discovery_visibility: ensure foundational rows, allow system writes,
-- activate discoverability without completion gates.
create or replace function public.set_my_discovery_visibility(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.profile_status;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_foundational_user_records(v_uid);
  perform set_config('forge.allow_system_writes', 'on', true);

  select p.status into v_status
  from public.profiles p
  where p.id = v_uid;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'enabled', false,
      'can_enable', false,
      'message', 'Discovery visibility is unavailable for this account.'
    );
  end if;

  if p_enabled then
    if v_status in ('deactivated', 'hidden') then
      return jsonb_build_object(
        'ok', false,
        'enabled', false,
        'can_enable', false,
        'message', 'Discovery visibility is unavailable for this account.'
      );
    end if;

    update public.profiles
    set
      status = 'active',
      is_discoverable = true,
      last_active_at = now(),
      updated_at = now()
    where id = v_uid;

    update public.profile_preferences
    set discovery_enabled = true, updated_at = now()
    where user_id = v_uid;
  else
    update public.profiles
    set
      is_discoverable = false,
      updated_at = now()
    where id = v_uid;

    update public.profile_preferences
    set discovery_enabled = false, updated_at = now()
    where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'enabled', p_enabled,
    'can_enable', public.can_activate_discovery_visibility(v_uid),
    'message', case
      when p_enabled then 'You are now visible in Discovery.'
      else 'You are hidden from Discovery. Existing connections were kept.'
    end
  );
end;
$$;
