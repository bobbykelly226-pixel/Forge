-- Enforce reciprocal identity, age, and private distance preferences in Discovery.

create or replace function public.forge_private_distance_miles(
  p_latitude_a double precision,
  p_longitude_a double precision,
  p_latitude_b double precision,
  p_longitude_b double precision
)
returns double precision
language sql
immutable
set search_path = pg_catalog
as $$
  select case
    when p_latitude_a is null or p_longitude_a is null
      or p_latitude_b is null or p_longitude_b is null then null
    else 3958.7613 * 2 * asin(sqrt(least(1.0, greatest(0.0,
      power(sin(radians(p_latitude_b - p_latitude_a) / 2), 2)
      + cos(radians(p_latitude_a)) * cos(radians(p_latitude_b))
      * power(sin(radians(p_longitude_b - p_longitude_a) / 2), 2)
    ))))
  end;
$$;

revoke all on function public.forge_private_distance_miles(double precision, double precision, double precision, double precision)
  from public, anon, authenticated;

create or replace function public.forge_matching_preferences_complete(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.profile_preferences pref
    join public.profile_private_details d on d.user_id = pref.user_id
    where pref.user_id = p_user_id
      and pref.gender_identity in ('woman', 'man', 'nonbinary', 'another_identity')
      and cardinality(pref.interested_in) > 0
      and pref.interested_in <@ array['woman', 'man', 'nonbinary', 'another_identity', 'everyone']::text[]
      and not ('everyone' = any(pref.interested_in) and cardinality(pref.interested_in) > 1)
      and pref.preferred_age_min between 18 and 100
      and pref.preferred_age_max between pref.preferred_age_min and 100
      and pref.max_distance_miles between 5 and 500
      and d.latitude between -90 and 90
      and d.longitude between -180 and 180
  );
$$;

revoke all on function public.forge_matching_preferences_complete(uuid) from public, anon;
grant execute on function public.forge_matching_preferences_complete(uuid) to authenticated;

