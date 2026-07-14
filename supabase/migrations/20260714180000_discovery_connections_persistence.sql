-- Forge Discovery, relationship actions, and connections persistence
-- Extends PR #29 foundation with trusted RPCs and OTC deferred status.
-- Does not reset data. Does not weaken existing RLS.

-- ---------------------------------------------------------------------------
-- 1. Open to Chat: add deferred ("Not Right Now") status
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.open_to_chat_status add value if not exists 'deferred';
exception
  when duplicate_object then null;
end $$;

comment on type public.open_to_chat_status is
  'pending | deferred (Not Right Now) | accepted | declined | expired. Deferred is private to the recipient.';

-- ---------------------------------------------------------------------------
-- 2. Allow trusted RPCs to update interest / OTC status (same pattern as connections)
-- ---------------------------------------------------------------------------
create or replace function public.protect_interest_system_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('forge.allow_system_writes', true), 'off') = 'on' then
    if tg_op = 'INSERT' then
      if new.sender_id = new.recipient_id then
        raise exception 'interests: cannot interest yourself';
      end if;
      return new;
    end if;
    if new.sender_id is distinct from old.sender_id
       or new.recipient_id is distinct from old.recipient_id then
      raise exception 'interests: participant ids are immutable';
    end if;
    new.created_at := old.created_at;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.sender_id := auth.uid();
      new.status := 'pending';
    end if;
    if new.sender_id = new.recipient_id then
      raise exception 'interests: cannot interest yourself';
    end if;
    return new;
  end if;

  if new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id then
    raise exception 'interests: participant ids are immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null then
    if not (
      old.status = 'pending'
      and new.status = 'withdrawn'
      and auth.uid() = old.sender_id
    ) then
      if new.status is distinct from old.status then
        raise exception 'interests: status change not permitted';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.protect_open_to_chat_system_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('forge.allow_system_writes', true), 'off') = 'on' then
    if tg_op = 'INSERT' then
      if new.sender_id = new.recipient_id then
        raise exception 'open_to_chat_requests: cannot request yourself';
      end if;
      if new.note is not null and char_length(new.note) > 200 then
        raise exception 'open_to_chat_requests: note exceeds 200 characters';
      end if;
      return new;
    end if;
    if new.sender_id is distinct from old.sender_id
       or new.recipient_id is distinct from old.recipient_id then
      raise exception 'open_to_chat_requests: participant ids are immutable';
    end if;
    new.created_at := old.created_at;
    if new.note is not null and char_length(new.note) > 200 then
      raise exception 'open_to_chat_requests: note exceeds 200 characters';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.sender_id := auth.uid();
      new.status := 'pending';
      new.responded_at := null;
    end if;
    if new.sender_id = new.recipient_id then
      raise exception 'open_to_chat_requests: cannot request yourself';
    end if;
    if new.note is not null and char_length(new.note) > 200 then
      raise exception 'open_to_chat_requests: note exceeds 200 characters';
    end if;
    return new;
  end if;

  if new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id then
    raise exception 'open_to_chat_requests: participant ids are immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null
     and (
       new.status is distinct from old.status
       or new.responded_at is distinct from old.responded_at
       or new.expires_at is distinct from old.expires_at
       or new.note is distinct from old.note
     ) then
    raise exception 'open_to_chat_requests: status fields are system-managed';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.forge_users_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

comment on function public.forge_users_blocked(uuid, uuid) is
  'True when either user has blocked the other. Used by Discovery and action RPCs.';

revoke all on function public.forge_users_blocked(uuid, uuid) from public, anon;
grant execute on function public.forge_users_blocked(uuid, uuid) to authenticated;

create or replace function public.forge_order_pair(p_user_a uuid, p_user_b uuid)
returns table(user_a_id uuid, user_b_id uuid)
language sql
immutable
as $$
  select
    case when p_user_a < p_user_b then p_user_a else p_user_b end,
    case when p_user_a < p_user_b then p_user_b else p_user_a end;
$$;

