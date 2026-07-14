-- Structured profile fields + private location enrichment.
-- Preserves unmapped legacy values in profiles.unmapped_legacy_fields.
-- Public discoverable_profiles gains only public-safe structured columns
-- (never postal code, coordinates, or place IDs).

-- ---------------------------------------------------------------------------
-- profiles: new structured columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists faith_identity text,
  add column if not exists faith_tradition text,
  add column if not exists faith_other text,
  add column if not exists children_count text,
  add column if not exists open_to_partner_with_children text,
  add column if not exists service_backgrounds text[] not null default '{}'::text[],
  add column if not exists location_city text,
  add column if not exists location_region text,
  add column if not exists location_country text,
  add column if not exists unmapped_legacy_fields jsonb not null default '{}'::jsonb;

comment on column public.profiles.faith_identity is
  'Structured faith/religious identity slug (e.g. catholic, jewish). Distinct from faith_importance.';
comment on column public.profiles.faith_tradition is
  'Optional denomination/tradition free text; never inferred automatically.';
comment on column public.profiles.faith_other is
  'Optional short custom description when faith_identity = other.';
comment on column public.profiles.children_count is
  'Structured children count slug when has_children = yes.';
comment on column public.profiles.open_to_partner_with_children is
  'Structured openness to a partner who has children.';
comment on column public.profiles.service_backgrounds is
  'Structured multi-select service background slugs.';
comment on column public.profiles.location_city is
  'Public-safe city component of standardized location.';
comment on column public.profiles.location_region is
  'Public-safe state/region component of standardized location.';
comment on column public.profiles.location_country is
  'Public-safe country code/name for standardized location.';
comment on column public.profiles.unmapped_legacy_fields is
  'Original free-text values that could not be mapped to structured slugs.';

-- ---------------------------------------------------------------------------
-- profile_private_details: precise / matching-related location only
-- ---------------------------------------------------------------------------
alter table public.profile_private_details
  add column if not exists location_city text,
  add column if not exists location_region text,
  add column if not exists location_country text,
  add column if not exists location_place_id text,
  add column if not exists location_provider text;

comment on column public.profile_private_details.postal_code is
  'Owner-only postal code. Never exposed on discoverable_profiles.';
comment on column public.profile_private_details.latitude is
  'Owner-only latitude for future distance matching. Never public.';
comment on column public.profile_private_details.longitude is
  'Owner-only longitude for future distance matching. Never public.';
comment on column public.profile_private_details.location_place_id is
  'Owner-only provider place id. Never public.';
comment on column public.profile_private_details.location_provider is
  'Geocoding provider used for private location (e.g. open-meteo, nominatim).';

-- ---------------------------------------------------------------------------
-- Legacy value translation helpers (SQL)
-- ---------------------------------------------------------------------------
create or replace function public.forge_normalize_token(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '_' from regexp_replace(lower(trim(coalesce(raw, ''))), '[^a-z0-9]+', '_', 'g')),
    ''
  );
$$;

create or replace function public.forge_map_legacy_profile_row(p public.profiles)
returns public.profiles
language plpgsql
as $$
declare
  v public.profiles := p;
  legacy jsonb := coalesce(p.unmapped_legacy_fields, '{}'::jsonb);
  token text;
  mapped_services text[] := '{}'::text[];
  leftover text[] := '{}'::text[];
  city text;
  region text;
  country text;
  parts text[];
