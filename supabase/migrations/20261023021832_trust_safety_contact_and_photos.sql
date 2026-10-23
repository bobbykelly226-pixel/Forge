-- Safety enforcement belongs below every application/RPC entry point.
-- Production migration version assigned by Supabase on release.
create table private.contact_rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('interest', 'message')),
  created_at timestamptz not null default clock_timestamp()
);
alter table private.contact_rate_events enable row level security;
revoke all on private.contact_rate_events from public, anon, authenticated;
create index contact_rate_events_sender_kind_time on private.contact_rate_events(user_id, kind, created_at desc);
create index contact_rate_events_expiry on private.contact_rate_events(created_at);

create or replace function private.forge_member_contact_allowed(p_user_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from auth.users u join public.profiles p on p.id = u.id
    where u.id = p_user_id and u.email_confirmed_at is not null
      and not coalesce(u.is_anonymous, false)
      and (u.banned_until is null or u.banned_until <= now())
      and p.status not in ('hidden', 'deactivated')
      and not exists (
        select 1 from public.operator_member_enforcements e
        where e.target_user_id = u.id
          and e.action in ('restrict', 'suspend', 'remove', 'safety_block')
      )
  );
$$;
revoke all on function private.forge_member_contact_allowed(uuid) from public, anon, authenticated;

-- Lock both participants consistently. Operator enforcement takes this same lock,
-- so a send waiting behind a suspension rechecks current enforcement afterwards.
create or replace function private.forge_assert_contact_allowed(a uuid, b uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if a is null or b is null or a = b then
    raise exception using errcode = 'P0001', message = 'FORGE_CONTACT_UNAVAILABLE';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(least(a,b)::text, 22022));
  perform pg_advisory_xact_lock(hashtextextended(greatest(a,b)::text, 22022));
  if not private.forge_member_contact_allowed(a)
     or not private.forge_member_contact_allowed(b)
     or public.forge_users_blocked(a,b) or public.forge_pair_has_ended(a,b) then
    raise exception using errcode = 'P0001', message = 'FORGE_CONTACT_UNAVAILABLE';
  end if;
end;
$$;
revoke all on function private.forge_assert_contact_allowed(uuid,uuid) from public, anon, authenticated;

create or replace function private.forge_lock_member_enforcement()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.target_user_id::text, 22022));
  return new;
end;
$$;
revoke all on function private.forge_lock_member_enforcement() from public, anon, authenticated;
create trigger enforcement_contact_lock before insert on public.operator_member_enforcements
for each row execute function private.forge_lock_member_enforcement();

create or replace function private.forge_record_contact_rate(a uuid, b uuid, action_kind text)
returns void language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_now timestamptz := clock_timestamp(); v_minute integer; v_day integer;
begin
  -- Caller already holds the member contact lock. No content is copied here.
  select count(*) filter(where created_at > v_now - interval '1 minute'), count(*)
    into v_minute, v_day from private.contact_rate_events
    where user_id = a and kind = action_kind and created_at > v_now - interval '24 hours';
  if action_kind = 'interest' then
    if v_minute >= 10 or v_day >= 100 then
      raise exception using errcode = 'P0001', message = 'FORGE_INTEREST_RATE_LIMIT';
    end if;
    if exists(select 1 from private.contact_rate_events
      where user_id=a and recipient_id=b and kind='interest'
        and created_at > v_now - interval '24 hours') then
      raise exception using errcode = 'P0001', message = 'FORGE_INTEREST_REPEAT_LIMIT';
    end if;
  elsif action_kind = 'message' then
    if v_minute >= 30 then
      raise exception using errcode = 'P0001', message = 'FORGE_MESSAGE_RATE_LIMIT';
    end if;
  else
    raise exception 'Unsupported contact action';
  end if;
  insert into private.contact_rate_events(user_id,recipient_id,kind,created_at)
    values(a,b,action_kind,v_now);
  -- Retain only the rolling abuse window; bounded cleanup also covers inactive accounts.
  delete from private.contact_rate_events where id in (
    select id from private.contact_rate_events where created_at <= v_now - interval '24 hours'
    order by created_at limit 1000
  );
end;
$$;
revoke all on function private.forge_record_contact_rate(uuid,uuid,text) from public, anon, authenticated;

