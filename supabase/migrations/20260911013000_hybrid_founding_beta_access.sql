-- Controlled Founding Beta enrollment.
--
-- Keeps the existing exact-email allowlist while adding secure single-use and
-- limited-use invitation links, a global account cap, an enrollment pause,
-- short-lived signup reservations, and operator-visible audit data.

create table public.beta_enrollment_settings (
  singleton boolean primary key default true check (singleton),
  enrollment_open boolean not null default true,
  member_limit integer not null default 50 check (member_limit between 1 and 500),
  accepted_count integer not null default 0 check (accepted_count >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.beta_enrollment_settings (singleton, accepted_count)
select true, count(*)::integer
from auth.users;

comment on table public.beta_enrollment_settings is
  'Singleton operator control for Founding Beta enrollment availability and account capacity.';

create table public.beta_signup_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(btrim(label)) between 1 and 120),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  max_uses integer not null check (max_uses between 1 and 100),
  use_count integer not null default 0 check (use_count between 0 and max_uses),
  created_at timestamptz not null default now(),
  created_by uuid,
  expires_at timestamptz,
  paused_at timestamptz,
  revoked_at timestamptz,
  constraint beta_signup_links_expiry_after_creation
    check (expires_at is null or expires_at > created_at)
);

comment on table public.beta_signup_links is
  'Hashed, operator-created Founding Beta links. Raw bearer tokens are shown once and never stored.';

create table public.beta_signup_reservations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  link_id uuid not null references public.beta_signup_links(id) on delete cascade,
  proof_hash text not null unique check (proof_hash ~ '^[0-9a-f]{64}$'),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  consumed_at timestamptz,
  accepted_user_id uuid,
  constraint beta_signup_reservations_email_normalized
    check (email = lower(btrim(email))),
  constraint beta_signup_reservations_email_shape
    check (position('@' in email) > 1),
  constraint beta_signup_reservations_consumption_pair
    check ((consumed_at is null) = (accepted_user_id is null)),
  constraint beta_signup_reservations_expiry_after_reservation
    check (expires_at > reserved_at)
);

comment on table public.beta_signup_reservations is
  'Short-lived signup proofs, not capacity holds. Only successful Auth admission consumes a place or link use.';

alter table public.beta_signup_invitations
  add column source_link_id uuid references public.beta_signup_links(id);

create index beta_signup_links_active_idx
  on public.beta_signup_links (expires_at, revoked_at, paused_at);
create index beta_signup_reservations_active_idx
  on public.beta_signup_reservations (expires_at)
  where consumed_at is null;

alter table public.beta_enrollment_settings enable row level security;
alter table public.beta_signup_links enable row level security;
alter table public.beta_signup_reservations enable row level security;

revoke all on table public.beta_enrollment_settings from public, anon, authenticated;
revoke all on table public.beta_signup_links from public, anon, authenticated;
revoke all on table public.beta_signup_reservations from public, anon, authenticated;

grant select, insert, update on table public.beta_enrollment_settings to service_role;
grant select, insert, update, delete on table public.beta_signup_links to service_role;
grant select, insert, update, delete on table public.beta_signup_reservations to service_role;

grant select, update on table public.beta_enrollment_settings to supabase_auth_admin;
grant select, update on table public.beta_signup_links to supabase_auth_admin;
grant select, update on table public.beta_signup_reservations to supabase_auth_admin;
grant insert, update on table public.beta_signup_invitations to supabase_auth_admin;

create policy "Auth hook may inspect beta enrollment settings"
  on public.beta_enrollment_settings for select to supabase_auth_admin using (true);
create policy "Auth hook may update beta enrollment settings"
  on public.beta_enrollment_settings for update to supabase_auth_admin using (true) with check (true);
create policy "Auth hook may inspect beta signup links"
  on public.beta_signup_links for select to supabase_auth_admin using (true);
create policy "Auth hook may consume beta signup links"
  on public.beta_signup_links for update to supabase_auth_admin using (true) with check (true);
create policy "Auth hook may inspect beta signup reservations"
  on public.beta_signup_reservations for select to supabase_auth_admin using (true);
create policy "Auth hook may consume beta signup reservations"
  on public.beta_signup_reservations for update to supabase_auth_admin using (true) with check (true);
create policy "Auth hook may record link signup invitations"
  on public.beta_signup_invitations for insert to supabase_auth_admin with check (true);

