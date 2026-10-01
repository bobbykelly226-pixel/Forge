-- Direct beta enrollment. Keep all legacy request and invitation records.
create schema if not exists forge_beta_private;
revoke all on schema forge_beta_private from public, anon, authenticated;

create table public.beta_enrollment_settings (
  singleton boolean primary key default true check (singleton),
  account_limit integer not null default 50 check (account_limit between 1 and 10000),
  updated_at timestamptz not null default now()
);
insert into public.beta_enrollment_settings (singleton) values (true);
alter table public.beta_enrollment_settings enable row level security;
revoke all on public.beta_enrollment_settings from public, anon, authenticated;
grant select, update on public.beta_enrollment_settings to service_role;

create table public.beta_waitlist (
  email text primary key check (email = lower(btrim(email)) and length(email) <= 254 and position('@' in email) > 1),
  joined_at timestamptz not null default now()
);
alter table public.beta_waitlist enable row level security;
revoke all on public.beta_waitlist from public, anon, authenticated;
grant select, insert on public.beta_waitlist to service_role;

create table forge_beta_private.beta_waitlist_rate_limits (
  client_key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 1
);
revoke all on forge_beta_private.beta_waitlist_rate_limits from public, anon, authenticated;
alter table forge_beta_private.beta_waitlist_rate_limits enable row level security;

-- The existing configured hook stays in place, but no longer consumes an invite.
create or replace function public.hook_enforce_beta_signup_invitation(event jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if coalesce(event->'user'->>'email', '') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or coalesce(event->'user'->>'is_anonymous', 'false') = 'true' then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'A valid email address is required to join Forge.'));
  end if;
  return '{}'::jsonb;
end;
$$;
comment on function public.hook_enforce_beta_signup_invitation(jsonb) is
  'Legacy hook name retained for Auth configuration; direct email signup no longer needs an invitation.';
revoke execute on function public.hook_enforce_beta_signup_invitation(jsonb) from public, anon, authenticated;
grant execute on function public.hook_enforce_beta_signup_invitation(jsonb) to supabase_auth_admin;

-- Lock the singleton until the auth.users insert commits. All account creation
-- paths, including callers bypassing the website, obey the same capacity check.
create function forge_beta_private.enforce_beta_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_limit integer; v_count integer;
begin
  select account_limit into v_limit from public.beta_enrollment_settings where singleton for update;
  select count(*) into v_count from auth.users where deleted_at is null;
  if v_limit is null or v_count >= v_limit then
    raise exception 'Forge beta is currently full. Please join the waitlist.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function forge_beta_private.enforce_beta_capacity() from public, anon, authenticated;
create trigger enforce_beta_capacity before insert on auth.users
for each row execute function forge_beta_private.enforce_beta_capacity();

-- Only trusted server code can read account details or update enrollment.
create function public.get_beta_enrollment_overview()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'account_limit', (select account_limit from public.beta_enrollment_settings where singleton),
    'account_count', (select count(*) from auth.users where deleted_at is null),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'email', email, 'created_at', created_at,
      'confirmed_at', email_confirmed_at, 'last_sign_in_at', last_sign_in_at
    ) order by created_at desc) from auth.users where deleted_at is null), '[]'::jsonb),
    'waitlist', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'joined_at', joined_at) order by joined_at)
      from public.beta_waitlist w where not exists (select 1 from auth.users u where lower(u.email) = w.email and u.deleted_at is null)), '[]'::jsonb)
  );
$$;
revoke execute on function public.get_beta_enrollment_overview() from public, anon, authenticated;
grant execute on function public.get_beta_enrollment_overview() to service_role;

create function public.set_beta_account_limit(p_limit integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_limit is null or p_limit not between 1 and 10000 then raise exception 'Invalid beta limit'; end if;
  update public.beta_enrollment_settings set account_limit = p_limit, updated_at = now() where singleton;
end;
$$;
revoke execute on function public.set_beta_account_limit(integer) from public, anon, authenticated;
grant execute on function public.set_beta_account_limit(integer) to service_role;

create function public.join_beta_waitlist(p_email text, p_client_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempts integer; v_email text := lower(btrim(p_email));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_client_key is null or length(p_client_key) != 64 then return false; end if;
  delete from forge_beta_private.beta_waitlist_rate_limits where window_start < now() - interval '1 day';
  insert into forge_beta_private.beta_waitlist_rate_limits (client_key) values (p_client_key)
  on conflict (client_key) do update set
    attempts = case when beta_waitlist_rate_limits.window_start < now() - interval '1 hour' then 1 else beta_waitlist_rate_limits.attempts + 1 end,
    window_start = case when beta_waitlist_rate_limits.window_start < now() - interval '1 hour' then now() else beta_waitlist_rate_limits.window_start end
  returning attempts into v_attempts;
  if v_attempts > 3 then return false; end if;
  insert into public.beta_waitlist (email) values (v_email) on conflict do nothing;
  return true;
end;
$$;
revoke execute on function public.join_beta_waitlist(text, text) from public, anon, authenticated;
grant execute on function public.join_beta_waitlist(text, text) to service_role;

create function public.get_beta_enrollment_capacity()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'account_limit', (select account_limit from public.beta_enrollment_settings where singleton),
    'account_count', (select count(*) from auth.users where deleted_at is null)
  );
$$;
revoke execute on function public.get_beta_enrollment_capacity() from public, anon, authenticated;
grant execute on function public.get_beta_enrollment_capacity() to service_role;
