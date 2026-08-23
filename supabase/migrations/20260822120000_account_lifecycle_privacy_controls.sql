-- Punchlist #4: member account lifecycle, recent-authentication, export,
-- retention, deletion, and legal-hold controls.

create table if not exists public.account_lifecycle_state (
  user_id uuid primary key references auth.users (id) on delete restrict,
  deletion_status text not null default 'none'
    check (deletion_status in ('none', 'requested', 'processing', 'completed', 'blocked_by_hold')),
  deletion_requested_at timestamptz null,
  deletion_completed_at timestamptz null,
  legal_hold_active boolean not null default false,
  legal_hold_reason text null,
  legal_hold_applied_at timestamptz null,
  legal_hold_applied_by uuid null references auth.users (id) on delete set null,
  retention_class text not null default 'standard'
    check (retention_class in ('standard', 'safety_extended', 'legal_required')),
  retain_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_lifecycle_legal_hold_reason check (
    not legal_hold_active or char_length(trim(coalesce(legal_hold_reason, ''))) between 3 and 2000
  )
);

create table if not exists public.account_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  actor_user_id uuid null references auth.users (id) on delete set null,
  action text not null check (action in (
    'pause', 'resume', 'deactivate', 'reactivate',
    'export_requested', 'export_downloaded',
    'deletion_requested', 'deletion_started', 'deletion_completed', 'deletion_failed',
    'legal_hold_applied', 'legal_hold_released', 'retention_updated'
  )),
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists account_lifecycle_events_user_created_idx
  on public.account_lifecycle_events (user_id, created_at desc);

create table if not exists public.account_recent_auth_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  constraint account_recent_auth_expiry check (expires_at > verified_at)
);

create index if not exists account_recent_auth_session_idx
  on public.account_recent_auth_verifications (user_id, session_id, expires_at desc);

create table if not exists public.account_export_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint account_export_token_expiry check (expires_at > created_at)
);

alter table public.account_lifecycle_state enable row level security;
alter table public.account_lifecycle_events enable row level security;
alter table public.account_recent_auth_verifications enable row level security;
alter table public.account_export_tokens enable row level security;

revoke all on table public.account_lifecycle_state from public, anon, authenticated;
revoke all on table public.account_lifecycle_events from public, anon, authenticated;
revoke all on table public.account_recent_auth_verifications from public, anon, authenticated;
revoke all on table public.account_export_tokens from public, anon, authenticated;
grant select, insert, update on table public.account_lifecycle_state to service_role;
grant select, insert on table public.account_lifecycle_events to service_role;
grant select, insert, update, delete on table public.account_recent_auth_verifications to service_role;
grant select, insert, update, delete on table public.account_export_tokens to service_role;

create or replace function private.forge_account_lifecycle_events_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Account lifecycle events are append-only.';
end;
$$;

revoke all on function private.forge_account_lifecycle_events_immutable()
  from public, anon, authenticated, service_role;

drop trigger if exists account_lifecycle_events_immutable on public.account_lifecycle_events;
create trigger account_lifecycle_events_immutable
before update or delete on public.account_lifecycle_events
for each row execute function private.forge_account_lifecycle_events_immutable();

create or replace function public.has_recent_account_auth()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.account_recent_auth_verifications verification
    join auth.sessions session
      on session.id = verification.session_id
     and session.user_id = verification.user_id
    where verification.user_id = auth.uid()
      and verification.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and verification.consumed_at is null
      and verification.expires_at > now()
      and (session.not_after is null or session.not_after > now())
  );
$$;

revoke all on function public.has_recent_account_auth() from public, anon;
grant execute on function public.has_recent_account_auth() to authenticated, service_role;