create or replace function public.reserve_beta_signup_access(
  p_email text,
  p_link_token_hash text,
  p_reservation_proof_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_email text := lower(btrim(p_email));
  v_settings public.beta_enrollment_settings%rowtype;
  v_link public.beta_signup_links%rowtype;
begin
  if v_email is null or v_email = '' or length(v_email) > 254 or position('@' in v_email) <= 1
     or p_link_token_hash is null or p_link_token_hash !~ '^[0-9a-f]{64}$'
     or p_reservation_proof_hash is null or p_reservation_proof_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Existing exact-email invitations remain the internal/testing fallback.
  if exists (
    select 1 from public.beta_signup_invitations invitation
    where invitation.email = v_email
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and (invitation.expires_at is null or invitation.expires_at > now())
  ) then
    return jsonb_build_object('ok', true, 'access', 'email_invitation');
  end if;

  select * into v_settings
  from public.beta_enrollment_settings
  where singleton = true
  for update;

  if not found or not v_settings.enrollment_open then
    return jsonb_build_object('ok', false, 'reason', 'paused');
  end if;

  -- Preflight runs before Auth verifies CAPTCHA: it must NEVER reserve capacity.
  if v_settings.accepted_count >= v_settings.member_limit then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  select * into v_link
  from public.beta_signup_links link
  where link.token_hash = p_link_token_hash
    and link.revoked_at is null
    and link.paused_at is null
    and (link.expires_at is null or link.expires_at > now())
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_link.use_count >= v_link.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'link_full');
  end if;

  -- Never resurrect revoked/consumed email invitations through a bearer link.
  if exists (select 1 from public.beta_signup_invitations
             where email = v_email and (revoked_at is not null or accepted_at is not null)) then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  delete from public.beta_signup_reservations
  where consumed_at is null and expires_at <= now();

  -- Each attempt gets an independent proof; retries cannot invalidate an in-flight signup.
  -- Bound pre-CAPTCHA storage growth without holding any beta places.
  if (select count(*) from public.beta_signup_reservations
      where consumed_at is null) >= 1000
     or (select count(*) from public.beta_signup_reservations
         where email = v_email and consumed_at is null) >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'retry');
  end if;

  insert into public.beta_signup_reservations (email, link_id, proof_hash)
  values (v_email, v_link.id, p_reservation_proof_hash);

  return jsonb_build_object('ok', true, 'access', 'link');
end;
$$;

comment on function public.reserve_beta_signup_access(text, text, text) is
  'Service-only 30-minute proof issuance. Does not reserve capacity before CAPTCHA verification.';

grant execute on function public.reserve_beta_signup_access(text, text, text) to service_role;
revoke execute on function public.reserve_beta_signup_access(text, text, text)
  from public, anon, authenticated, supabase_auth_admin;

create or replace function public.hook_enforce_beta_signup_invitation(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_email text;
  v_user_id uuid;
  v_proof text;
  v_proof_hash text;
  v_invitation_id uuid;
  v_reservation public.beta_signup_reservations%rowtype;
  v_link public.beta_signup_links%rowtype;
  v_settings public.beta_enrollment_settings%rowtype;
begin
  v_email := lower(btrim(event->'user'->>'email'));

  if v_email is null or v_email = '' or position('@' in v_email) <= 1 then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'A valid Forge Founding Beta invitation is required to create an account.'
    ));
  end if;

  begin
    v_user_id := (event->'user'->>'id')::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'A valid Forge Founding Beta invitation is required to create an account.'
    ));
  end;

  if v_user_id is null then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'A valid Forge Founding Beta invitation is required to create an account.'
    ));
  end if;

  select * into v_settings
  from public.beta_enrollment_settings
  where singleton = true
  for update;

  if not found or v_settings.accepted_count >= v_settings.member_limit then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Forge Founding Beta enrollment is currently full.'
    ));
  end if;

  select invitation.id into v_invitation_id
  from public.beta_signup_invitations invitation
  where invitation.email = v_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and (invitation.expires_at is null or invitation.expires_at > now())
  for update;

  if v_invitation_id is null then
    if exists (select 1 from public.beta_signup_invitations
               where email = v_email and (revoked_at is not null or accepted_at is not null)) then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403, 'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      ));
    end if;
    if not v_settings.enrollment_open then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403,
        'message', 'Forge Founding Beta enrollment is currently paused.'
      ));
    end if;

    v_proof := event->'user'->'user_metadata'->>'forge_beta_reservation';
    if v_proof is null or v_proof !~ '^[0-9a-f]{64}$' then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403,
        'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      ));
    end if;
    v_proof_hash := encode(extensions.digest(v_proof, 'sha256'), 'hex');

    select * into v_reservation
    from public.beta_signup_reservations reservation
    where reservation.email = v_email
      and reservation.proof_hash = v_proof_hash
      and reservation.consumed_at is null
      and reservation.expires_at > now()
    for update;

    if not found then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403,
        'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      ));
    end if;

    select * into v_link
    from public.beta_signup_links link
    where link.id = v_reservation.link_id
      and link.revoked_at is null
      and link.paused_at is null
      and (link.expires_at is null or link.expires_at > now())
      and link.use_count < link.max_uses
    for update;

    if not found then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403,
        'message', 'This Founding Beta invitation is no longer available.'
      ));
    end if;

    update public.beta_signup_links
    set use_count = use_count + 1
    where id = v_link.id;

    update public.beta_signup_reservations
    set consumed_at = now(), accepted_user_id = v_user_id
    where id = v_reservation.id;

    insert into public.beta_signup_invitations (
      email, invited_at, expires_at, accepted_at, accepted_user_id, source_link_id, note
    ) values (
      v_email, v_reservation.reserved_at, v_reservation.expires_at,
      now(), v_user_id, v_link.id, 'Accepted through Founding Beta link'
    )
    on conflict (email) do update
      set accepted_at = excluded.accepted_at,
          accepted_user_id = excluded.accepted_user_id,
          source_link_id = excluded.source_link_id,
          note = excluded.note
      where beta_signup_invitations.accepted_at is null
        and beta_signup_invitations.revoked_at is null;
  else
    update public.beta_signup_invitations
    set accepted_at = now(), accepted_user_id = v_user_id
    where id = v_invitation_id;
  end if;

  update public.beta_enrollment_settings
  set accepted_count = accepted_count + 1,
      updated_at = now()
  where singleton = true;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_enforce_beta_signup_invitation(jsonb) is
  'Supabase Auth before-user-created hook. Atomically consumes an exact-email invitation or a proof-bound link reservation while enforcing the Founding Beta cap.';

