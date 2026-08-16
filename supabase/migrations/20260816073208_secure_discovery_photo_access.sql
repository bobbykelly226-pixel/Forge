-- Secure the legacy Discovery photo view and replace its application use with a
-- viewer-scoped RPC. Keeping the now-security-invoker view during rollout makes
-- this migration safe to apply before or after the matching application deploy.

alter view public.discoverable_profile_photos
  set (security_invoker = true);

comment on view public.discoverable_profile_photos is
  'Legacy approved-photo projection. Runs as the caller and therefore respects owner-only profile_photos RLS; application Discovery uses list_eligible_discovery_profile_photos instead.';

create or replace function public.list_eligible_discovery_profile_photos(
  p_profile_ids uuid[]
)
returns table (
  id uuid,
  user_id uuid,
  storage_path text,
  display_order integer,
  is_primary boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile_ids uuid[];
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_profile_ids is null or cardinality(p_profile_ids) = 0 then
    return;
  end if;

  select array_agg(requested_id order by requested_id)
  into v_profile_ids
  from (
    select distinct requested_id
    from unnest(p_profile_ids) as requested(requested_id)
    where requested_id is not null
    limit 101
  ) deduplicated;

  if coalesce(cardinality(v_profile_ids), 0) > 100 then
    raise exception 'At most 100 profile IDs may be requested';
  end if;

  return query
  select
    ph.id,
    ph.user_id,
    ph.storage_path,
    ph.display_order,
    ph.is_primary
  from public.profile_photos ph
  where ph.user_id = any(v_profile_ids)
    and ph.moderation_status = 'approved'
    and exists (
      select 1
      from public.get_eligible_discovery_profile(ph.user_id)
    )
  order by ph.user_id, ph.display_order, ph.id;
end;
$$;

comment on function public.list_eligible_discovery_profile_photos(uuid[]) is
  'Returns approved photo metadata only for requested profiles the authenticated viewer is eligible to discover.';

revoke all on function public.list_eligible_discovery_profile_photos(uuid[])
  from public, anon, authenticated;
grant execute on function public.list_eligible_discovery_profile_photos(uuid[])
  to authenticated;
