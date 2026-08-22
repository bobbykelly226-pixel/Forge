-- Forge operator report-review console foundation.
-- Keeps member-submitted reports/evidence immutable while adding private case
-- state, append-only operator decisions, bounded enforcement, and appeal intake.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'operator_report_case_status') then
    create type public.operator_report_case_status as enum (
      'pending',
      'reviewing',
      'resolved',
      'dismissed'
    );
  end if;
end;
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.operator_report_cases (
  report_id uuid primary key references public.user_reports (id) on delete restrict,
  status public.operator_report_case_status not null default 'pending',
  assigned_operator_id uuid null references auth.users (id) on delete set null,
  escalated_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operator_report_cases_resolution_check check (
    (status in ('resolved', 'dismissed') and resolved_at is not null)
    or (status in ('pending', 'reviewing') and resolved_at is null)
  )
);

insert into public.operator_report_cases (report_id)
select reports.id
from public.user_reports reports
on conflict (report_id) do nothing;

create or replace function private.forge_create_operator_report_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.operator_report_cases (report_id)
  values (new.id)
  on conflict (report_id) do nothing;
  return new;
end;
$$;

revoke all on function private.forge_create_operator_report_case()
  from public, anon, authenticated, service_role;

drop trigger if exists user_reports_create_operator_case on public.user_reports;
create trigger user_reports_create_operator_case
after insert on public.user_reports
for each row execute function private.forge_create_operator_report_case();

create index if not exists operator_report_cases_queue_idx
  on public.operator_report_cases (status, updated_at desc, report_id);
create index if not exists operator_report_cases_assignee_idx
  on public.operator_report_cases (assigned_operator_id, updated_at desc)
  where assigned_operator_id is not null;

create table if not exists public.operator_report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.user_reports (id) on delete restrict,
  operator_id uuid not null references auth.users (id) on delete restrict,
  action text not null check (action in (
    'begin_review',
    'escalate',
    'warn',
    'restrict',
    'suspend',
    'remove',
    'safety_block',
    'resolve',
    'dismiss',
    'member_notification_sent',
    'member_notification_failed',
    'appeal_received',
    'appeal_upheld',
    'appeal_denied'
  )),
  reason text not null check (char_length(reason) between 3 and 2000),
  outcome text not null check (char_length(outcome) between 2 and 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operator_report_events_report_idx
  on public.operator_report_events (report_id, created_at desc, id desc);
create index if not exists operator_report_events_operator_idx
  on public.operator_report_events (operator_id, created_at desc, id desc);

create table if not exists public.operator_member_enforcements (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.user_reports (id) on delete restrict,
  target_user_id uuid not null references auth.users (id) on delete restrict,
  operator_id uuid not null references auth.users (id) on delete restrict,
  action text not null check (action in (
    'warn', 'restrict', 'suspend', 'remove', 'safety_block'
  )),
  reason text not null check (char_length(reason) between 3 and 2000),
  notification_outcome text not null default 'not_requested' check (
    notification_outcome in ('not_requested', 'pending', 'sent', 'failed')
  ),
  previous_profile_status public.profile_status null,
  previous_is_discoverable boolean null,
  created_at timestamptz not null default now()
);

create index if not exists operator_member_enforcements_target_idx
  on public.operator_member_enforcements (target_user_id, created_at desc, id desc);
create index if not exists operator_member_enforcements_report_idx
  on public.operator_member_enforcements (report_id, created_at desc, id desc);
create index if not exists operator_member_enforcements_operator_idx
  on public.operator_member_enforcements (operator_id, created_at desc, id desc);

create table if not exists public.safety_report_appeals (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.user_reports (id) on delete restrict,
  appellant_user_id uuid not null references auth.users (id) on delete restrict,
  details text not null check (char_length(details) between 10 and 2000),
  status text not null default 'pending' check (
    status in ('pending', 'reviewing', 'upheld', 'denied')
  ),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  unique (report_id, appellant_user_id)
);

create index if not exists safety_report_appeals_status_idx
  on public.safety_report_appeals (status, created_at, id);
create index if not exists safety_report_appeals_appellant_idx
  on public.safety_report_appeals (appellant_user_id, created_at desc, id desc);

alter table public.operator_report_cases enable row level security;
alter table public.operator_report_events enable row level security;
alter table public.operator_member_enforcements enable row level security;
alter table public.safety_report_appeals enable row level security;

revoke all on table public.operator_report_cases from public, anon, authenticated;
revoke all on table public.operator_report_events from public, anon, authenticated;
revoke all on table public.operator_member_enforcements from public, anon, authenticated;
revoke all on table public.safety_report_appeals from public, anon, authenticated;

grant select, insert, update on table public.operator_report_cases to service_role;
grant select, insert on table public.operator_report_events to service_role;
grant select, insert, update on table public.operator_member_enforcements to service_role;
grant select, insert, update on table public.safety_report_appeals to service_role;
grant select on table public.safety_report_appeals to authenticated;

drop policy if exists "Members read own safety appeals" on public.safety_report_appeals;
create policy "Members read own safety appeals"
on public.safety_report_appeals for select to authenticated
using (appellant_user_id = (select auth.uid()));

create or replace function public.forge_reject_operator_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'Operator safety audit records are append-only.';
end;
$$;

revoke all on function public.forge_reject_operator_audit_mutation()
  from public, anon, authenticated, service_role;

drop trigger if exists operator_report_events_immutable on public.operator_report_events;
create trigger operator_report_events_immutable
before update or delete on public.operator_report_events
for each row execute function public.forge_reject_operator_audit_mutation();

drop trigger if exists operator_member_enforcements_immutable
  on public.operator_member_enforcements;
create trigger operator_member_enforcements_immutable
before delete on public.operator_member_enforcements
for each row execute function public.forge_reject_operator_audit_mutation();

create or replace function private.forge_limit_enforcement_notification_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.notification_outcome = 'pending'
    and new.notification_outcome in ('sent', 'failed')
    and new.id = old.id
    and new.report_id = old.report_id
    and new.target_user_id = old.target_user_id
    and new.operator_id = old.operator_id
    and new.action = old.action
    and new.reason = old.reason
    and new.previous_profile_status is not distinct from old.previous_profile_status
    and new.previous_is_discoverable is not distinct from old.previous_is_discoverable
    and new.created_at = old.created_at
  then
    return new;
  end if;

  raise exception 'Enforcement records are immutable except for a pending notification outcome.';
end;
$$;

revoke all on function private.forge_limit_enforcement_notification_update()
  from public, anon, authenticated, service_role;

drop trigger if exists operator_member_enforcements_limit_update
  on public.operator_member_enforcements;
create trigger operator_member_enforcements_limit_update
before update on public.operator_member_enforcements
for each row execute function private.forge_limit_enforcement_notification_update();

create or replace function private.forge_enforce_operator_safety_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
begin
  select enforcement.action
  into v_action
  from public.operator_member_enforcements enforcement
  where enforcement.target_user_id = new.id
    and enforcement.action in ('restrict', 'suspend', 'remove', 'safety_block')
  order by enforcement.created_at desc, enforcement.id desc
  limit 1;

  if v_action is null then
    return new;
  end if;

  new.is_discoverable := false;
  new.status := case
    when v_action = 'remove' then 'deactivated'::public.profile_status
    when v_action = 'suspend' then 'paused'::public.profile_status
    else 'hidden'::public.profile_status
  end;
  return new;
end;
$$;

revoke all on function private.forge_enforce_operator_safety_state()
  from public, anon, authenticated, service_role;

drop trigger if exists profiles_enforce_operator_safety_state on public.profiles;
create trigger profiles_enforce_operator_safety_state
before insert or update of status, is_discoverable on public.profiles
for each row execute function private.forge_enforce_operator_safety_state();

-- Existing relationship and messaging RPCs already centralize pair safety
-- through forge_users_blocked. Extend that boundary so suspended or removed
-- members cannot start or continue interactions while their account record and
-- report evidence remain preserved.
create or replace function public.forge_users_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1
      from public.user_blocks block
      where (block.blocker_id = p_user_a and block.blocked_id = p_user_b)
         or (block.blocker_id = p_user_b and block.blocked_id = p_user_a)
    )
    or exists (
      select 1
      from public.operator_member_enforcements enforcement
      where enforcement.target_user_id in (p_user_a, p_user_b)
        and enforcement.action in ('suspend', 'remove')
    );
