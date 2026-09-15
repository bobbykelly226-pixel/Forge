-- Private optional requirements; empty arrays mean the requirement is off.
alter table public.profile_preferences add column non_negotiables jsonb not null
  default '{"smokeFree":false,"faith":[],"children":[]}'::jsonb;

create or replace function public.forge_valid_non_negotiables(v jsonb)
returns boolean language sql immutable security invoker
set search_path = pg_catalog, public
as $$
 select coalesce(jsonb_typeof(v) = 'object'
   and v ?& array['smokeFree','faith','children']
   and (v - array['smokeFree','faith','children']) = '{}'::jsonb
   and jsonb_typeof(v->'smokeFree') = 'boolean'
   and jsonb_typeof(v->'faith') = 'array'
   and jsonb_typeof(v->'children') = 'array'
   and (v->'faith') <@ '["christian","catholic","protestant","jewish","muslim","hindu","buddhist","spiritual","agnostic","atheist","other"]'::jsonb
   and (v->'children') <@ '["yes","no","open","unsure"]'::jsonb, false);
$$;
revoke all on function public.forge_valid_non_negotiables(jsonb) from public, anon;
grant execute on function public.forge_valid_non_negotiables(jsonb) to authenticated, service_role;
alter table public.profile_preferences add constraint profile_non_negotiables_valid
 check(public.forge_valid_non_negotiables(non_negotiables));

-- Pure comparison: no member data can be obtained through this function.
create or replace function public.forge_meets_non_negotiables(v jsonb, smoking text, faith text, children text)
returns boolean language sql immutable security invoker
set search_path = pg_catalog, public
as $$
 select coalesce(
   ((v->'smokeFree') = 'false'::jsonb or smoking = 'never')
   and ((v->'faith') = '[]'::jsonb or (faith is not null and faith <> 'prefer_not_to_say' and (v->'faith') ? faith))
   and ((v->'children') = '[]'::jsonb or (children is not null and children <> 'prefer_not_to_say' and (v->'children') ? children)), false);
$$;
revoke all on function public.forge_meets_non_negotiables(jsonb,text,text,text) from public, anon;
grant execute on function public.forge_meets_non_negotiables(jsonb,text,text,text) to authenticated, service_role;

-- Preserve all existing reciprocal age/gender/distance rules and grants.
create or replace function public.forge_profiles_match_preferences(p_viewer_id uuid, p_candidate_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
 select coalesce((select
   public.forge_matching_preferences_complete(p_viewer_id)
   and public.forge_matching_preferences_complete(p_candidate_id)
   and (vp.interested_in @> array[cp.gender_identity]::text[] or 'everyone' = any(vp.interested_in))
   and (cp.interested_in @> array[vp.gender_identity]::text[] or 'everyone' = any(cp.interested_in))
   and public.forge_profile_age(cd.date_of_birth,current_date) between vp.preferred_age_min and vp.preferred_age_max
   and public.forge_profile_age(vd.date_of_birth,current_date) between cp.preferred_age_min and cp.preferred_age_max
   and public.forge_private_distance_miles(vd.latitude,vd.longitude,cd.latitude,cd.longitude) <= least(vp.max_distance_miles,cp.max_distance_miles)
   and public.forge_meets_non_negotiables(vp.non_negotiables,c.smoking,c.faith_identity,c.children)
   and public.forge_meets_non_negotiables(cp.non_negotiables,v.smoking,v.faith_identity,v.children)
 from public.profile_preferences vp
 join public.profile_private_details vd on vd.user_id=vp.user_id
 join public.profile_preferences cp on cp.user_id=p_candidate_id
 join public.profile_private_details cd on cd.user_id=cp.user_id
 join public.profiles v on v.id=vp.user_id
 join public.profiles c on c.id=cp.user_id
 where vp.user_id=p_viewer_id and p_viewer_id is distinct from p_candidate_id),false);
$$;
-- Existing profile_preferences owner RLS and account deletion/export paths apply.
-- No migration changes member answers, Discovery visibility, or connection state.