create or replace function public.get_my_account_lifecycle()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_state public.account_lifecycle_state%rowtype;
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  insert into public.account_lifecycle_state (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_profile from public.profiles where id = v_uid;
  select * into v_state from public.account_lifecycle_state where user_id = v_uid;

  return jsonb_build_object(
    'profile_status', coalesce(v_profile.status::text, 'draft'),
    'is_discoverable', coalesce(v_profile.is_discoverable, false),
    'deletion_status', v_state.deletion_status,
    'deletion_requested_at', v_state.deletion_requested_at,
    'legal_hold_active', v_state.legal_hold_active,
    'retention_class', v_state.retention_class,
    'retain_until', v_state.retain_until,
    'recent_auth', public.has_recent_account_auth()
  );
end;
$$;

revoke all on function public.get_my_account_lifecycle() from public, anon;
grant execute on function public.get_my_account_lifecycle() to authenticated;

create or replace function public.set_my_account_lifecycle(p_action text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.profile_status;
  v_new_status public.profile_status;
  v_requires_recent_auth boolean;
  v_has_operator_restriction boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;
  if p_action not in ('pause', 'resume', 'deactivate', 'reactivate') then
    raise exception 'Unsupported account lifecycle action.';
  end if;

  v_requires_recent_auth := p_action in ('deactivate', 'reactivate');
  if v_requires_recent_auth and not public.has_recent_account_auth() then
    return jsonb_build_object('ok', false, 'code', 'recent_auth_required', 'message', 'Confirm your password to continue.');
  end if;

  perform public.ensure_foundational_user_records(v_uid);
  insert into public.account_lifecycle_state (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select exists (
    select 1 from public.operator_member_enforcements enforcement
    where enforcement.target_user_id = v_uid
      and enforcement.action in ('restrict', 'suspend', 'remove', 'safety_block')
  ) into v_has_operator_restriction;

  if p_action in ('resume', 'reactivate') and v_has_operator_restriction then
    return jsonb_build_object('ok', false, 'code', 'operator_restriction', 'message', 'This account cannot be reactivated from member settings.');
  end if;

  select status into v_status from public.profiles where id = v_uid for update;
  v_new_status := case
    when p_action = 'pause' then 'paused'::public.profile_status
    when p_action = 'deactivate' then 'deactivated'::public.profile_status
    when exists (select 1 from public.profiles where id = v_uid and onboarding_completed_at is not null)
      then 'active'::public.profile_status
    else 'draft'::public.profile_status
  end;

  perform set_config('forge.allow_system_writes', 'on', true);
  update public.profiles
  set
    status = v_new_status,
    is_discoverable = false,
    updated_at = now()
  where id = v_uid;

  update public.profile_preferences
  set discovery_enabled = false, updated_at = now()
  where user_id = v_uid;

  insert into public.account_lifecycle_events (user_id, actor_user_id, action, metadata)
  values (v_uid, v_uid, p_action, jsonb_build_object('previous_status', v_status, 'new_status', v_new_status));

  return jsonb_build_object(
    'ok', true,
    'profile_status', v_new_status,
    'is_discoverable', false,
    'message', case p_action
      when 'pause' then 'Your profile is paused and hidden from Discovery.'
      when 'resume' then 'Your account is active again. Discovery remains off until you choose to enable it.'
      when 'deactivate' then 'Your account is deactivated. Your data is retained so you can reactivate.'
      else 'Your account is active again. Discovery remains off until you choose to enable it.'
    end
  );
end;
$$;

revoke all on function public.set_my_account_lifecycle(text) from public, anon;
grant execute on function public.set_my_account_lifecycle(text) to authenticated;

-- Service-only deletion preparation. Authentication is bound to the exact
-- browser session that completed password confirmation.
create or replace function public.prepare_account_deletion(
  p_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_state public.account_lifecycle_state%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;

  select * into v_state
  from public.account_lifecycle_state
  where user_id = p_user_id
  for update;

  if v_state.user_id is null then
    insert into public.account_lifecycle_state (user_id)
    values (p_user_id)
    returning * into v_state;
  end if;

  if v_state.legal_hold_active then
    update public.account_lifecycle_state
    set deletion_status = 'blocked_by_hold', deletion_requested_at = coalesce(deletion_requested_at, now()), updated_at = now()
    where user_id = p_user_id;
    return jsonb_build_object('ok', false, 'code', 'legal_hold', 'message', 'This account cannot be deleted while a legal hold is active.');
  end if;

  if not exists (
    select 1 from public.account_recent_auth_verifications verification
    join auth.sessions session on session.id = verification.session_id and session.user_id = verification.user_id
    where verification.user_id = p_user_id
      and verification.session_id = p_session_id
      and verification.consumed_at is null
      and verification.expires_at > now()
      and (session.not_after is null or session.not_after > now())
  ) then
    return jsonb_build_object('ok', false, 'code', 'recent_auth_required', 'message', 'Confirm your password to continue.');
  end if;

  update public.account_recent_auth_verifications
  set consumed_at = now()
  where user_id = p_user_id and session_id = p_session_id and consumed_at is null;

  update public.account_lifecycle_state
  set deletion_status = 'processing', deletion_requested_at = coalesce(deletion_requested_at, now()), updated_at = now()
  where user_id = p_user_id;

  insert into public.account_lifecycle_events (user_id, actor_user_id, action)
  values (p_user_id, p_user_id, 'deletion_requested');

  insert into public.account_lifecycle_events (user_id, actor_user_id, action)
  values (p_user_id, p_user_id, 'deletion_started');

  perform set_config('forge.allow_system_writes', 'on', true);
  update public.profiles
  set
    full_name = 'Deleted member', age = null, location = null,
    relationship_goal = null, relationship_goals = '{}'::text[],
    faith_importance = null, faith_identity = null, faith_tradition = null, faith_other = null,
    service_background = null, service_backgrounds = '{}'::text[],
    short_bio = null, more_about = null, children = null, has_children = null,
    children_count = null, open_to_partner_with_children = null, education = null,
    pets = null, pets_types = '{}'::text[], pets_partner_preferences = '{}'::text[],
    pets_allergy_constraint = null, pets_allergy_types = '{}'::text[],
    smoking = null, smoking_product_types = '{}'::text[], smoking_product_other = null,
    smoking_partner_preferences = '{}'::text[], drinking = null,
    drinking_partner_preferences = '{}'::text[], career = null, relocation = null,
    things_i_enjoy = '{}'::text[], favorite_music_artists = '{}'::text[],
    favorite_music_songs = '{}'::text[], profile_photo_url = null,
    location_city = null, location_region = null, location_country = null,
    unmapped_legacy_fields = '{}'::jsonb, status = 'deactivated', is_discoverable = false,
    updated_at = now()
  where id = p_user_id;

  delete from public.profile_private_details where user_id = p_user_id;
  delete from public.profile_preferences where user_id = p_user_id;
  delete from public.profile_answers where user_id = p_user_id;
  delete from public.compatibility_answers where user_id = p_user_id;
  delete from public.profile_photos where user_id = p_user_id;
  delete from public.user_app_state where user_id = p_user_id;
  delete from public.user_questionnaire_progress where user_id = p_user_id;
  delete from public.user_questionnaire_responses where user_id = p_user_id;
  delete from public.user_questionnaire_write_operations where user_id = p_user_id;
  delete from public.character_signal_display_preferences where receiver_id = p_user_id;
  delete from public.saved_profiles where saver_id = p_user_id or saved_id = p_user_id;
  delete from public.passed_profiles where passer_id = p_user_id or passed_id = p_user_id;
  delete from public.interests where sender_id = p_user_id or recipient_id = p_user_id;
  delete from public.open_to_chat_requests where sender_id = p_user_id or recipient_id = p_user_id;
  delete from public.user_blocks where blocker_id = p_user_id or blocked_id = p_user_id;
  delete from public.notifications where recipient_user_id = p_user_id;
  delete from public.message_attachments where sender_id = p_user_id;

  -- Preserve safety reports, legal acceptances, operator audit records, and
  -- conversation history according to the documented retention schedule.
  update public.messages
  set body = '[Deleted by member]'
  where sender_id = p_user_id and body is not null;

  return jsonb_build_object('ok', true, 'message', 'Account data prepared for deletion.');
end;
$$;

revoke all on function public.prepare_account_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid, uuid) to service_role;

create or replace function public.complete_account_deletion(p_user_id uuid, p_success boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required.'; end if;
  update public.account_lifecycle_state
  set
    deletion_status = case when p_success then 'completed' else 'requested' end,
    deletion_completed_at = case when p_success then now() else null end,
    updated_at = now()
  where user_id = p_user_id;
  insert into public.account_lifecycle_events (user_id, actor_user_id, action, reason)
  values (p_user_id, p_user_id, case when p_success then 'deletion_completed' else 'deletion_failed' end, p_reason);
end;
$$;

revoke all on function public.complete_account_deletion(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.complete_account_deletion(uuid, boolean, text) to service_role;

create or replace function public.set_account_governance(
  p_user_id uuid,
  p_operator_id uuid,
  p_legal_hold_active boolean,
  p_reason text,
  p_retention_class text default 'standard',
  p_retain_until timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_previous_hold boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required.'; end if;
  if p_retention_class not in ('standard', 'safety_extended', 'legal_required') then raise exception 'Unsupported retention class.'; end if;
  if p_legal_hold_active and char_length(trim(coalesce(p_reason, ''))) not between 3 and 2000 then raise exception 'A legal-hold reason is required.'; end if;

  insert into public.account_lifecycle_state (user_id)
  values (p_user_id) on conflict (user_id) do nothing;
  select legal_hold_active into v_previous_hold from public.account_lifecycle_state where user_id = p_user_id for update;

  update public.account_lifecycle_state
  set
    legal_hold_active = p_legal_hold_active,
    legal_hold_reason = case when p_legal_hold_active then trim(p_reason) else null end,
    legal_hold_applied_at = case when p_legal_hold_active then now() else null end,
    legal_hold_applied_by = case when p_legal_hold_active then p_operator_id else null end,
    retention_class = p_retention_class,
    retain_until = p_retain_until,
    deletion_status = case when not p_legal_hold_active and deletion_status = 'blocked_by_hold' then 'requested' else deletion_status end,
    updated_at = now()
  where user_id = p_user_id;

  if v_previous_hold is distinct from p_legal_hold_active then
    insert into public.account_lifecycle_events (user_id, actor_user_id, action, reason, metadata)
    values (
      p_user_id, p_operator_id,
      case when p_legal_hold_active then 'legal_hold_applied' else 'legal_hold_released' end,
      nullif(trim(p_reason), ''),
      jsonb_build_object('retention_class', p_retention_class, 'retain_until', p_retain_until)
    );
  else
    insert into public.account_lifecycle_events (user_id, actor_user_id, action, reason, metadata)
    values (p_user_id, p_operator_id, 'retention_updated', nullif(trim(p_reason), ''), jsonb_build_object('retention_class', p_retention_class, 'retain_until', p_retain_until));
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.set_account_governance(uuid, uuid, boolean, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.set_account_governance(uuid, uuid, boolean, text, text, timestamptz)
  to service_role;

create or replace function public.consume_account_export_token(p_token uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_consumed uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required.'; end if;
  update public.account_export_tokens
  set consumed_at = now()
  where token = p_token
    and user_id = p_user_id
    and consumed_at is null
    and expires_at > now()
  returning token into v_consumed;
  return v_consumed is not null;
end;
$$;

revoke all on function public.consume_account_export_token(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_account_export_token(uuid, uuid) to service_role;

-- Paused accounts remain available for existing conversations, but cannot
-- silently re-enter Discovery through its visibility toggle.
create or replace function public.can_activate_discovery_visibility(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles profile
    where profile.id = p_user_id
      and profile.status not in ('paused', 'hidden', 'deactivated')
  );
$$;

revoke all on function public.can_activate_discovery_visibility(uuid) from public, anon;
grant execute on function public.can_activate_discovery_visibility(uuid) to authenticated, service_role;

create or replace function public.set_my_discovery_visibility(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.profile_status;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.ensure_foundational_user_records(v_uid);
  perform set_config('forge.allow_system_writes', 'on', true);

  select profile.status into v_status from public.profiles profile where profile.id = v_uid;
  if not found or v_status in ('paused', 'deactivated', 'hidden') then
    return jsonb_build_object('ok', false, 'enabled', false, 'can_enable', false,
      'message', 'Discovery visibility is unavailable while this account is paused, hidden, or deactivated.');
  end if;

  if p_enabled and not public.can_activate_discovery_visibility(v_uid) then
    return jsonb_build_object('ok', false, 'enabled', false, 'can_enable', false,
      'message', 'Complete adult eligibility, matching preferences, and private location before entering Discovery.');
  end if;

  if p_enabled then
    update public.profiles
    set status = 'active', is_discoverable = true, last_active_at = now(), updated_at = now()
    where id = v_uid;
    update public.profile_preferences set discovery_enabled = true, updated_at = now()
    where user_id = v_uid;
  else
    update public.profiles set is_discoverable = false, updated_at = now() where id = v_uid;
    update public.profile_preferences set discovery_enabled = false, updated_at = now()
    where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'enabled', p_enabled,
    'can_enable', public.can_activate_discovery_visibility(v_uid),
    'message', case when p_enabled then 'You are now visible in Discovery.'
      else 'You are hidden from Discovery. Existing connections were kept.' end
  );
end;
$$;

revoke all on function public.set_my_discovery_visibility(boolean) from public, anon;
grant execute on function public.set_my_discovery_visibility(boolean) to authenticated;

create or replace function public.forge_users_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (
      select 1 from public.user_blocks block
      where (block.blocker_id = p_user_a and block.blocked_id = p_user_b)
         or (block.blocker_id = p_user_b and block.blocked_id = p_user_a)
    )
    or exists (
      select 1 from public.operator_member_enforcements enforcement
      where enforcement.target_user_id in (p_user_a, p_user_b)
        and enforcement.action in ('suspend', 'remove')
    )
    or exists (
      select 1 from public.profiles profile
      where profile.id in (p_user_a, p_user_b)
        and profile.status in ('hidden', 'deactivated')
    );
$$;

revoke all on function public.forge_users_blocked(uuid, uuid) from public, anon;
grant execute on function public.forge_users_blocked(uuid, uuid) to authenticated;

comment on table public.account_lifecycle_state is
  'One private retention/legal-hold/deletion state row per member. Ordinary clients use guarded RPCs.';
comment on table public.account_lifecycle_events is
  'Append-only audit history for member and operator account-governance actions.';
comment on function public.has_recent_account_auth() is
  'True only when the current JWT session has a live, server-recorded password confirmation.';
comment on function public.prepare_account_deletion(uuid, uuid) is
  'Service-only transactional redaction before Supabase Auth soft deletion. Safety/legal/audit records are retained.';