create or replace function private.forge_guard_contact_write()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare a uuid; b uuid; connection_state text; conversation_state text; v_active boolean;
begin
  if tg_table_name = 'messages' then
    a := new.sender_id;
    select case when c.user_a_id=a then c.user_b_id else c.user_a_id end,
           c.status::text, v.status::text
      into b,connection_state,conversation_state
      from public.conversations v join public.connections c on c.id=v.connection_id
      where v.id=new.conversation_id and a in(c.user_a_id,c.user_b_id);
    if connection_state is distinct from 'active' or conversation_state is distinct from 'active' then
      raise exception using errcode='P0001', message='FORGE_CONTACT_UNAVAILABLE';
    end if;
  elsif tg_table_name = 'connections' then
    if new.status <> 'active' then return new; end if;
    a:=new.user_a_id; b:=new.user_b_id;
  elsif tg_table_name = 'conversations' then
    if new.status <> 'active' then return new; end if;
    select user_a_id,user_b_id into a,b from public.connections where id=new.connection_id;
  else
    if new.status::text not in ('pending','deferred','accepted','mutual') then return new; end if;
    a:=new.sender_id; b:=new.recipient_id;
  end if;

  perform private.forge_assert_contact_allowed(a,b);

  if tg_table_name in ('interests','open_to_chat_requests') then
    select exists(select 1 from public.connections c
      where c.user_a_id=least(a,b) and c.user_b_id=greatest(a,b) and c.status='active') into v_active;
    -- Existing connections survive preference changes; new introductions must
    -- respect both people's current preferences, even with a previously known ID.
    if not v_active and (not public.can_activate_discovery_visibility(a)
       or not public.can_activate_discovery_visibility(b)
       or not public.forge_profiles_match_preferences(a,b)) then
      raise exception using errcode='P0001', message='FORGE_CONTACT_UNAVAILABLE';
    end if;
  end if;

  if tg_table_name = 'messages' then
    if char_length(trim(new.body)) >= 20 and (
      select count(distinct m.conversation_id) from public.messages m
      where m.sender_id=a and m.created_at > clock_timestamp()-interval '10 minutes'
        and lower(trim(m.body))=lower(trim(new.body)) and m.conversation_id<>new.conversation_id
    ) >= 5 then
      raise exception using errcode='P0001', message='FORGE_REPEATED_OUTREACH';
    end if;
    perform private.forge_record_contact_rate(a,b,'message');
    new.created_at:=clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function private.forge_guard_contact_write() from public, anon, authenticated;
create trigger zz_contact_safety before insert on public.messages
for each row execute function private.forge_guard_contact_write();
create trigger zz_contact_safety before insert or update of status on public.interests
for each row execute function private.forge_guard_contact_write();
create trigger zz_contact_safety before insert or update of status on public.open_to_chat_requests
for each row execute function private.forge_guard_contact_write();
create trigger zz_contact_safety before insert or update of status on public.connections
for each row execute function private.forge_guard_contact_write();
create trigger zz_contact_safety before insert or update of status on public.conversations
for each row execute function private.forge_guard_contact_write();

-- AFTER distinguishes actual sends from INSERT ... ON CONFLICT retries and
-- reactivations. An exception rolls the entire send back atomically.
create or replace function private.forge_guard_interest_rate()
returns trigger language plpgsql security definer
set search_path=pg_catalog, public
as $$
begin
  if new.status='pending' then
    if tg_op='INSERT' then
      perform private.forge_record_contact_rate(new.sender_id,new.recipient_id,'interest');
    elsif old.status='withdrawn' then
      perform private.forge_record_contact_rate(new.sender_id,new.recipient_id,'interest');
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.forge_guard_interest_rate() from public,anon,authenticated;
create trigger interest_send_rate after insert or update of status on public.interests
for each row execute function private.forge_guard_interest_rate();

revoke insert, update, delete, truncate, references, trigger on public.interests from public, anon, authenticated;
drop policy if exists "Sender creates interest" on public.interests;
drop policy if exists "Sender withdraws interest" on public.interests;

-- The canonical managed-photo rows are the only photo source. All existing
-- legacy fields are empty; NOT VALID is unnecessary and would leave old bypasses.
alter table public.profiles add constraint profiles_no_legacy_photo_url check(profile_photo_url is null);

