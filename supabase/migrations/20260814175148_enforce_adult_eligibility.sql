-- Enforce Forge's 18+ eligibility requirement at the database boundary.
-- Full DOB remains owner-only in profile_private_details. Public age is derived.

create or replace function public.forge_profile_age(
  p_date_of_birth date,
  p_as_of date default current_date
)
returns integer
language sql
immutable
set search_path = pg_catalog
as $$
  select case
    when p_date_of_birth is null or p_as_of is null or p_date_of_birth > p_as_of then null
    else (
      extract(year from p_as_of)::integer - extract(year from p_date_of_birth)::integer
      - case
          when (p_date_of_birth + make_interval(
            years => extract(year from p_as_of)::integer - extract(year from p_date_of_birth)::integer
          ))::date > p_as_of
          then 1 else 0
        end
    )
  end;
$$;

create or replace function public.forge_is_adult_date_of_birth(
  p_date_of_birth date,
  p_as_of date default current_date
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select coalesce(
    public.forge_profile_age(p_date_of_birth, p_as_of) between 18 and 120,
    false
  );
$$;

comment on function public.forge_profile_age(date, date) is
  'Derives current age from private DOB. February 29 birthdays advance on February 28 in non-leap years.';
comment on function public.forge_is_adult_date_of_birth(date, date) is
  'True only for a valid, plausible DOB belonging to an adult age 18 through 120.';

revoke all on function public.forge_profile_age(date, date) from public, anon, authenticated;
revoke all on function public.forge_is_adult_date_of_birth(date, date) from public, anon, authenticated;

create or replace function public.enforce_adult_private_date_of_birth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.date_of_birth is not null
     and not public.forge_is_adult_date_of_birth(new.date_of_birth, current_date) then
    raise exception using
      errcode = '23514',
      message = 'profile_private_details: date_of_birth must belong to an adult age 18 through 120';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_adult_private_date_of_birth() from public, anon, authenticated;

drop trigger if exists profile_private_details_enforce_adult on public.profile_private_details;
create trigger profile_private_details_enforce_adult
before insert or update of date_of_birth on public.profile_private_details
for each row execute function public.enforce_adult_private_date_of_birth();

create or replace function public.sync_profile_age_from_private_date_of_birth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_date_of_birth date := case when tg_op = 'DELETE' then null else new.date_of_birth end;
begin
  perform set_config('forge.allow_system_writes', 'on', true);

  update public.profiles
  set
    age = public.forge_profile_age(v_date_of_birth, current_date),
    is_discoverable = case
      when public.forge_is_adult_date_of_birth(v_date_of_birth, current_date)
        then is_discoverable
      else false
    end,
    updated_at = now()
  where id = v_user_id;

  if not public.forge_is_adult_date_of_birth(v_date_of_birth, current_date) then
    update public.profile_preferences
    set discovery_enabled = false, updated_at = now()
    where user_id = v_user_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_profile_age_from_private_date_of_birth() from public, anon, authenticated;

drop trigger if exists profile_private_details_sync_public_age on public.profile_private_details;
create trigger profile_private_details_sync_public_age
after insert or update of date_of_birth or delete on public.profile_private_details
for each row execute function public.sync_profile_age_from_private_date_of_birth();

create or replace function public.enforce_profile_adult_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_date_of_birth date;
begin
  select d.date_of_birth into v_date_of_birth
  from public.profile_private_details d
  where d.user_id = new.id;

  if public.forge_is_adult_date_of_birth(v_date_of_birth, current_date) then
    new.age := public.forge_profile_age(v_date_of_birth, current_date);
  else
    new.age := null;
    new.is_discoverable := false;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_adult_eligibility() from public, anon, authenticated;

drop trigger if exists profiles_enforce_adult_eligibility on public.profiles;
create trigger profiles_enforce_adult_eligibility
before insert or update on public.profiles
for each row execute function public.enforce_profile_adult_eligibility();

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
  );
$$;