grant usage on schema extensions to supabase_auth_admin;
grant execute on function extensions.digest(text, text) to supabase_auth_admin;

-- Occupied places include accounts awaiting email confirmation. Display verified
-- members separately: an Auth signup success is NOT proof of email verification.
create function public.beta_enrollment_counts()
returns jsonb language sql stable security definer set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'verified_count', count(*) filter (where email_confirmed_at is not null),
    'pending_count', count(*) filter (where email_confirmed_at is null)
  ) from auth.users;
$$;
revoke all on function public.beta_enrollment_counts() from public, anon, authenticated;
grant execute on function public.beta_enrollment_counts() to service_role;

-- The same row lock used by admission makes a cap change race-safe. Do not trust
-- a client-supplied count when lowering the limit.
create function public.set_beta_member_limit(p_limit integer, p_operator uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if p_limit is null or p_limit not between 1 and 500 or p_operator is null then
    return false;
  end if;
  update public.beta_enrollment_settings
  set member_limit = p_limit, updated_at = now(), updated_by = p_operator
  where singleton and accepted_count <= p_limit;
  return found;
end;
$$;
revoke all on function public.set_beta_member_limit(integer, uuid) from public, anon, authenticated;
grant execute on function public.set_beta_member_limit(integer, uuid) to service_role;

-- Separate from the legacy marketing waitlist; no change to its data or policies.
-- Signup does not automatically opt someone in. The visitor submits this form.
create table public.beta_enrollment_waitlist (
  email text primary key check (email = lower(btrim(email)) and length(email) between 3 and 254),
  name text not null check (length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
alter table public.beta_enrollment_waitlist enable row level security;
revoke all on table public.beta_enrollment_waitlist from public, anon, authenticated;
grant select, insert on table public.beta_enrollment_waitlist to service_role;

create function public.join_beta_waitlist(p_email text, p_name text)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
declare v_email text := lower(btrim(p_email));
begin
  if v_email is null or length(v_email) not between 3 and 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or p_name is null or length(btrim(p_name)) not between 1 and 100 then
    return false;
  end if;
  -- Serialize duplicate submissions and bound public write volume across instances.
  perform pg_advisory_xact_lock(692038111);
  if exists (select 1 from public.beta_enrollment_waitlist where email = v_email) then
    return true;
  end if;
  if (select count(*) from public.beta_enrollment_waitlist
      where created_at > now() - interval '1 hour') >= 100 then
    return false;
  end if;
  insert into public.beta_enrollment_waitlist(email, name) values (v_email, btrim(p_name));
  return true;
end;
$$;
create index beta_enrollment_waitlist_created_idx on public.beta_enrollment_waitlist(created_at);
revoke all on function public.join_beta_waitlist(text, text) from public, anon, authenticated;
grant execute on function public.join_beta_waitlist(text, text) to service_role;
