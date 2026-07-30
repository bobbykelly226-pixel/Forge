-- Forge Safety Reporting Evidence & Unblock
-- Production migration version: 20260730191714
-- Private screenshot evidence, report abuse controls, auditable notifications,
-- reversible user blocking, and immutable safety-action history.

-- ---------------------------------------------------------------------------
-- 1. Private evidence and operational audit records
-- ---------------------------------------------------------------------------
create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.user_reports (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')
  ),
  file_size bigint not null check (file_size between 1 and 5242880),
  created_at timestamptz not null default now(),
  unique (report_id, storage_path)
);

comment on table public.report_evidence is
  'Immutable private screenshot evidence linked to an authoritative safety report.';

create index if not exists report_evidence_report_id_idx
  on public.report_evidence (report_id, created_at, id);
create index if not exists report_evidence_reporter_id_idx
  on public.report_evidence (reporter_id, created_at desc);

create table if not exists public.safety_report_notifications (
  report_id uuid primary key references public.user_reports (id) on delete cascade,
  provider text not null default 'resend' check (provider = 'resend'),
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'failed', 'not_configured')
  ),
  provider_message_id text null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  attempted_at timestamptz null,
  accepted_at timestamptz null,
  failed_at timestamptz null,
  last_error text null check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.safety_report_notifications is
  'Private delivery ledger for admin safety-report alerts. The report remains authoritative if delivery fails.';

create index if not exists safety_report_notifications_status_idx
  on public.safety_report_notifications (status, updated_at desc);
create unique index if not exists safety_report_notifications_provider_message_idx
  on public.safety_report_notifications (provider, provider_message_id)
  where provider_message_id is not null;

create table if not exists public.safety_action_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users (id) on delete set null,
  target_user_id uuid null references auth.users (id) on delete set null,
  conversation_id uuid null references public.conversations (id) on delete set null,
  action text not null check (action in ('block', 'unblock')),
  created_at timestamptz not null default now(),
  check (
    actor_user_id is null
    or target_user_id is null
    or actor_user_id <> target_user_id
  )
);

comment on table public.safety_action_audit is
  'Append-only audit trail for user block and unblock actions.';

create index if not exists safety_action_audit_actor_idx
  on public.safety_action_audit (actor_user_id, created_at desc);
create index if not exists safety_action_audit_target_idx
  on public.safety_action_audit (target_user_id, created_at desc);

alter table public.report_evidence enable row level security;
alter table public.safety_report_notifications enable row level security;
alter table public.safety_action_audit enable row level security;

revoke all on table public.report_evidence from public, anon, authenticated;
revoke all on table public.safety_report_notifications from public, anon, authenticated;
revoke all on table public.safety_action_audit from public, anon, authenticated;

create or replace function public.forge_reject_safety_record_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'Safety evidence and audit records are immutable.';
end;
$$;

revoke all on function public.forge_reject_safety_record_mutation()
  from public, anon, authenticated;

drop trigger if exists report_evidence_immutable on public.report_evidence;
create trigger report_evidence_immutable
before update or delete on public.report_evidence
for each row execute function public.forge_reject_safety_record_mutation();

drop trigger if exists safety_action_audit_immutable on public.safety_action_audit;
create trigger safety_action_audit_immutable
before update or delete on public.safety_action_audit
for each row execute function public.forge_reject_safety_record_mutation();

-- Reports must go through report_user so rate limits, duplicate checks, and
-- evidence validation cannot be bypassed with a direct table insert.
drop policy if exists "Reporters manage reports insert" on public.user_reports;
revoke insert, update, delete on table public.user_reports from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 2. Private report-evidence bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence',
  'report-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Reporters upload private evidence" on storage.objects;
create policy "Reporters upload private evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'report-evidence'
  and array_length(storage.foldername(name), 1) = 3
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] ~*
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create or replace function public.forge_report_evidence_is_linked(
  p_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.report_evidence evidence
    where evidence.storage_path = p_storage_path
  );
$$;

revoke all on function public.forge_report_evidence_is_linked(text)
  from public, anon, authenticated;

