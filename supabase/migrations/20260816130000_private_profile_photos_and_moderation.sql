begin;

-- Profile photos contain sensitive user content. Keep the bucket private and
-- authorize reads through an explicit owner-or-eligible-viewer rule.
update storage.buckets
set public = false
where id = 'profile-photos';

drop policy if exists "Profile photos are publicly readable" on storage.objects;
drop policy if exists "Owners can read own profile photos" on storage.objects;
drop policy if exists "Authenticated can read discoverable profile photo files" on storage.objects;
drop policy if exists "Eligible members can read profile photos" on storage.objects;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

drop function if exists public.can_read_profile_photo_object(text);

create or replace function private.can_read_profile_photo_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select auth.uid() is not null
    and (
      split_part(p_name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.profile_photos ph
        where ph.storage_path = p_name
          and ph.moderation_status = 'approved'
          and exists (
            select 1
            from public.get_eligible_discovery_profile(ph.user_id)
          )
      )
    );
$$;

comment on function private.can_read_profile_photo_object(text) is
  'Allows owners to preview their photos and eligible authenticated Discovery viewers to read approved photos.';

revoke all on function private.can_read_profile_photo_object(text)
  from public, anon, authenticated;
grant execute on function private.can_read_profile_photo_object(text)
  to authenticated, service_role;

create policy "Eligible members can read profile photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-photos'
  and private.can_read_profile_photo_object(name)
);

-- Every new or replaced photo must be reviewed before Discovery can return it.
alter table public.profile_photos
  alter column moderation_status set default 'pending';

-- Existing photos were never reviewed. Fail closed and queue them for review.
update public.profile_photos
set moderation_status = 'pending'
where moderation_status = 'approved';

-- Public legacy URLs are incompatible with a private bucket and could bypass
-- the managed-photo moderation path.
update public.profiles
set profile_photo_url = null
where profile_photo_url is not null;

create or replace function public.protect_profile_photos_system_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
      new.moderation_status := 'pending';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'profile photo owner cannot be changed';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null
     and new.moderation_status is distinct from old.moderation_status then
    raise exception 'moderation status is system-managed';
  end if;

  if auth.uid() is not null
     and new.storage_path is distinct from old.storage_path then
    new.moderation_status := 'pending';
  end if;

  return new;
end;
$$;

comment on function public.protect_profile_photos_system_columns() is
  'Pins photo ownership and timestamps, prevents client moderation changes, and resets replaced photos to pending.';

commit;