$$;

comment on function public.forge_users_blocked(uuid, uuid) is
  'True when either user blocked the other or either account has an operator suspension/removal. Used by Discovery, connections, messaging, and action RPCs.';

revoke all on function public.forge_users_blocked(uuid, uuid) from public, anon;
grant execute on function public.forge_users_blocked(uuid, uuid) to authenticated;

create or replace function public.review_safety_report(
  p_report_id uuid,
  p_operator_id uuid,
  p_action text,
  p_reason text,
  p_notify_member boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_report public.user_reports%rowtype;
  v_event_id uuid;
  v_previous_status public.profile_status;
  v_previous_discoverable boolean;
  v_now timestamptz := now();
  v_notification_outcome text := case when p_notify_member then 'pending' else 'not_requested' end;
begin
  if p_report_id is null or p_operator_id is null then
    raise exception 'Report and operator are required.';
  end if;
  if p_action not in (
    'begin_review', 'escalate', 'warn', 'restrict', 'suspend',
    'remove', 'safety_block', 'resolve', 'dismiss'
  ) then
    raise exception 'Unsupported report action.';
  end if;
  p_reason := trim(coalesce(p_reason, ''));
  if char_length(p_reason) not between 3 and 2000 then
    raise exception 'Reason must be between 3 and 2000 characters.';
  end if;

  select * into v_report
  from public.user_reports
  where id = p_report_id
  for update;
  if v_report.id is null then
    raise exception 'Report not found.';
  end if;

  insert into public.operator_report_cases (report_id)
  values (p_report_id)
  on conflict (report_id) do nothing;

  update public.operator_report_cases
  set
    status = case
      when p_action = 'resolve' then 'resolved'::public.operator_report_case_status
      when p_action = 'dismiss' then 'dismissed'::public.operator_report_case_status
      else 'reviewing'::public.operator_report_case_status
    end,
    assigned_operator_id = p_operator_id,
    escalated_at = case when p_action = 'escalate' then v_now else escalated_at end,
    resolved_at = case when p_action in ('resolve', 'dismiss') then v_now else null end,
    updated_at = v_now
  where report_id = p_report_id;

  if p_action in ('warn', 'restrict', 'suspend', 'remove', 'safety_block') then
    select status, is_discoverable
    into v_previous_status, v_previous_discoverable
    from public.profiles
    where id = v_report.reported_user_id;

    insert into public.operator_member_enforcements (
      report_id,
      target_user_id,
      operator_id,
      action,
      reason,
      notification_outcome,
      previous_profile_status,
      previous_is_discoverable
    )
    values (
      p_report_id,
      v_report.reported_user_id,
      p_operator_id,
      p_action,
      p_reason,
      v_notification_outcome,
      v_previous_status,
      v_previous_discoverable
    );

    if p_action in ('restrict', 'suspend', 'remove', 'safety_block') then
      perform set_config('forge.allow_system_writes', 'on', true);
      update public.profiles
      set
        is_discoverable = false,
        status = case
          when p_action = 'remove' then 'deactivated'::public.profile_status
          when p_action = 'suspend' then 'paused'::public.profile_status
          else 'hidden'::public.profile_status
        end,
        updated_at = v_now
      where id = v_report.reported_user_id;
    end if;

    if p_action = 'safety_block' then
      insert into public.user_blocks (blocker_id, blocked_id)
      values (v_report.reporter_id, v_report.reported_user_id)
      on conflict (blocker_id, blocked_id) do nothing;

      update public.conversations
      set
        status = 'ended',
        ended_at = coalesce(ended_at, v_now),
        ended_by_user_id = coalesce(ended_by_user_id, v_report.reporter_id),
        updated_at = v_now
      where id = v_report.conversation_id;

      update public.connections connection
      set status = 'ended', updated_at = v_now
      from public.conversations conversation
      where conversation.id = v_report.conversation_id
        and connection.id = conversation.connection_id;
    end if;
  end if;

  insert into public.operator_report_events (
    report_id,
    operator_id,
    action,
    reason,
    outcome,
    metadata
  )
  values (
    p_report_id,
    p_operator_id,
    p_action,
    p_reason,
    case
      when p_action in ('warn', 'restrict', 'suspend', 'remove', 'safety_block')
        then 'Enforcement recorded; submitted report and evidence preserved.'
      else 'Case state updated.'
    end,
    jsonb_build_object('member_notification', v_notification_outcome)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

comment on function public.review_safety_report(uuid, uuid, text, text, boolean) is
  'Service-role-only atomic operator case transition, enforcement, and append-only audit event.';

revoke all on function public.review_safety_report(uuid, uuid, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.review_safety_report(uuid, uuid, text, text, boolean)
  to service_role;

create or replace function public.record_safety_member_notification(
  p_report_id uuid,
  p_operator_id uuid,
  p_success boolean,
  p_outcome text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_action text := case when p_success then 'member_notification_sent' else 'member_notification_failed' end;
begin
  if p_report_id is null or p_operator_id is null then
    raise exception 'Report and operator are required.';
  end if;
  p_outcome := trim(coalesce(p_outcome, ''));
  if char_length(p_outcome) not between 2 and 1000 then
    raise exception 'Notification outcome is invalid.';
  end if;

  update public.operator_member_enforcements
  set notification_outcome = case when p_success then 'sent' else 'failed' end
  where id = (
    select enforcement.id
    from public.operator_member_enforcements enforcement
    where enforcement.report_id = p_report_id
      and enforcement.operator_id = p_operator_id
      and enforcement.notification_outcome = 'pending'
    order by enforcement.created_at desc, enforcement.id desc
    limit 1
  );

  insert into public.operator_report_events (
    report_id, operator_id, action, reason, outcome
  )
  values (
    p_report_id,
    p_operator_id,
    v_action,
    'Member notification delivery result.',
    p_outcome
  )
  returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function public.record_safety_member_notification(uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.record_safety_member_notification(uuid, uuid, boolean, text)
  to service_role;

create or replace function public.submit_safety_report_appeal(
  p_report_id uuid,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_appeal_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;
  p_details := trim(coalesce(p_details, ''));
  if char_length(p_details) not between 10 and 2000 then
    raise exception 'Appeal details must be between 10 and 2000 characters.';
  end if;
  if not exists (
    select 1
    from public.user_reports report
    join public.operator_member_enforcements enforcement
      on enforcement.report_id = report.id
    where report.id = p_report_id
      and report.reported_user_id = v_uid
  ) then
    raise exception 'Appeal is unavailable.';
  end if;

  insert into public.safety_report_appeals (report_id, appellant_user_id, details)
  values (p_report_id, v_uid, p_details)
  returning id into v_appeal_id;
  return v_appeal_id;
end;
$$;

revoke all on function public.submit_safety_report_appeal(uuid, text)
  from public, anon;
grant execute on function public.submit_safety_report_appeal(uuid, text)
  to authenticated;
