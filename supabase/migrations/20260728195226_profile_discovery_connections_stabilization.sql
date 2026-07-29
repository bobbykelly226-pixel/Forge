-- Profile, Discovery, and Connections stabilization.
--
-- Relationship goals become multi-select while the singular field remains a
-- compatibility bridge. Connections receive a guarded public-profile loader
-- that is authorized by an existing relationship rather than Discovery RLS.

alter table public.profiles
  add column if not exists relationship_goals text[] not null default '{}';

update public.profiles
set relationship_goals = array[relationship_goal]
where relationship_goal is not null
  and cardinality(relationship_goals) = 0;

comment on column public.profiles.relationship_goals is
  'Ordered relationship goals selected by the profile owner. relationship_goal retains the first selection for backward compatibility.';

create or replace view public.discoverable_profiles
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
  profile_photo_url,
  relationship_goals
from public.profiles p
where p.status = 'active'::public.profile_status
  and p.is_discoverable = true;

comment on view public.discoverable_profiles is
  'Public-safe discoverable profile fields only. Excludes DOB, postal/coordinates, partner lifestyle preferences, allergy constraints, smoking product details, status flags, and unmapped legacy fields.';

grant select on public.discoverable_profiles to authenticated;
revoke all on public.discoverable_profiles from anon;

create or replace function public.load_connection_hub_profiles(
  p_profile_ids uuid[]
)
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

  return query
  select
    p.id, p.full_name, p.age, p.location, p.location_city, p.location_region,
    p.location_country, p.relationship_goal, p.faith_identity, p.faith_tradition,
    p.faith_other, p.faith_importance, p.service_background, p.service_backgrounds,
    p.short_bio, p.more_about, p.children, p.has_children, p.children_count,
    p.open_to_partner_with_children, p.education, p.pets, p.pets_types, p.smoking,
    p.drinking, p.career, p.relocation, p.things_i_enjoy,
    p.favorite_music_artists, p.favorite_music_songs, p.profile_photo_url,
    p.relationship_goals
  from public.profiles p
  where p.id = any(coalesce(p_profile_ids, '{}'::uuid[]))
    and p.id <> v_uid
    and p.status = 'active'::public.profile_status
    and not public.forge_users_blocked(v_uid, p.id)
    and (
      exists (
        select 1
        from public.connections c
        where c.status = 'active'
          and (
            (c.user_a_id = v_uid and c.user_b_id = p.id)
            or (c.user_a_id = p.id and c.user_b_id = v_uid)
          )
      )
      or exists (
        select 1
        from public.interests i
        where i.status in ('pending', 'mutual')
          and (
            (i.sender_id = v_uid and i.recipient_id = p.id)
            or (i.sender_id = p.id and i.recipient_id = v_uid)
          )
      )
      or exists (
        select 1
        from public.open_to_chat_requests o
        where o.status in ('pending', 'deferred', 'accepted')
          and (
            (o.sender_id = v_uid and o.recipient_id = p.id)
            or (o.sender_id = p.id and o.recipient_id = v_uid)
          )
      )
      or (
        p.is_discoverable = true
        and exists (
          select 1
          from public.saved_profiles s
          where s.saver_id = v_uid
            and s.saved_id = p.id
        )
      )
    )
  order by p.id
  limit 100;
end;
$$;

comment on function public.load_connection_hub_profiles(uuid[]) is
  'Returns only public profile fields for requested users who have an authorized relationship with the signed-in caller. Unrelated, blocked, hidden, and deactivated users are excluded.';

revoke all on function public.load_connection_hub_profiles(uuid[])
  from public, anon;
grant execute on function public.load_connection_hub_profiles(uuid[])
  to authenticated, service_role;