-- Deny new upload/signing access immediately for operator-restricted accounts.
create or replace function public.forge_can_access_conversation_attachments(p_conversation_id uuid,p_user_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
select exists (
  select 1 from public.conversations c
  join public.connections conn on conn.id=c.connection_id
  join public.conversation_participants cp on cp.conversation_id=c.id and cp.user_id=p_user_id
  where c.id=p_conversation_id and c.status='active' and conn.status='active'
    and private.forge_member_contact_allowed(conn.user_a_id)
    and private.forge_member_contact_allowed(conn.user_b_id)
    and not public.forge_users_blocked(conn.user_a_id,conn.user_b_id)
);
$$;

-- Helpers remain private; callers cannot spend another member's allowance or
-- inspect private enforcement records. Existing public helper ACLs are preserved.

-- Bind an approval to the exact immutable stored object, never just its path.
alter table public.profile_photos add column approved_object_id uuid;
alter table public.profile_photos add column source_object_id uuid;
update public.profile_photos p set source_object_id=o.id
from storage.objects o where o.bucket_id='profile-photos' and o.name=p.storage_path and o.owner_id=p.user_id::text;
update public.profile_photos p set approved_object_id=o.id
from storage.objects o where p.moderation_status='approved'
  and o.bucket_id='profile-photos' and o.name=p.storage_path and o.owner_id=p.user_id::text;
create policy "Profile photo uploads cannot be overwritten" on storage.objects
as restrictive for update to authenticated
using(bucket_id<>'profile-photos') with check(bucket_id<>'profile-photos');

create or replace function private.forge_photo_is_approved(photo_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public
as $$
select exists(select 1 from public.profile_photos p join storage.objects o on o.id=p.approved_object_id
 where p.id=photo_id and p.moderation_status='approved'
   and o.bucket_id='profile-photos' and o.name=p.storage_path and o.owner_id=p.user_id::text);
$$;
revoke all on function private.forge_photo_is_approved(uuid) from public,anon,authenticated;

create or replace function private.forge_bind_photo_approval()
returns trigger language plpgsql security definer set search_path=pg_catalog,public
as $$
begin
  if auth.uid() is not null then
    if (tg_op='INSERT' and new.approved_object_id is not null)
       or (tg_op='INSERT' and new.source_object_id is not null)
       or (tg_op='UPDATE' and (new.approved_object_id is distinct from old.approved_object_id or new.source_object_id is distinct from old.source_object_id)) then
      raise exception 'Photo approval is managed by Forge review.';
    end if;
  end if;
  if tg_op='INSERT' or new.storage_path is distinct from old.storage_path then
    select o.id into new.source_object_id from storage.objects o
    where o.bucket_id='profile-photos' and o.name=new.storage_path and o.owner_id=new.user_id::text;
    if new.source_object_id is null then raise exception 'Photo upload is unavailable.'; end if;
  end if;
  if new.moderation_status <> 'approved' then
    new.approved_object_id:=null;
  elsif tg_op='INSERT' or old.moderation_status<>'approved' then
    select o.id into new.approved_object_id from storage.objects o
    where o.id=new.source_object_id and o.bucket_id='profile-photos' and o.name=new.storage_path and o.owner_id=new.user_id::text;
    if new.approved_object_id is null then raise exception 'Photo upload is unavailable for review.'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.forge_bind_photo_approval() from public,anon,authenticated;
create trigger zz_bind_photo_approval before insert or update on public.profile_photos
for each row execute function private.forge_bind_photo_approval();

create or replace function private.can_read_profile_photo_object(p_name text)
returns boolean language sql stable security definer set search_path=pg_catalog
as $$
select auth.uid() is not null and (
 split_part(p_name,'/',1)=auth.uid()::text
 or exists(select 1 from public.profile_photos p where p.storage_path=p_name
   and private.forge_photo_is_approved(p.id)
   and exists(select 1 from public.get_eligible_discovery_profile(p.user_id)))
);
$$;

create or replace function private.forge_profile_ready(p_user_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public
as $$
select exists(select 1 from public.profiles p
 where p.id=p_user_id
   and (coalesce(cardinality(p.relationship_goals),0)>0 or nullif(trim(p.relationship_goal),'') is not null)
   and (nullif(trim(p.short_bio),'') is not null or nullif(trim(p.more_about),'') is not null)
   and exists(select 1 from public.profile_photos ph where ph.user_id=p.id and private.forge_photo_is_approved(ph.id)));
$$;
revoke all on function private.forge_profile_ready(uuid) from public,anon,authenticated;

create or replace function public.can_activate_discovery_visibility(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=pg_catalog,public
as $$
select exists(select 1 from public.profiles p
 join public.profile_private_details d on d.user_id=p.id
 where p.id=p_user_id and p.status not in ('paused','hidden','deactivated')
   and private.forge_member_contact_allowed(p.id) and private.forge_profile_ready(p.id)
   and public.forge_is_adult_date_of_birth(d.date_of_birth,current_date)
   and public.forge_matching_preferences_complete(p.id));
$$;

CREATE OR REPLACE FUNCTION public.list_eligible_discovery_profile_photos(p_profile_ids uuid[])
 RETURNS TABLE(id uuid, user_id uuid, storage_path text, display_order integer, is_primary boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_profile_ids uuid[];
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_profile_ids is null or cardinality(p_profile_ids) = 0 then
    return;
  end if;

  select array_agg(requested_id order by requested_id)
  into v_profile_ids
  from (
    select distinct requested_id
    from unnest(p_profile_ids) as requested(requested_id)
    where requested_id is not null
    limit 101
  ) deduplicated;

  if coalesce(cardinality(v_profile_ids), 0) > 100 then
    raise exception 'At most 100 profile IDs may be requested';
  end if;

  return query
  select
    ph.id,
    ph.user_id,
    ph.storage_path,
    ph.display_order,
    ph.is_primary
  from public.profile_photos ph
  where ph.user_id = any(v_profile_ids)
    and private.forge_photo_is_approved(ph.id)
    and exists (
      select 1
      from public.get_eligible_discovery_profile(ph.user_id)
    )
  order by ph.user_id, ph.display_order, ph.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_my_discovery_visibility(p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
      'message', 'Add an approved photo, relationship intention and About section, and complete your age, matching preferences and location before entering Discovery.');
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
$function$;

create or replace view public.discoverable_profiles as  SELECT id,
    full_name,
    forge_discoverable_age(id) AS age,
    location,
    location_city,
    location_region,
    location_country,
    relationship_goal,
    faith_identity,
    faith_tradition,
    faith_other,
    faith_importance,
    service_background,
    service_backgrounds,
    short_bio,
    more_about,
    children,
    has_children,
    children_count,
    open_to_partner_with_children,
    education,
    pets,
    pets_types,
    smoking,
    drinking,
    career,
    relocation,
    things_i_enjoy,
    favorite_music_artists,
    favorite_music_songs,
    profile_photo_url,
    relationship_goals,
    relationship_pace,
    favorite_music_genres,
    favorite_music_other,
    favorite_music_meaningful_song,
    education_other,
    service_background_other
   FROM profiles p
  WHERE p.status='active' and p.is_discoverable and public.can_activate_discovery_visibility(p.id);

CREATE OR REPLACE FUNCTION public.list_discovery_candidate_page(p_after uuid DEFAULT NULL, p_limit integer DEFAULT 100)
 RETURNS SETOF discoverable_profiles
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_activate_discovery_visibility(v_uid) then
    return;
  end if;

  return query
  select dp.*
  from public.discoverable_profiles dp
  where dp.id <> v_uid and (p_after is null or dp.id > p_after)
    and public.forge_profiles_match_preferences(v_uid, dp.id)
    and not public.forge_users_blocked(v_uid, dp.id)
    and not exists (
      select 1 from public.passed_profiles pp
      where pp.passer_id = v_uid and pp.passed_id = dp.id
    )
    and not exists (
      select 1 from public.connections c
      where c.user_a_id = least(v_uid, dp.id)
        and c.user_b_id = greatest(v_uid, dp.id)
    )
  order by dp.id
  limit v_limit;
end;
$function$;

revoke all on function public.list_discovery_candidate_page(uuid,integer) from public,anon;
grant execute on function public.list_discovery_candidate_page(uuid,integer) to authenticated;