create or replace function public.forge_ensure_connection(
  p_user_1 uuid,
  p_user_2 uuid,
  p_source public.connection_source
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
  v_id uuid;
begin
  if p_user_1 is null or p_user_2 is null or p_user_1 = p_user_2 then
    raise exception 'forge_ensure_connection: invalid pair';
  end if;

  select o.user_a_id, o.user_b_id into v_a, v_b
  from public.forge_order_pair(p_user_1, p_user_2) o;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.connections (user_a_id, user_b_id, source, status)
  values (v_a, v_b, p_source, 'active')
  on conflict (user_a_id, user_b_id) do update
    set updated_at = now()
  returning id into v_id;

  if v_id is null then
    select c.id into v_id
    from public.connections c
    where c.user_a_id = v_a and c.user_b_id = v_b;
  end if;

  return v_id;
end;
$$;

revoke all on function public.forge_ensure_connection(uuid, uuid, public.connection_source) from public, anon;
-- Only other security definer RPCs should call this; not granted to authenticated.

-- ---------------------------------------------------------------------------
-- 4. Discoverability control
-- ---------------------------------------------------------------------------
create or replace function public.profile_meets_discovery_requirements(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.user_app_state s on s.user_id = p.id
    where p.id = p_user_id
      and coalesce(trim(p.full_name), '') <> ''
      and coalesce(trim(p.short_bio), '') <> ''
      and coalesce(s.onboarding_completed, false) = true
      and (
        coalesce(trim(p.profile_photo_url), '') <> ''
        or exists (
          select 1 from public.profile_photos ph where ph.user_id = p.id
        )
      )
  );
$$;

revoke all on function public.profile_meets_discovery_requirements(uuid) from public, anon;
grant execute on function public.profile_meets_discovery_requirements(uuid) to authenticated;

create or replace function public.set_my_discovery_visibility(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_eligible boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_foundational_user_records(v_uid);
  perform set_config('forge.allow_system_writes', 'on', true);

  if p_enabled then
    v_eligible := public.profile_meets_discovery_requirements(v_uid);
    if not v_eligible then
      return jsonb_build_object(
        'ok', false,
        'enabled', false,
        'eligible', false,
        'message', 'Complete your profile before showing yourself in Discovery.'
      );
    end if;

    update public.profiles
    set
      status = 'active',
      is_discoverable = true,
      profile_completed_at = coalesce(profile_completed_at, now()),
      last_active_at = now(),
      updated_at = now()
    where id = v_uid;

    update public.profile_preferences
    set discovery_enabled = true, updated_at = now()
    where user_id = v_uid;
  else
    update public.profiles
    set
      is_discoverable = false,
      updated_at = now()
    where id = v_uid;

    update public.profile_preferences
    set discovery_enabled = false, updated_at = now()
    where user_id = v_uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'enabled', p_enabled,
    'eligible', public.profile_meets_discovery_requirements(v_uid),
    'message', case
      when p_enabled then 'You are now visible in Discovery.'
      else 'You are hidden from Discovery. Existing connections were kept.'
    end
  );
end;
$$;

revoke all on function public.set_my_discovery_visibility(boolean) from public, anon;
grant execute on function public.set_my_discovery_visibility(boolean) to authenticated;

-- Auto-disable discoverability when required fields are cleared
create or replace function public.enforce_discoverability_requirements()
returns trigger
language plpgsql
as $$
begin
  if new.is_discoverable = true then
    if coalesce(trim(new.full_name), '') = ''
       or coalesce(trim(new.short_bio), '') = '' then
      new.is_discoverable := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_discoverability on public.profiles;
create trigger profiles_enforce_discoverability
before update on public.profiles
for each row
execute function public.enforce_discoverability_requirements();

-- ---------------------------------------------------------------------------
-- 5. Discovery eligibility listing
-- ---------------------------------------------------------------------------
create or replace function public.list_eligible_discovery_profiles(p_limit int default 50)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id <> v_uid
    and not public.forge_users_blocked(v_uid, dp.id)
    and not exists (
      select 1 from public.passed_profiles pp
      where pp.passer_id = v_uid and pp.passed_id = dp.id
    )
    and not exists (
      select 1 from public.connections c
      where c.status = 'active'
        and (
          (c.user_a_id = least(v_uid, dp.id) and c.user_b_id = greatest(v_uid, dp.id))
        )
    )
  order by
    (select p.last_active_at from public.profiles p where p.id = dp.id) desc nulls last,
    (select p.updated_at from public.profiles p where p.id = dp.id) desc nulls last,
    dp.id asc
  limit v_limit;
end;
$$;

revoke all on function public.list_eligible_discovery_profiles(int) from public, anon;
grant execute on function public.list_eligible_discovery_profiles(int) to authenticated;

create or replace function public.get_eligible_discovery_profile(p_profile_id uuid)
returns setof public.discoverable_profiles
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_profile_id is null or p_profile_id = v_uid then
    return;
  end if;

  if public.forge_users_blocked(v_uid, p_profile_id) then
    return;
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id = p_profile_id
  limit 1;
end;
$$;

revoke all on function public.get_eligible_discovery_profile(uuid) from public, anon;
grant execute on function public.get_eligible_discovery_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Save / Pass (mutually exclusive)
-- ---------------------------------------------------------------------------
create or replace function public.save_profile_for_later(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_profile_id is null or p_profile_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot save your own profile.');
  end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_profile_id)
     and not exists (
       select 1 from public.saved_profiles s where s.saver_id = v_uid and s.saved_id = p_profile_id
     ) then
    -- Allow re-save only if already saved; otherwise require discoverable target
    if not exists (select 1 from public.profiles p where p.id = p_profile_id and p.status = 'active') then
      return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
    end if;
  end if;

  delete from public.passed_profiles
  where passer_id = v_uid and passed_id = p_profile_id;

  insert into public.saved_profiles (saver_id, saved_id)
  values (v_uid, p_profile_id)
  on conflict (saver_id, saved_id) do nothing;

  return jsonb_build_object('ok', true, 'saved', true);
end;
$$;

create or replace function public.remove_saved_profile(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  delete from public.saved_profiles
  where saver_id = v_uid and saved_id = p_profile_id;
  return jsonb_build_object('ok', true, 'saved', false);
end;
$$;

create or replace function public.pass_on_profile(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_profile_id is null or p_profile_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot pass on your own profile.');
  end if;
  if public.forge_users_blocked(v_uid, p_profile_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;

  -- Do not destroy existing connections
  if exists (
    select 1 from public.connections c
    where c.status = 'active'
      and c.user_a_id = least(v_uid, p_profile_id)
      and c.user_b_id = greatest(v_uid, p_profile_id)
  ) then
    return jsonb_build_object('ok', false, 'message', 'You are already connected with this person.');
  end if;

  delete from public.saved_profiles
  where saver_id = v_uid and saved_id = p_profile_id;

  insert into public.passed_profiles (passer_id, passed_id)
  values (v_uid, p_profile_id)
  on conflict (passer_id, passed_id) do nothing;

  return jsonb_build_object('ok', true, 'passed', true);
end;
$$;

revoke all on function public.save_profile_for_later(uuid) from public, anon;
revoke all on function public.remove_saved_profile(uuid) from public, anon;
revoke all on function public.pass_on_profile(uuid) from public, anon;
grant execute on function public.save_profile_for_later(uuid) to authenticated;
grant execute on function public.remove_saved_profile(uuid) to authenticated;
grant execute on function public.pass_on_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Interested + mutual connection
-- ---------------------------------------------------------------------------
create or replace function public.send_interest(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reciprocal uuid;
  v_connection_id uuid;
  v_mutual boolean := false;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot express interest in yourself.');
  end if;
  if public.forge_users_blocked(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.interests (sender_id, recipient_id, status)
  values (v_uid, p_recipient_id, 'pending')
  on conflict (sender_id, recipient_id) do nothing;

  select i.id into v_reciprocal
  from public.interests i
  where i.sender_id = p_recipient_id
    and i.recipient_id = v_uid
    and i.status in ('pending', 'mutual')
  limit 1;

  if v_reciprocal is not null then
    update public.interests
    set status = 'mutual', updated_at = now()
    where (sender_id = v_uid and recipient_id = p_recipient_id)
       or (sender_id = p_recipient_id and recipient_id = v_uid);

    v_connection_id := public.forge_ensure_connection(
      v_uid, p_recipient_id, 'mutual_interest'::public.connection_source
    );
    v_mutual := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'interested', true,
    'mutual', v_mutual,
    'connection_id', v_connection_id
  );
end;
$$;

create or replace function public.withdraw_interest(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform set_config('forge.allow_system_writes', 'on', true);

  update public.interests
  set status = 'withdrawn', updated_at = now()
  where sender_id = v_uid
    and recipient_id = p_recipient_id
    and status = 'pending';

  return jsonb_build_object('ok', true, 'interested', false);
end;
$$;

revoke all on function public.send_interest(uuid) from public, anon;
revoke all on function public.withdraw_interest(uuid) from public, anon;
grant execute on function public.send_interest(uuid) to authenticated;
grant execute on function public.withdraw_interest(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Open to Chat send + respond
-- ---------------------------------------------------------------------------
-- Product decision pending: no numeric daily limit is enforced.
-- count_open_to_chat_sent_today exists so a limit can be wired later.
create or replace function public.count_open_to_chat_sent_today(p_user_id uuid default null)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.open_to_chat_requests r
  where r.sender_id = coalesce(p_user_id, auth.uid())
    and r.created_at >= date_trunc('day', now() at time zone 'utc');
$$;

revoke all on function public.count_open_to_chat_sent_today(uuid) from public, anon;
grant execute on function public.count_open_to_chat_sent_today(uuid) to authenticated;

create or replace function public.send_open_to_chat(p_recipient_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(trim(p_note), '');
  v_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then
    return jsonb_build_object('ok', false, 'message', 'You cannot send Open to Chat to yourself.');
  end if;
  if public.forge_users_blocked(v_uid, p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if not exists (select 1 from public.discoverable_profiles dp where dp.id = p_recipient_id) then
    return jsonb_build_object('ok', false, 'message', 'This profile is unavailable.');
  end if;
  if v_note is not null and char_length(v_note) > 200 then
    return jsonb_build_object('ok', false, 'message', 'Your note must be 200 characters or fewer.');
  end if;
  if exists (
    select 1 from public.open_to_chat_requests r
    where r.sender_id = v_uid and r.recipient_id = p_recipient_id
      and r.status in ('pending', 'deferred', 'accepted')
  ) then
    return jsonb_build_object('ok', false, 'message', 'You already sent an Open to Chat request to this person.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.open_to_chat_requests (sender_id, recipient_id, note, status)
  values (v_uid, p_recipient_id, v_note, 'pending')
  returning id into v_id;

  update public.user_app_state
  set open_to_chat_education_seen = true, updated_at = now()
  where user_id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_id,
    'note_included', v_note is not null
  );
end;
$$;

create or replace function public.respond_open_to_chat(
  p_request_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.open_to_chat_requests%rowtype;
  v_connection_id uuid;
  v_action text := lower(trim(p_action));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.open_to_chat_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if v_req.recipient_id <> v_uid then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if v_req.status not in ('pending', 'deferred') then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  if public.forge_users_blocked(v_uid, v_req.sender_id) then
    return jsonb_build_object('ok', false, 'message', 'This request is no longer available.');
  end if;

  perform set_config('forge.allow_system_writes', 'on', true);

  if v_action = 'accept' then
    update public.open_to_chat_requests
    set status = 'accepted', responded_at = now(), updated_at = now()
    where id = p_request_id;

    v_connection_id := public.forge_ensure_connection(
      v_uid, v_req.sender_id, 'open_to_chat'::public.connection_source
    );

    return jsonb_build_object(
      'ok', true,
      'status', 'accepted',
      'connection_id', v_connection_id,
      'message', 'You''re connected.'
    );
  elsif v_action = 'defer' or v_action = 'not_right_now' then
    update public.open_to_chat_requests
    set status = 'deferred', responded_at = now(), updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'deferred',
      'message', 'Saved for later. The sender was not notified.'
    );
  elsif v_action = 'decline' then
    update public.open_to_chat_requests
    set status = 'declined', responded_at = now(), updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'declined',
      'message', 'Request removed. The sender was not notified.'
    );
  else
    return jsonb_build_object('ok', false, 'message', 'Unknown action.');
  end if;
end;
$$;

create or replace function public.mark_open_to_chat_education_seen()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.ensure_foundational_user_records(v_uid);
  update public.user_app_state
  set open_to_chat_education_seen = true, updated_at = now()
  where user_id = v_uid;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.send_open_to_chat(uuid, text) from public, anon;
revoke all on function public.respond_open_to_chat(uuid, text) from public, anon;
revoke all on function public.mark_open_to_chat_education_seen() from public, anon;
grant execute on function public.send_open_to_chat(uuid, text) to authenticated;
grant execute on function public.respond_open_to_chat(uuid, text) to authenticated;
grant execute on function public.mark_open_to_chat_education_seen() to authenticated;
