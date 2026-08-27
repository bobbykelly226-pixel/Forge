-- Restore the full Discovery eligibility gate after the account lifecycle
-- migration narrowed it to account status alone. Matching-preference
-- completeness also verifies a usable private location.
create or replace function public.can_activate_discovery_visibility(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.profile_private_details as details
      on details.user_id = profile.id
    where profile.id = p_user_id
      and profile.status not in ('paused', 'hidden', 'deactivated')
      and public.forge_is_adult_date_of_birth(
        details.date_of_birth,
        current_date
      )
      and public.forge_matching_preferences_complete(profile.id)
  );
$$;

revoke all on function public.can_activate_discovery_visibility(uuid)
  from public, anon;
grant execute on function public.can_activate_discovery_visibility(uuid)
  to authenticated, service_role;

-- Pin the catalog first for this privileged function so built-in names cannot
-- be shadowed by objects in the application schema.
alter function public.set_my_discovery_visibility(boolean)
  set search_path to pg_catalog, public;
