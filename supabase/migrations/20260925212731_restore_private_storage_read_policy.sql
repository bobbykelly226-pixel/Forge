begin;

-- The view-once policy called two public helpers whose EXECUTE permission is
-- intentionally withheld from members. PostgreSQL may evaluate that policy
-- even for objects in the profile-photos bucket, so signing owner photos fails.
-- Keep the public helpers private and move the authorization check behind a
-- current-user-only wrapper in the unexposed private schema.
create or replace function private.can_read_reusable_conversation_attachment(p_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select (select auth.uid()) is not null
    and array_length(storage.foldername(p_name), 1) >= 2
    and private.can_access_own_conversation_history(
      ((storage.foldername(p_name))[1])::uuid
    )
    and public.forge_storage_path_is_reusable_attachment(p_name);
$$;

revoke all on function private.can_read_reusable_conversation_attachment(text)
  from public, anon;
grant execute on function private.can_read_reusable_conversation_attachment(text)
  to authenticated, service_role;

drop policy if exists "Authorized participants read reusable conversation attachments"
  on storage.objects;
create policy "Authorized participants read reusable conversation attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'conversation-attachments'
  and private.can_read_reusable_conversation_attachment(name)
);

commit;