revoke all on function public.can_activate_discovery_visibility(uuid) from public, anon;
grant execute on function public.can_activate_discovery_visibility(uuid) to authenticated;

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
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_foundational_user_records(v_uid);
  perform set_config('forge.allow_system_writes', 'on', true);

  select p.status into v_status
  from public.profiles p
  where p.id = v_uid;

  if not found or v_status in ('deactivated', 'hidden') then
    return jsonb_build_object(
      'ok', false,
      'enabled', false,
      'can_enable', false,
      'message', 'Discovery visibility is unavailable for this account.'
    );
  end if;

  if p_enabled and not public.can_activate_discovery_visibility(v_uid) then
    return jsonb_build_object(
      'ok', false,
      'enabled', false,
      'can_enable', false,
      'message', 'Add a valid adult date of birth before entering Discovery.'
    );
  end if;

  if p_enabled then
    update public.profiles
    set status = 'active', is_discoverable = true, last_active_at = now(), updated_at = now()
    where id = v_uid;

    update public.profile_preferences
    set discovery_enabled = true, updated_at = now()
    where user_id = v_uid;
  else
    update public.profiles
    set is_discoverable = false, updated_at = now()
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

revoke all on function public.set_my_discovery_visibility(boolean) from public, anon;
grant execute on function public.set_my_discovery_visibility(boolean) to authenticated;

create or replace function public.forge_discoverable_age(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select public.forge_profile_age(d.date_of_birth, current_date)
  from public.profiles p
  join public.profile_private_details d on d.user_id = p.id
  where p.id = p_user_id
    and p.status = 'active'
    and p.is_discoverable = true
    and public.forge_is_adult_date_of_birth(d.date_of_birth, current_date);
$$;

comment on function public.forge_discoverable_age(uuid) is
  'Returns only the derived public age of an active, discoverable adult; never returns DOB.';
revoke all on function public.forge_discoverable_age(uuid) from public, anon;
grant execute on function public.forge_discoverable_age(uuid) to authenticated;

create or replace view public.discoverable_profiles
with (security_invoker = true)
as
select
  p.id,
  p.full_name,
  public.forge_discoverable_age(p.id) as age,
  p.location,
  p.location_city,
  p.location_region,
  p.location_country,
  p.relationship_goal,
  p.faith_identity,
  p.faith_tradition,
  p.faith_other,
  p.faith_importance,
  p.service_background,
  p.service_backgrounds,
  p.short_bio,
  p.more_about,
  p.children,
  p.has_children,
  p.children_count,
  p.open_to_partner_with_children,
  p.education,
  p.pets,
  p.pets_types,
  p.smoking,
  p.drinking,
  p.career,
  p.relocation,
  p.things_i_enjoy,
  p.favorite_music_artists,
  p.favorite_music_songs,
  p.profile_photo_url,
  p.relationship_goals
from public.profiles p
where p.status = 'active'::public.profile_status
  and p.is_discoverable = true
  and public.forge_discoverable_age(p.id) is not null;

comment on view public.discoverable_profiles is
  'Public-safe discoverable adult profile fields. Age is derived from private DOB; DOB is never exposed.';

grant select on public.discoverable_profiles to authenticated;
revoke all on public.discoverable_profiles from anon;

create or replace view public.discoverable_profile_photos
with (security_invoker = false)
as
select
  ph.id,
  ph.user_id,
  ph.storage_path,
  ph.display_order,
  ph.is_primary
from public.profile_photos ph
inner join public.profiles p on p.id = ph.user_id
where p.status = 'active'
  and p.is_discoverable = true
  and public.forge_discoverable_age(p.id) is not null
  and ph.moderation_status = 'approved';

comment on view public.discoverable_profile_photos is
  'Approved photo metadata for active, discoverable adult profiles. Excludes moderation status and DOB.';

grant select on public.discoverable_profile_photos to authenticated;
revoke all on public.discoverable_profile_photos from anon;

-- Existing beta profiles remain intact but fail closed until DOB is supplied.
select set_config('forge.allow_system_writes', 'on', true);

update public.profiles p
set age = null, is_discoverable = false, updated_at = now()
where not exists (
  select 1
  from public.profile_private_details d
  where d.user_id = p.id
    and public.forge_is_adult_date_of_birth(d.date_of_birth, current_date)
);

update public.profile_preferences pref
set discovery_enabled = false, updated_at = now()
where not exists (
  select 1
  from public.profile_private_details d
  where d.user_id = pref.user_id
    and public.forge_is_adult_date_of_birth(d.date_of_birth, current_date)
);
