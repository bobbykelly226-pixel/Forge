-- Existing active connections remain accessible when discovery preferences change.
-- Keep authentication, block, active-account, age and visibility restrictions.
CREATE OR REPLACE FUNCTION public.get_eligible_discovery_profile(p_profile_id uuid)
RETURNS SETOF public.discoverable_profiles
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_profile_id is null or p_profile_id = v_uid then return; end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then return; end if;
  if not exists (
    select 1 from public.connections c
    where c.status = 'active'
      and ((c.user_a = v_uid and c.user_b = p_profile_id)
        or (c.user_b = v_uid and c.user_a = p_profile_id))
  ) and not public.forge_profiles_match_preferences(v_uid, p_profile_id) then
    return;
  end if;
  return query
  select dp.* from public.discoverable_profiles dp
  where dp.id = p_profile_id
  limit 1;
end;
$function$;