drop policy if exists "Reporters delete unlinked evidence" on storage.objects;
create policy "Reporters delete unlinked evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'report-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not public.forge_report_evidence_is_linked(storage.objects.name)
);

-- Deliberately no authenticated SELECT or UPDATE policy. Submitted evidence is
-- available only to trusted safety-review server operations.

-- ---------------------------------------------------------------------------
-- 3. Report rate limits, duplicate prevention, evidence binding, and delivery
-- ---------------------------------------------------------------------------
drop function if exists public.report_user(
  uuid, public.report_reason, text, uuid
);

create function public.report_user(
  p_reported_user_id uuid,
  p_reason public.report_reason,
  p_details text default null,
  p_conversation_id uuid default null,
  p_evidence jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_uid uuid := auth.uid();
  v_details text := nullif(trim(coalesce(p_details, '')), '');
  v_report_id uuid;
  v_existing_report_id uuid;
  v_evidence_count integer;
  v_item jsonb;
  v_path text;
  v_file_name text;
  v_mime_type text;
  v_file_size bigint;
  v_object record;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_reported_user_id is null or p_reported_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot report yourself.');
  end if;
  if p_reason is null then
    return jsonb_build_object('ok', false, 'message', 'A report reason is required.');
  end if;
  if v_details is not null and char_length(v_details) > 1000 then
    return jsonb_build_object('ok', false, 'message', 'Report details are too long.');
  end if;
  if p_conversation_id is not null
     and not public.forge_can_access_conversation_history(p_conversation_id, v_uid)
  then
    return jsonb_build_object('ok', false, 'message', 'Conversation not found.');
  end if;
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'array' then
    return jsonb_build_object('ok', false, 'message', 'Screenshot evidence is invalid.');
  end if;

  v_evidence_count := jsonb_array_length(p_evidence);
  if v_evidence_count > 3 then
    return jsonb_build_object(
      'ok', false, 'message', 'You can attach up to 3 screenshots.'
    );
  end if;

  select reports.id
  into v_existing_report_id
  from public.user_reports reports
  where reports.reporter_id = v_uid
    and reports.reported_user_id = p_reported_user_id
    and reports.reason = p_reason
    and reports.conversation_id is not distinct from p_conversation_id
    and reports.created_at >= now() - interval '10 minutes'
  order by reports.created_at desc
  limit 1;

  if v_existing_report_id is not null then
    return jsonb_build_object(
      'ok', true,
      'report_id', v_existing_report_id,
      'duplicate', true,
      'evidence_count', (
        select count(*)::integer
        from public.report_evidence evidence
        where evidence.report_id = v_existing_report_id
      )
    );
  end if;

  if (
    select count(*)
    from public.user_reports reports
    where reports.reporter_id = v_uid
      and reports.created_at >= now() - interval '24 hours'
  ) >= 10 then
    return jsonb_build_object(
      'ok', false,
      'message', 'You have submitted several reports recently. Please try again later.'
    );
  end if;

  for v_item in select value from jsonb_array_elements(p_evidence)
  loop
    v_path := nullif(trim(v_item ->> 'storage_path'), '');
    v_file_name := nullif(trim(v_item ->> 'file_name'), '');
    v_mime_type := lower(nullif(trim(v_item ->> 'mime_type'), ''));

    if coalesce(v_item ->> 'file_size', '') !~ '^[0-9]+$' then
      return jsonb_build_object('ok', false, 'message', 'Screenshot evidence is invalid.');
    end if;
    v_file_size := (v_item ->> 'file_size')::bigint;

    if v_path is null
       or split_part(v_path, '/', 1) <> v_uid::text
       or v_file_name is null
       or char_length(v_file_name) > 255
       or v_mime_type not in (
         'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
       )
       or v_file_size not between 1 and 5242880
    then
      return jsonb_build_object('ok', false, 'message', 'Screenshot evidence is invalid.');
    end if;

    select
      objects.name,
      objects.owner_id,
      objects.metadata
    into v_object
    from storage.objects
    where objects.bucket_id = 'report-evidence'
      and objects.name = v_path
    limit 1;

    if v_object.name is null
       or v_object.owner_id is distinct from v_uid::text
       or coalesce(lower(v_object.metadata ->> 'mimetype'), '') <> v_mime_type
       or coalesce(v_object.metadata ->> 'size', '') !~ '^[0-9]+$'
       or (v_object.metadata ->> 'size')::bigint <> v_file_size
    then
      return jsonb_build_object('ok', false, 'message', 'Screenshot evidence is invalid.');
    end if;
  end loop;

  if (
    select count(distinct value ->> 'storage_path')
    from jsonb_array_elements(p_evidence)
  ) <> v_evidence_count then
    return jsonb_build_object('ok', false, 'message', 'Screenshot evidence is invalid.');
  end if;

  insert into public.user_reports (
    reporter_id,
    reported_user_id,
    conversation_id,
    reason,
    details
  )
  values (
    v_uid,
    p_reported_user_id,
    p_conversation_id,
    p_reason,
    v_details
  )
  returning id into v_report_id;

  for v_item in select value from jsonb_array_elements(p_evidence)
  loop
    insert into public.report_evidence (
      report_id,
      reporter_id,
      storage_path,
      file_name,
      mime_type,
      file_size
    )
    values (
      v_report_id,
      v_uid,
      trim(v_item ->> 'storage_path'),
      trim(v_item ->> 'file_name'),
      lower(trim(v_item ->> 'mime_type')),
      (v_item ->> 'file_size')::bigint
    );
  end loop;

  insert into public.safety_report_notifications (report_id)
  values (v_report_id);

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'duplicate', false,
    'evidence_count', v_evidence_count
  );
