create or replace function public.forge_valid_non_negotiables(v jsonb)
returns boolean language sql immutable security invoker
set search_path = pg_catalog, public
as $$
 select coalesce(jsonb_typeof(v) = 'object'
   and v ?& array['smokeFree','faith','children']
   and (v - array['smokeFree','faith','children','drinking','pets']) = '{}'::jsonb
   and jsonb_typeof(v->'smokeFree') = 'boolean'
   and jsonb_typeof(v->'faith') = 'array'
   and jsonb_typeof(v->'children') = 'array'
   and (v->'faith') <@ '["christian","catholic","protestant","jewish","muslim","hindu","buddhist","spiritual","agnostic","atheist","other"]'::jsonb
   and (v->'children') <@ '["yes","no","open","unsure"]'::jsonb
   and jsonb_typeof(coalesce(v->'drinking','[]'::jsonb)) = 'array'
   and coalesce(v->'drinking','[]'::jsonb) <@ '["never","rarely","socially","regularly","in_recovery"]'::jsonb
   and jsonb_typeof(coalesce(v->'pets','[]'::jsonb)) = 'array'
   and coalesce(v->'pets','[]'::jsonb) <@ '["yes","no"]'::jsonb, false);
$$;

-- Missing new keys mean off for previously saved preferences.
create or replace function public.forge_meets_non_negotiables(v jsonb, smoking text, faith text, children text, drinking text, pets text)
returns boolean language sql immutable security invoker set search_path=pg_catalog,public as $$
select public.forge_meets_non_negotiables(v,smoking,faith,children)
 and coalesce(
  (coalesce(v->'drinking','[]'::jsonb)='[]'::jsonb or (v->'drinking') ? drinking)
  and (coalesce(v->'pets','[]'::jsonb)='[]'::jsonb or (v->'pets') ?
    case when pets in ('dog','cat','multiple_pets','other') then 'yes' when pets='no_pets' then 'no' else pets end),false);
$$;
revoke all on function public.forge_meets_non_negotiables(jsonb,text,text,text,text,text) from public,anon;
grant execute on function public.forge_meets_non_negotiables(jsonb,text,text,text,text,text) to authenticated,service_role;
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
   and public.forge_meets_non_negotiables(vp.non_negotiables,c.smoking,c.faith_identity,c.children,c.drinking,c.pets)
   and public.forge_meets_non_negotiables(cp.non_negotiables,v.smoking,v.faith_identity,v.children,v.drinking,v.pets)
 from public.profile_preferences vp
 join public.profile_private_details vd on vd.user_id=vp.user_id
 join public.profile_preferences cp on cp.user_id=p_candidate_id
 join public.profile_private_details cd on cd.user_id=cp.user_id
 join public.profiles v on v.id=vp.user_id
 join public.profiles c on c.id=cp.user_id
 where vp.user_id=p_viewer_id and p_viewer_id is distinct from p_candidate_id),false);
$$;
