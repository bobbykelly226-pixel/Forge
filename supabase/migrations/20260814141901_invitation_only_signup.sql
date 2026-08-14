-- Forge Founding Beta invitation-only signup.
--
-- New accounts must be pre-approved by normalized email address. Enforcement
-- happens in Supabase Auth's before-user-created hook, so a caller cannot bypass
-- the gate by skipping the Forge signup UI and calling Auth directly.

create table public.beta_signup_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_user_id uuid,
  revoked_at timestamptz,
  note text,
  constraint beta_signup_invitations_email_normalized
    check (email = lower(btrim(email))),
  constraint beta_signup_invitations_email_shape
    check (position('@' in email) > 1),
  constraint beta_signup_invitations_acceptance_pair
    check ((accepted_at is null) = (accepted_user_id is null)),
  constraint beta_signup_invitations_expiry_after_invite
    check (expires_at is null or expires_at > invited_at)
);

comment on table public.beta_signup_invitations is
  'Founder-managed, single-use email allowlist for Forge Founding Beta signup.';
comment on column public.beta_signup_invitations.accepted_user_id is
  'Auth user UUID reserved by the before-user-created hook. Deliberately has no FK because the hook runs before auth.users insertion.';

alter table public.beta_signup_invitations enable row level security;

revoke all on table public.beta_signup_invitations from public, anon, authenticated;
grant select, insert, update, delete on table public.beta_signup_invitations to service_role;
grant select, update on table public.beta_signup_invitations to supabase_auth_admin;

create policy "Auth hook may inspect beta signup invitations"
  on public.beta_signup_invitations
  for select
  to supabase_auth_admin
  using (true);

create policy "Auth hook may consume beta signup invitations"
  on public.beta_signup_invitations
  for update
  to supabase_auth_admin
  using (true)
  with check (true);

create or replace function public.hook_enforce_beta_signup_invitation(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_email text;
  v_user_id uuid;
  v_invitation_id uuid;
begin
  v_email := lower(btrim(event->'user'->>'email'));

  if v_email is null or v_email = '' or position('@' in v_email) <= 1 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      )
    );
  end if;

  begin
    v_user_id := (event->'user'->>'id')::uuid;
  exception
    when invalid_text_representation then
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 403,
          'message', 'A valid Forge Founding Beta invitation is required to create an account.'
        )
      );
  end;

  if v_user_id is null then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      )
    );
  end if;

  update public.beta_signup_invitations
  set accepted_at = now(),
      accepted_user_id = v_user_id
  where email = v_email
    and accepted_at is null
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  returning id into v_invitation_id;

  if v_invitation_id is null then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'A valid Forge Founding Beta invitation is required to create an account.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.hook_enforce_beta_signup_invitation(jsonb) is
  'Supabase Auth before-user-created hook. Atomically consumes one active invited-email record or rejects account creation.';

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_enforce_beta_signup_invitation(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_enforce_beta_signup_invitation(jsonb)
  from public, anon, authenticated;
