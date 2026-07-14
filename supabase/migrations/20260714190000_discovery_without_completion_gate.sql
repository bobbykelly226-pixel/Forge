-- Discoverability no longer requires profile completion.
-- Authenticated owners may enable Show Me in Discovery unless administratively restricted.
-- Preserves users, relationships, RLS, and block protections.

-- Informational only: completion checklist is not an activation gate.
create or replace function public.profile_meets_discovery_requirements(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Deprecated as an activation gate. Always true for an existing profile row.
  -- Kept for backward-compatible RPC signatures; do not use to block Discovery.
  select exists (
    select 1 from public.profiles p where p.id = p_user_id
  );
$$;

comment on function public.profile_meets_discovery_requirements(uuid) is
  'Deprecated activation gate. Profile completion is informational only and must not control Discovery visibility.';

-- True when the account may participate in Discovery (not admin-restricted).
create or replace function public.can_activate_discovery_visibility(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.status is distinct from 'deactivated'
      and p.status is distinct from 'hidden'
  );
$$;

comment on function public.can_activate_discovery_visibility(uuid) is
  'Safety gate only: deactivated/hidden accounts cannot enable Discovery. Completion is irrelevant.';

revoke all on function public.can_activate_discovery_visibility(uuid) from public, anon;
grant execute on function public.can_activate_discovery_visibility(uuid) to authenticated;

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

comment on function public.set_my_discovery_visibility(boolean) is
  'Owner-controlled Discovery visibility. Completion is not required. Blocks only deactivated/hidden accounts.';

-- Remove completion-based auto-disable of discoverability.
drop trigger if exists profiles_enforce_discoverability on public.profiles;
drop function if exists public.enforce_discoverability_requirements();
