-- Lifestyle compatibility layers for pets, smoking, and drinking.
-- Preserves existing pets/smoking/drinking answers while adding optional
-- context + partner-preference fields for future compatibility evaluation.

-- ---------------------------------------------------------------------------
-- New columns (all optional / empty by default)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists pets_types text[] not null default '{}'::text[],
  add column if not exists pets_partner_preferences text[] not null default '{}'::text[],
  add column if not exists pets_allergy_constraint boolean not null default false,
  add column if not exists pets_allergy_types text[] not null default '{}'::text[],
  add column if not exists smoking_product_types text[] not null default '{}'::text[],
  add column if not exists smoking_product_other text,
  add column if not exists smoking_partner_preferences text[] not null default '{}'::text[],
  add column if not exists drinking_partner_preferences text[] not null default '{}'::text[];

comment on column public.profiles.pets is
  'Pets identity: yes | no | prefer_not_to_say (legacy dog/cat/multiple_pets/other/no_pets migrated).';
comment on column public.profiles.pets_types is
  'Optional multi-select pet types when pets = yes.';
comment on column public.profiles.pets_partner_preferences is
  'Optional partner pet openness selections. Empty means unknown, not acceptance.';
comment on column public.profiles.pets_allergy_constraint is
  'Distinct living constraint: pet allergies affect what the member can live with.';
comment on column public.profiles.pets_allergy_types is
  'Optional animal categories that affect allergies when pets_allergy_constraint is true.';
comment on column public.profiles.smoking_product_types is
  'Optional multi-select smoking-related product types when the member uses them.';
comment on column public.profiles.smoking_product_other is
  'Optional short text when smoking_product_types includes other.';
comment on column public.profiles.smoking_partner_preferences is
  'Optional partner smoking openness selections. Empty means unknown, not acceptance.';
comment on column public.profiles.drinking_partner_preferences is
  'Optional partner drinking openness selections. Empty means unknown, not acceptance.';

-- ---------------------------------------------------------------------------
-- Preserve existing answers: migrate pets identity + seed pets_types
-- ---------------------------------------------------------------------------
update public.profiles
set
  pets_types = case
    when pets = 'dog' and coalesce(array_length(pets_types, 1), 0) = 0 then array['dogs']::text[]
    when pets = 'cat' and coalesce(array_length(pets_types, 1), 0) = 0 then array['cats']::text[]
    when pets = 'other' and coalesce(array_length(pets_types, 1), 0) = 0 then array['other']::text[]
    else pets_types
  end,
  pets = case pets
    when 'no_pets' then 'no'
    when 'dog' then 'yes'
    when 'cat' then 'yes'
    when 'multiple_pets' then 'yes'
    when 'other' then 'yes'
    else pets
  end
where pets in ('no_pets', 'dog', 'cat', 'multiple_pets', 'other');

-- Align drinking slug with product language (Rarely) while preserving meaning.
update public.profiles
set drinking = 'rarely'
where drinking = 'occasionally';

-- ---------------------------------------------------------------------------
-- Discoverable view: expose pets_types for public context only.
-- Partner preference / allergy / product-detail fields remain owner-private.
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
  pets_types,
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
  'Public-safe discoverable profile fields only. Excludes DOB, postal/coords, partner lifestyle preferences, allergy constraints, smoking product details, status flags, and unmapped_legacy_fields.';

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