end;
$$;

revoke all on function public.report_user(
  uuid, public.report_reason, text, uuid, jsonb
) from public, anon;
grant execute on function public.report_user(
  uuid, public.report_reason, text, uuid, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Audited block and unblock lifecycle
-- ---------------------------------------------------------------------------
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
  v_conversation_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot block yourself.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_uid, p_blocked_user_id)
  on conflict (blocker_id, blocked_id) do nothing;
  get diagnostics v_rows = row_count;

  select ordered.user_a_id, ordered.user_b_id
  into v_a, v_b
  from public.forge_order_pair(v_uid, p_blocked_user_id) ordered;

  select conversations.id
  into v_conversation_id
  from public.conversations conversations
  join public.connections connections
    on connections.id = conversations.connection_id
  where connections.user_a_id = v_a
    and connections.user_b_id = v_b
  limit 1;

  update public.connections
  set status = 'ended', updated_at = v_ended_at
  where user_a_id = v_a and user_b_id = v_b and status = 'active';

  update public.conversations conversations
  set
    status = 'ended',
    ended_at = coalesce(conversations.ended_at, v_ended_at),
    ended_by_user_id = coalesce(conversations.ended_by_user_id, v_uid),
    updated_at = v_ended_at
  from public.connections connections
  where conversations.connection_id = connections.id
    and connections.user_a_id = v_a
    and connections.user_b_id = v_b
    and conversations.status = 'active';

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id, target_user_id, conversation_id, action
    )
    values (v_uid, p_blocked_user_id, v_conversation_id, 'block');
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
  v_conversation_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Authentication required.');
  end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot unblock yourself.');
  end if;

  delete from public.user_blocks
  where blocker_id = v_uid and blocked_id = p_blocked_user_id;
  get diagnostics v_rows = row_count;

  select conversations.id
  into v_conversation_id
  from public.conversations conversations
  join public.connections connections
    on connections.id = conversations.connection_id
  where
    (connections.user_a_id = v_uid and connections.user_b_id = p_blocked_user_id)
    or
    (connections.user_a_id = p_blocked_user_id and connections.user_b_id = v_uid)
  limit 1;

  if v_rows > 0 then
    insert into public.safety_action_audit (
      actor_user_id, target_user_id, conversation_id, action
    )
    values (v_uid, p_blocked_user_id, v_conversation_id, 'unblock');
  end if;

  return jsonb_build_object(
    'ok', true,
    'unblocked', v_rows > 0,
    'already_unblocked', v_rows = 0,
    'connection_restored', false,
    'messaging_reopened', false
  );
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;
