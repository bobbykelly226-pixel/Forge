-- Forge Founding Beta request and founder-controlled invitation workflow.
-- Public visitors submit through a trusted Server Action. These tables remain
-- private to the service role; operator decisions require authenticated MFA in
-- the application before the service-role RPCs are called.

create table public.founding_beta_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null unique,
  location text not null,
  gender text not null,
  interested_in text[] not null,
  relationship_goal text not null,
  heard_about_forge text,
  adult_confirmed boolean not null,
  feedback_agreed boolean not null,
  standards_agreed boolean not null,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  decision_note text,
  invitation_id uuid references public.beta_signup_invitations(id) on delete set null,
  invitation_sent_at timestamptz,
  invitation_delivery_status text not null default 'not_attempted',
  invitation_delivery_error text,
  constraint founding_beta_requests_first_name_length
    check (char_length(btrim(first_name)) between 1 and 80),
  constraint founding_beta_requests_email_normalized
    check (email = lower(btrim(email))),
  constraint founding_beta_requests_email_shape
    check (position('@' in email) > 1 and char_length(email) <= 254),
  constraint founding_beta_requests_location_length
    check (char_length(btrim(location)) between 2 and 120),
  constraint founding_beta_requests_gender
    check (gender in ('man', 'woman')),
  constraint founding_beta_requests_interested_in
    check (
      cardinality(interested_in) between 1 and 2
      and interested_in <@ array['men', 'women']::text[]
    ),
  constraint founding_beta_requests_relationship_goal
    check (relationship_goal in ('marriage', 'serious_relationship', 'intentional_dating')),
  constraint founding_beta_requests_heard_about_length
    check (heard_about_forge is null or char_length(heard_about_forge) <= 160),
  constraint founding_beta_requests_required_confirmations
    check (adult_confirmed and feedback_agreed and standards_agreed),
  constraint founding_beta_requests_status
    check (status in ('pending', 'approved', 'invited', 'declined')),
  constraint founding_beta_requests_delivery_status
    check (invitation_delivery_status in ('not_attempted', 'sent', 'failed')),
  constraint founding_beta_requests_review_pair
    check ((reviewed_at is null) = (reviewed_by is null))
);

create index founding_beta_requests_status_submitted_idx
  on public.founding_beta_requests (status, submitted_at desc);

create table public.founding_beta_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.founding_beta_requests(id) on delete restrict,
  operator_id uuid not null,
  action text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint founding_beta_request_events_action
    check (action in ('approved', 'declined', 'invitation_sent', 'invitation_failed', 'invitation_resent')),
  constraint founding_beta_request_events_reason_length
    check (char_length(btrim(reason)) between 3 and 1000)
);

create index founding_beta_request_events_request_idx
  on public.founding_beta_request_events (request_id, created_at desc);

comment on table public.founding_beta_requests is
  'Private Founding Beta access requests reviewed by MFA-protected Forge operators.';
comment on table public.founding_beta_request_events is
  'Append-only founder decision and invitation-delivery audit history.';

alter table public.founding_beta_requests enable row level security;
alter table public.founding_beta_request_events enable row level security;

revoke all on table public.founding_beta_requests from public, anon, authenticated;
revoke all on table public.founding_beta_request_events from public, anon, authenticated;
grant select, insert, update, delete on table public.founding_beta_requests to service_role;
grant select, insert on table public.founding_beta_request_events to service_role;

create or replace function public.approve_founding_beta_request(
  p_request_id uuid,
  p_operator_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.founding_beta_requests%rowtype;
  v_invitation_id uuid;
begin
  if p_operator_id is null or char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A valid operator and reason are required.';
  end if;

  select * into v_request
  from public.founding_beta_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Founding Beta request not found.';
  end if;
  if v_request.status not in ('pending', 'approved') then
    raise exception 'Only pending or approved requests can be approved.';
  end if;

  insert into public.beta_signup_invitations (email, invited_at, expires_at, note)
  values (
    v_request.email,
    now(),
    now() + interval '7 days',
    'Approved Founding Beta request ' || v_request.id::text
  )
  on conflict (email) do update
  set invited_at = excluded.invited_at,
      expires_at = excluded.expires_at,
      revoked_at = null,
      note = excluded.note
  where public.beta_signup_invitations.accepted_at is null
  returning id into v_invitation_id;

  if v_invitation_id is null then
    raise exception 'This email already has a Forge account.';
  end if;

  update public.founding_beta_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_operator_id,
      decision_note = btrim(p_reason),
      invitation_id = v_invitation_id,
      invitation_delivery_status = 'not_attempted',
      invitation_delivery_error = null,
      updated_at = now()
  where id = p_request_id;

  insert into public.founding_beta_request_events (request_id, operator_id, action, reason)
  values (p_request_id, p_operator_id, 'approved', btrim(p_reason));

  return jsonb_build_object(
    'request_id', p_request_id,
    'invitation_id', v_invitation_id,
    'email', v_request.email,
    'first_name', v_request.first_name
  );
end;
$$;

create or replace function public.decline_founding_beta_request(
  p_request_id uuid,
  p_operator_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_operator_id is null or char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A valid operator and reason are required.';
  end if;

  update public.founding_beta_requests
  set status = 'declined',
      reviewed_at = now(),
      reviewed_by = p_operator_id,
      decision_note = btrim(p_reason),
      updated_at = now()
  where id = p_request_id
    and status = 'pending';

  if not found then
    return false;
  end if;

  insert into public.founding_beta_request_events (request_id, operator_id, action, reason)
  values (p_request_id, p_operator_id, 'declined', btrim(p_reason));

  return true;
end;
$$;

create or replace function public.record_founding_beta_invitation_delivery(
  p_request_id uuid,
  p_operator_id uuid,
  p_success boolean,
  p_error text default null,
  p_is_resend boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.founding_beta_requests
  set status = case when p_success then 'invited' else 'approved' end,
      invitation_sent_at = case when p_success then now() else invitation_sent_at end,
      invitation_delivery_status = case when p_success then 'sent' else 'failed' end,
      invitation_delivery_error = case when p_success then null else left(coalesce(p_error, 'Unknown delivery error'), 500) end,
      updated_at = now()
  where id = p_request_id
    and status in ('approved', 'invited');

  if not found then
    return false;
  end if;

  insert into public.founding_beta_request_events (request_id, operator_id, action, reason)
  values (
    p_request_id,
    p_operator_id,
    case
      when not p_success then 'invitation_failed'
      when p_is_resend then 'invitation_resent'
      else 'invitation_sent'
    end,
    case when p_success then 'Founding Beta invitation email accepted by the delivery provider.'
         else left(coalesce(p_error, 'Invitation email delivery failed.'), 1000)
    end
  );

  return true;
end;
$$;

revoke execute on function public.approve_founding_beta_request(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.decline_founding_beta_request(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.record_founding_beta_invitation_delivery(uuid, uuid, boolean, text, boolean)
  from public, anon, authenticated;
grant execute on function public.approve_founding_beta_request(uuid, uuid, text) to service_role;
grant execute on function public.decline_founding_beta_request(uuid, uuid, text) to service_role;
grant execute on function public.record_founding_beta_invitation_delivery(uuid, uuid, boolean, text, boolean) to service_role;
