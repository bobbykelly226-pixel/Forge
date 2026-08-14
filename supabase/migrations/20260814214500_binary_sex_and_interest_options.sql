-- Limit Forge matching to the product's supported binary sex choices and
-- the three corresponding interest choices: Men, Women, or Both.

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
      and pref.gender_identity in ('woman', 'man')
      and cardinality(pref.interested_in) = 1
      and pref.interested_in <@ array['woman', 'man', 'everyone']::text[]
      and pref.preferred_age_min between 18 and 100
      and pref.preferred_age_max between pref.preferred_age_min and 100
      and pref.max_distance_miles between 5 and 500
      and d.latitude between -90 and 90
      and d.longitude between -180 and 180
  );
$$;

-- Preserve valid beta answers. Convert a prior selection of both specific
-- sexes to the new single "Both" value and clear unsupported selections.
update public.profile_preferences
set gender_identity = case
      when gender_identity in ('man', 'woman') then gender_identity
      else null
    end,
    interested_in = case
      when 'everyone' = any(interested_in) then array['everyone']::text[]
      when interested_in @> array['man', 'woman']::text[] then array['everyone']::text[]
      when 'man' = any(interested_in) then array['man']::text[]
      when 'woman' = any(interested_in) then array['woman']::text[]
      else '{}'::text[]
    end,
    updated_at = now()
where gender_identity is not null
   or cardinality(interested_in) > 0;

alter table public.profile_preferences
  drop constraint if exists profile_preferences_supported_sex,
  drop constraint if exists profile_preferences_supported_interest;

alter table public.profile_preferences
  add constraint profile_preferences_supported_sex check (
    gender_identity is null or gender_identity in ('man', 'woman')
  ),
  add constraint profile_preferences_supported_interest check (
    cardinality(interested_in) <= 1
    and interested_in <@ array['woman', 'man', 'everyone']::text[]
  );

comment on column public.profile_preferences.gender_identity is
  'Private matching sex value. Forge supports man or woman.';

comment on column public.profile_preferences.interested_in is
  'Private single-choice matching preference: man (Men), woman (Women), or everyone (Both).';