begin
  -- relationship_goal
  token := public.forge_normalize_token(p.relationship_goal);
  if token is null then
    null;
  elsif token in ('marriage', 'marriage_minded') then
    v.relationship_goal := 'marriage';
  elsif token in ('serious_relationship', 'long_term_relationship') then
    v.relationship_goal := 'serious_relationship';
  elsif token in ('intentional_dating', 'open_to_serious_dating') then
    v.relationship_goal := 'intentional_dating';
  elsif token in ('getting_to_know_someone', 'not_sure_yet_but_intentional') then
    v.relationship_goal := 'getting_to_know_someone';
  elsif p.relationship_goal is not null then
    legacy := legacy || jsonb_build_object('relationship_goal', p.relationship_goal);
    v.relationship_goal := null;
  end if;

  -- has_children
  token := public.forge_normalize_token(p.has_children);
  if token is null then
    null;
  elsif token in ('yes', 'y', 'true') then
    v.has_children := 'yes';
  elsif token in ('no', 'n', 'false') then
    v.has_children := 'no';
  elsif token in ('prefer_not_to_say', 'prefer_not') then
    v.has_children := 'prefer_not_to_say';
  elsif p.has_children is not null then
    legacy := legacy || jsonb_build_object('has_children', p.has_children);
    v.has_children := null;
  end if;

  -- children (wants children)
  token := public.forge_normalize_token(p.children);
  if token is null then
    null;
  elsif token in ('yes') then
    v.children := 'yes';
  elsif token in ('no') then
    v.children := 'no';
  elsif token in ('open', 'open_to_it', 'open_to_children', 'maybe') then
    v.children := 'open';
  elsif token in ('unsure') then
    v.children := 'unsure';
  elsif token in ('prefer_not_to_say') then
    v.children := 'prefer_not_to_say';
  elsif p.children is not null then
    legacy := legacy || jsonb_build_object('children', p.children);
    v.children := null;
  end if;

  -- faith_importance
  token := public.forge_normalize_token(p.faith_importance);
  if token is null then
    null;
  elsif token = 'very_important' then
    v.faith_importance := 'very_important';
  elsif token = 'important' then
    v.faith_importance := 'important';
  elsif token = 'somewhat_important' then
    v.faith_importance := 'somewhat_important';
  elsif token = 'not_important' then
    v.faith_importance := 'not_important';
  elsif token = 'prefer_not_to_say' then
    v.faith_importance := 'prefer_not_to_say';
  elsif p.faith_importance is not null then
    legacy := legacy || jsonb_build_object('faith_importance', p.faith_importance);
    v.faith_importance := null;
  end if;

  -- smoking
  token := public.forge_normalize_token(p.smoking);
  if token is null then
    null;
  elsif token in ('never', 'no', 'none') then
    v.smoking := 'never';
  elsif token in ('occasionally', 'sometimes') then
    v.smoking := 'occasionally';
  elsif token in ('regularly', 'yes') then
    v.smoking := 'regularly';
  elsif token in ('trying_to_quit', 'quitting') then
    v.smoking := 'trying_to_quit';
  elsif token = 'prefer_not_to_say' then
    v.smoking := 'prefer_not_to_say';
  elsif p.smoking is not null then
    legacy := legacy || jsonb_build_object('smoking', p.smoking);
    v.smoking := null;
  end if;

  -- drinking — ambiguous "yes" preserved unmapped
  token := public.forge_normalize_token(p.drinking);
  if token is null then
    null;
  elsif token = 'yes' then
    legacy := legacy || jsonb_build_object('drinking', p.drinking);
    v.drinking := null;
  elsif token in ('never', 'no', 'none') then
    v.drinking := 'never';
  elsif token in ('occasionally', 'sometimes') then
    v.drinking := 'occasionally';
  elsif token in ('socially', 'social') then
    v.drinking := 'socially';
  elsif token = 'regularly' then
    v.drinking := 'regularly';
  elsif token in ('in_recovery', 'recovery') then
    v.drinking := 'in_recovery';
  elsif token = 'prefer_not_to_say' then
    v.drinking := 'prefer_not_to_say';
  elsif p.drinking is not null then
    legacy := legacy || jsonb_build_object('drinking', p.drinking);
    v.drinking := null;
  end if;

  -- education — ambiguous "college" preserved unmapped
  token := public.forge_normalize_token(p.education);
  if token is null then
    null;
  elsif token in ('college', 'university') then
    legacy := legacy || jsonb_build_object('education', p.education);
    v.education := null;
  elsif token in ('high_school', 'hs') then
    v.education := 'high_school';
  elsif token in ('trade_vocational', 'trade', 'vocational') then
    v.education := 'trade_vocational';
  elsif token = 'some_college' then
    v.education := 'some_college';
  elsif token in ('associate', 'associates', 'associate_degree') then
    v.education := 'associate';
  elsif token in ('bachelors', 'bachelor', 'bachelors_degree') then
    v.education := 'bachelors';
  elsif token in ('graduate_professional', 'graduate', 'masters', 'phd') then
    v.education := 'graduate_professional';
  elsif token = 'other' then
    v.education := 'other';
  elsif token = 'prefer_not_to_say' then
    v.education := 'prefer_not_to_say';
  elsif p.education is not null then
    legacy := legacy || jsonb_build_object('education', p.education);
    v.education := null;
  end if;

  -- pets
  token := public.forge_normalize_token(p.pets);
  if token is null then
    null;
  elsif token in ('no_pets', 'no', 'none') then
    v.pets := 'no_pets';
  elsif token in ('dog', 'dogs') then
    v.pets := 'dog';
  elsif token in ('cat', 'cats') then
    v.pets := 'cat';
  elsif token in ('multiple_pets', 'multiple') then
    v.pets := 'multiple_pets';
  elsif token = 'other' then
    v.pets := 'other';
  elsif token = 'prefer_not_to_say' then
    v.pets := 'prefer_not_to_say';
  elsif p.pets is not null then
    legacy := legacy || jsonb_build_object('pets', p.pets);
    v.pets := null;
  end if;

  -- relocation
  token := public.forge_normalize_token(p.relocation);
  if token is null then
    null;
  elsif token in ('not_open', 'no', 'not_open_to_relocating') then
    v.relocation := 'not_open';
  elsif token in ('possibly', 'maybe') then
    v.relocation := 'possibly';
  elsif token in ('open', 'yes', 'open_to_relocating') then
    v.relocation := 'open';
  elsif token = 'prefer_not_to_say' then
    v.relocation := 'prefer_not_to_say';
  elsif p.relocation is not null then
    legacy := legacy || jsonb_build_object('relocation', p.relocation);
    v.relocation := null;
  end if;

  -- service backgrounds (multi)
  if coalesce(array_length(p.service_backgrounds, 1), 0) = 0
     and p.service_background is not null
     and length(trim(p.service_background)) > 0 then
    foreach token in array regexp_split_to_array(p.service_background, '[,;/|]+')
    loop
      token := public.forge_normalize_token(token);
      if token is null then
        continue;
      elsif token in ('military', 'army', 'navy', 'veteran') then
        mapped_services := array_append(mapped_services, 'military');
      elsif token in ('law_enforcement', 'police', 'officer') then
        mapped_services := array_append(mapped_services, 'law_enforcement');
      elsif token in ('fire_ems', 'fire', 'ems', 'emt', 'paramedic') then
        mapped_services := array_append(mapped_services, 'fire_ems');
      elsif token in ('healthcare', 'nurse', 'nursing', 'doctor', 'medical') then
        mapped_services := array_append(mapped_services, 'healthcare');
      elsif token in ('education', 'teacher') then
        mapped_services := array_append(mapped_services, 'education');
      elsif token in ('community_service', 'volunteer') then
        mapped_services := array_append(mapped_services, 'community_service');
      elsif token = 'other' then
        mapped_services := array_append(mapped_services, 'other');
      elsif token = 'none' then
        mapped_services := array_append(mapped_services, 'none');
      elsif token = 'prefer_not_to_say' then
        mapped_services := array_append(mapped_services, 'prefer_not_to_say');
      else
        leftover := array_append(leftover, token);
      end if;
    end loop;

    mapped_services := (
      select coalesce(array_agg(distinct s), '{}'::text[])
      from unnest(mapped_services) as s
    );
    v.service_backgrounds := mapped_services;

    if array_length(leftover, 1) is not null then
      legacy := legacy || jsonb_build_object('service_background', array_to_string(leftover, ', '));
    end if;

    -- Keep a human-readable summary for older clients; structured array is authoritative.
    if 'prefer_not_to_say' = any (mapped_services) then
      v.service_background := null;
    elsif 'none' = any (mapped_services) and array_length(mapped_services, 1) = 1 then
      v.service_background := null;
    elsif array_length(mapped_services, 1) is not null then
      v.service_background := array_to_string(mapped_services, ', ');
    end if;
  end if;

  -- location city/region from legacy free text when structured empty
  if (p.location_city is null or length(trim(p.location_city)) = 0)
     and p.location is not null
     and length(trim(p.location)) > 0 then
    parts := regexp_split_to_array(p.location, '\s*,\s*');
    city := nullif(trim(parts[1]), '');
    region := nullif(trim(coalesce(parts[2], '')), '');
    country := nullif(trim(coalesce(parts[3], '')), '');

    if region is not null then
      if lower(region) = 'colorado' then region := 'CO';
      elsif lower(region) = 'california' then region := 'CA';
      elsif lower(region) = 'texas' then region := 'TX';
      elsif lower(region) = 'new york' then region := 'NY';
      elsif lower(region) = 'florida' then region := 'FL';
      elsif length(region) = 2 then region := upper(region);
      end if;
    end if;

    if country is null and region ~ '^[A-Z]{2}$' then
      country := 'US';
    end if;

    v.location_city := city;
    v.location_region := region;
    v.location_country := country;

    if city is not null and region is not null then
      v.location := city || ', ' || region;
    end if;
  end if;

  v.unmapped_legacy_fields := legacy;
  return v;