create or replace function public.forge_profiles_match_preferences(
  p_viewer_id uuid,
  p_candidate_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce((
    select
      public.forge_matching_preferences_complete(p_viewer_id)
      and public.forge_matching_preferences_complete(p_candidate_id)
      and (vp.interested_in @> array[cp.gender_identity]::text[] or 'everyone' = any(vp.interested_in))
      and (cp.interested_in @> array[vp.gender_identity]::text[] or 'everyone' = any(cp.interested_in))
      and public.forge_profile_age(cd.date_of_birth, current_date)
        between vp.preferred_age_min and vp.preferred_age_max
      and public.forge_profile_age(vd.date_of_birth, current_date)
        between cp.preferred_age_min and cp.preferred_age_max
      and public.forge_private_distance_miles(
        vd.latitude, vd.longitude, cd.latitude, cd.longitude
      ) <= least(vp.max_distance_miles, cp.max_distance_miles)
    from public.profile_preferences vp
    join public.profile_private_details vd on vd.user_id = vp.user_id
    join public.profile_preferences cp on cp.user_id = p_candidate_id
    join public.profile_private_details cd on cd.user_id = cp.user_id
    where vp.user_id = p_viewer_id
      and p_viewer_id is distinct from p_candidate_id
  ), false);
$$;

revoke all on function public.forge_profiles_match_preferences(uuid, uuid) from public, anon;
grant execute on function public.forge_profiles_match_preferences(uuid, uuid) to authenticated;

create or replace function public.can_activate_discovery_visibility(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_private_details d on d.user_id = p.id
    where p.id = p_user_id
      and p.status is distinct from 'deactivated'
      and p.status is distinct from 'hidden'
      and public.forge_is_adult_date_of_birth(d.date_of_birth, current_date)
      and public.forge_matching_preferences_complete(p.id)
  );
$$;

revoke all on function public.can_activate_discovery_visibility(uuid) from public, anon;
grant execute on function public.can_activate_discovery_visibility(uuid) to authenticated;

create or replace function public.enforce_profile_matching_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.is_discoverable = true
     and not public.forge_matching_preferences_complete(new.id) then
    new.is_discoverable := false;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_profile_matching_eligibility() from public, anon, authenticated;
drop trigger if exists profiles_enforce_matching_eligibility on public.profiles;
create trigger profiles_enforce_matching_eligibility
before insert or update of is_discoverable on public.profiles
for each row execute function public.enforce_profile_matching_eligibility();

create or replace function public.hide_profile_when_matching_eligibility_is_lost()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  if not public.forge_matching_preferences_complete(v_user_id) then
    perform set_config('forge.allow_system_writes', 'on', true);
    update public.profiles
    set is_discoverable = false, updated_at = now()
    where id = v_user_id;
    update public.profile_preferences
    set discovery_enabled = false, updated_at = now()
    where user_id = v_user_id;
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.hide_profile_when_matching_eligibility_is_lost() from public, anon, authenticated;
drop trigger if exists profile_preferences_hide_ineligible on public.profile_preferences;
create trigger profile_preferences_hide_ineligible
after insert or update of gender_identity, interested_in, preferred_age_min, preferred_age_max, max_distance_miles
on public.profile_preferences
for each row execute function public.hide_profile_when_matching_eligibility_is_lost();

drop trigger if exists profile_private_details_hide_matching_ineligible on public.profile_private_details;
create trigger profile_private_details_hide_matching_ineligible
after insert or update of latitude, longitude on public.profile_private_details
for each row execute function public.hide_profile_when_matching_eligibility_is_lost();

create or replace function public.set_my_discovery_visibility(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.profile_status;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.ensure_foundational_user_records(v_uid);
  perform set_config('forge.allow_system_writes', 'on', true);

  select p.status into v_status from public.profiles p where p.id = v_uid;
  if not found or v_status in ('deactivated', 'hidden') then
    return jsonb_build_object('ok', false, 'enabled', false, 'can_enable', false,
      'message', 'Discovery visibility is unavailable for this account.');
  end if;

  if p_enabled and not public.can_activate_discovery_visibility(v_uid) then
    return jsonb_build_object('ok', false, 'enabled', false, 'can_enable', false,
      'message', 'Complete adult eligibility, matching preferences, and private location before entering Discovery.');
  end if;

  if p_enabled then
    update public.profiles
    set status = 'active', is_discoverable = true, last_active_at = now(), updated_at = now()
    where id = v_uid;
    update public.profile_preferences set discovery_enabled = true, updated_at = now()
    where user_id = v_uid;
  else
    update public.profiles set is_discoverable = false, updated_at = now() where id = v_uid;
    update public.profile_preferences set discovery_enabled = false, updated_at = now()
    where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'enabled', p_enabled,
    'can_enable', public.can_activate_discovery_visibility(v_uid),
    'message', case when p_enabled then 'You are now visible in Discovery.'
      else 'You are hidden from Discovery. Existing connections were kept.' end
  );
end;
$$;

revoke all on function public.set_my_discovery_visibility(boolean) from public, anon;
grant execute on function public.set_my_discovery_visibility(boolean) to authenticated;

create or replace function public.list_eligible_discovery_profiles(p_limit int default 50)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = public, pg_catalog
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
      where c.status = 'active'
        and c.user_a_id = least(v_uid, dp.id)
        and c.user_b_id = greatest(v_uid, dp.id)
    )
  order by
    (select p.last_active_at from public.profiles p where p.id = dp.id) desc nulls last,
    (select p.updated_at from public.profiles p where p.id = dp.id) desc nulls last,
    dp.id asc
  limit v_limit;
end;
$$;

revoke all on function public.list_eligible_discovery_profiles(int) from public, anon;
grant execute on function public.list_eligible_discovery_profiles(int) to authenticated;

create or replace function public.get_eligible_discovery_profile(p_profile_id uuid)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_profile_id is null or p_profile_id = v_uid then return; end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then return; end if;
  if not public.forge_profiles_match_preferences(v_uid, p_profile_id) then return; end if;

  return query
  select dp.* from public.discoverable_profiles dp
  where dp.id = p_profile_id
  limit 1;
end;
$$;

revoke all on function public.get_eligible_discovery_profile(uuid) from public, anon;
grant execute on function public.get_eligible_discovery_profile(uuid) to authenticated;

-- Existing records fail closed until members complete matching preferences and location.
select set_config('forge.allow_system_writes', 'on', true);
update public.profiles p
set is_discoverable = false, updated_at = now()
where p.is_discoverable = true
  and not public.forge_matching_preferences_complete(p.id);

update public.profile_preferences pref
set discovery_enabled = false, updated_at = now()
where pref.discovery_enabled = true
  and not public.forge_matching_preferences_complete(pref.user_id);
