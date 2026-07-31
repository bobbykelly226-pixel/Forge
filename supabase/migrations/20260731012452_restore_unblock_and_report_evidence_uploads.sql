-- Restore unblock messaging and repair private report-evidence uploads.
--
-- The original evidence INSERT policy counted the uploaded filename as a
-- folder. storage.foldername() returns folders only, so a valid
-- reporter/submission/file path has two folders rather than three.
--
-- Block audits now remember whether the block ended an active connection.
-- Unblock reopens that exact connection only after the final block between
-- the pair is removed.

drop policy if exists "Reporters upload private evidence" on storage.objects;
create policy "Reporters upload private evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'report-evidence'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] ~*
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

alter table public.safety_action_audit
  add column if not exists connection_was_active boolean not null default false,
  add column if not exists messaging_reopened boolean not null default false;

-- Compatibility for blocks created after the audit table was introduced but
-- before it recorded the pre-block lifecycle state. This is limited to each
-- currently effective block's latest audit row.
with latest_effective_blocks as (
  select distinct on (audit.actor_user_id, audit.target_user_id)
    audit.id
  from public.safety_action_audit audit
  join public.user_blocks blocks
    on blocks.blocker_id = audit.actor_user_id
   and blocks.blocked_id = audit.target_user_id
  join public.conversations conversations
    on conversations.id = audit.conversation_id
  where audit.action = 'block'
    and conversations.status = 'ended'
  order by
    audit.actor_user_id,
    audit.target_user_id,
    audit.created_at desc,
    audit.id desc
)
update public.safety_action_audit audit
set connection_was_active = true
from latest_effective_blocks latest
where audit.id = latest.id;

create or replace function public.block_user(p_blocked_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_ended_at timestamptz := now();
  v_rows integer := 0;
  v_connection_id uuid;
  v_conversation_id uuid;
  v_connection_was_active boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot block yourself.');
  end if;

  select ordered.user_a_id, ordered.user_b_id
  into v_a, v_b
  from public.forge_order_pair(v_uid, p_blocked_user_id) ordered;

  select
    connections.id,
    conversations.id,
    connections.status = 'active' and conversations.status = 'active'
  into
    v_connection_id,
    v_conversation_id,
    v_connection_was_active
  from public.connections connections
  left join public.conversations conversations
    on conversations.connection_id = connections.id
  where connections.user_a_id = v_a
    and connections.user_b_id = v_b
  limit 1;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_uid, p_blocked_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
  get diagnostics v_rows = row_count;

  update public.connections
  set status = 'ended', updated_at = v_ended_at
  where id = v_connection_id and status = 'active';

  update public.conversations
  set
    status = 'ended',
    ended_at = coalesce(ended_at, v_ended_at),
    ended_by_user_id = coalesce(ended_by_user_id, v_uid),
    updated_at = v_ended_at
  where id = v_conversation_id and status = 'active';

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id,
      target_user_id,
      conversation_id,
      action,
      connection_was_active
    )
    values (
      v_uid,
      p_blocked_user_id,
      v_conversation_id,
      'block',
      coalesce(v_connection_was_active, false)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'blocked', true,
    'already_blocked', v_rows = 0,
    'ended_at', v_ended_at
  );
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_blocked_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows integer := 0;
  v_connection_id uuid;
  v_conversation_id uuid;
  v_restore_connection boolean := false;
  v_messaging_reopened boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot unblock yourself.');
  end if;

  select audit.connection_was_active
  into v_restore_connection
  from public.safety_action_audit audit
  where audit.actor_user_id = v_uid
    and audit.target_user_id = p_blocked_user_id
    and audit.action = 'block'
  order by audit.created_at desc, audit.id desc
  limit 1;

  delete from public.user_blocks
  where blocker_id = v_uid and blocked_id = p_blocked_user_id;
  get diagnostics v_rows = row_count;

  select connections.id, conversations.id
  into v_connection_id, v_conversation_id
  from public.connections connections
  left join public.conversations conversations
    on conversations.connection_id = connections.id
  where
    (connections.user_a_id = v_uid and connections.user_b_id = p_blocked_user_id)
    or
    (connections.user_a_id = p_blocked_user_id and connections.user_b_id = v_uid)
  limit 1;

  if v_rows > 0
     and coalesce(v_restore_connection, false)
     and not public.forge_users_blocked(v_uid, p_blocked_user_id)
  then
    perform set_config('forge.allow_system_writes', 'on', true);

    update public.connections
    set status = 'active', updated_at = now()
    where id = v_connection_id and status = 'ended';

    update public.conversations
    set
      status = 'active',
      ended_at = null,
      ended_by_user_id = null,
      updated_at = now()
    where id = v_conversation_id and status = 'ended';

    v_messaging_reopened := found;
  end if;

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id,
      target_user_id,
      conversation_id,
      action,
      messaging_reopened
    )
    values (
      v_uid,
      p_blocked_user_id,
      v_conversation_id,
      'unblock',
      v_messaging_reopened
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'unblocked', v_rows > 0,
    'already_unblocked', v_rows = 0,
    'connection_restored', v_messaging_reopened,
    'messaging_reopened', v_messaging_reopened
  );
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;