end;
$$;

-- Apply translation once to existing rows
do $$
declare
  r public.profiles;
  m public.profiles;
begin
  for r in select * from public.profiles loop
    m := public.forge_map_legacy_profile_row(r);
    update public.profiles
    set
      relationship_goal = m.relationship_goal,
      has_children = m.has_children,
      children = m.children,
      faith_importance = m.faith_importance,
      smoking = m.smoking,
      drinking = m.drinking,
      education = m.education,
      pets = m.pets,
      relocation = m.relocation,
      service_background = m.service_background,
      service_backgrounds = m.service_backgrounds,
      location = m.location,
      location_city = m.location_city,
      location_region = m.location_region,
      location_country = m.location_country,
      unmapped_legacy_fields = m.unmapped_legacy_fields
    where id = r.id;
  end loop;
end $$;

-- Sync private location city/region from public structured location (no coords yet)
insert into public.profile_private_details as ppd (
  user_id,
  location_city,
  location_region,
  location_country
)
select
  p.id,
  p.location_city,
  p.location_region,
  p.location_country
from public.profiles p
where p.location_city is not null or p.location_region is not null
on conflict (user_id) do update
set
  location_city = coalesce(excluded.location_city, ppd.location_city),
  location_region = coalesce(excluded.location_region, ppd.location_region),
  location_country = coalesce(excluded.location_country, ppd.location_country),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Refresh discoverable_profiles with new public-safe columns only
