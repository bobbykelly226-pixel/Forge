begin;

-- RLS policies execute with the calling role's privileges. The original
-- parameterized public helper is intentionally not executable by members,
-- because accepting an arbitrary user id would allow cross-user probing.
-- Give policies a private wrapper that can only evaluate auth.uid().
create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.can_access_own_conversation_history(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.forge_can_access_conversation_history(
    p_conversation_id,
    (select auth.uid())
  );
$$;

comment on function private.can_access_own_conversation_history(uuid) is
  'Current-user-only helper for conversation RLS policies; not exposed as a public RPC.';

revoke all on function private.can_access_own_conversation_history(uuid)
  from public, anon;
grant execute on function private.can_access_own_conversation_history(uuid)
  to authenticated, service_role;

drop policy if exists "Authorized participants read conversation history"
  on public.conversations;
create policy "Authorized participants read conversation history"
on public.conversations for select to authenticated
using (private.can_access_own_conversation_history(id));

drop policy if exists "Authorized participants read conversation membership"
  on public.conversation_participants;
create policy "Authorized participants read conversation membership"
on public.conversation_participants for select to authenticated
using (private.can_access_own_conversation_history(conversation_id));

drop policy if exists "Authorized participants update own read state"
  on public.conversation_participants;
create policy "Authorized participants update own read state"
on public.conversation_participants for update to authenticated
using (
  user_id = (select auth.uid())
  and private.can_access_own_conversation_history(conversation_id)
)
with check (
  user_id = (select auth.uid())
  and private.can_access_own_conversation_history(conversation_id)
);

drop policy if exists "Authorized participants read conversation messages"
  on public.messages;
create policy "Authorized participants read conversation messages"
on public.messages for select to authenticated
using (private.can_access_own_conversation_history(conversation_id));

drop policy if exists "Authorized participants read conversation history attachments"
  on storage.objects;
create policy "Authorized participants read conversation history attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'conversation-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and private.can_access_own_conversation_history(
    ((storage.foldername(name))[1])::uuid
  )
);

-- Preserve the original helper's fail-closed public grants.
revoke all on function public.forge_can_access_conversation_history(uuid, uuid)
  from public, anon, authenticated;

commit;