-- CASCADE drops dependent RPCs that return setof discoverable_profiles;
-- they are recreated immediately below.
-- ---------------------------------------------------------------------------
drop view if exists public.discoverable_profiles cascade;
create view public.discoverable_profiles
with (security_invoker = true)
as
select
  id,
  full_name,
  age,
  location,
  location_city,
  location_region,
  location_country,
  relationship_goal,
  faith_identity,
  faith_tradition,
  faith_other,
  faith_importance,
  service_background,
  service_backgrounds,
  short_bio,
  more_about,
  children,
  has_children,
  children_count,
  open_to_partner_with_children,
  education,
  pets,
  smoking,
  drinking,
  career,
  relocation,
  things_i_enjoy,
  favorite_music_artists,
  favorite_music_songs,
  profile_photo_url
from public.profiles p
where p.status = 'active'::public.profile_status
  and p.is_discoverable = true;

comment on view public.discoverable_profiles is
  'Public-safe discoverable profile fields only. Excludes DOB, postal code, coordinates, place IDs, status flags, and unmapped_legacy_fields.';

grant select on public.discoverable_profiles to authenticated;
revoke all on public.discoverable_profiles from anon;

-- Recreate discovery eligibility RPCs (dropped by CASCADE above)
create or replace function public.list_eligible_discovery_profiles(p_limit int default 50)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id <> v_uid
    and not public.forge_users_blocked(v_uid, dp.id)
    and not exists (
      select 1 from public.passed_profiles pp
      where pp.passer_id = v_uid and pp.passed_id = dp.id
    )
    and not exists (
      select 1 from public.connections c
      where c.status = 'active'
        and (
          (c.user_a_id = least(v_uid, dp.id) and c.user_b_id = greatest(v_uid, dp.id))
        )
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
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_profile_id is null or p_profile_id = v_uid then
    return;
  end if;

  if public.forge_users_blocked(v_uid, p_profile_id) then
    return;
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id = p_profile_id
  limit 1;
end;
$$;

revoke all on function public.get_eligible_discovery_profile(uuid) from public, anon;
grant execute on function public.get_eligible_discovery_profile(uuid) to authenticated;
