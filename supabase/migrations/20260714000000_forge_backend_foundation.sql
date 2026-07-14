-- =============================================================================
-- Forge Backend Foundation
-- Core data model, RLS, triggers, and storage-compatible photo policies
--
-- Does NOT modify waitlist or feedback tables.
-- Does NOT delete compatibility_answers.
-- Preserves existing profiles / compatibility_answers columns used by V1 UI.
-- Preserves the existing PUBLIC profile-photos bucket (private bucket deferred
-- until signed-URL retrieval is wired in the profile-persistence PR).
-- Remote application: run in Supabase SQL Editor when the project is linked.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Shared updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Reusable BEFORE UPDATE trigger function that sets updated_at = now().';

-- Keep legacy profile trigger function as an alias of the shared helper
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_compatibility_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.profile_status as enum (
    'draft',
    'active',
    'paused',
    'hidden',
    'deactivated'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.answer_visibility as enum (
    'private',
    'shared_with_matches',
    'public_summary'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.photo_moderation_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.interest_status as enum (
    'pending',
    'mutual',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.open_to_chat_status as enum (
    'pending',
    'accepted',
    'declined',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.connection_source as enum (
    'mutual_interest',
    'open_to_chat'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.connection_status as enum (
    'active',
    'ended'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.character_signal_status as enum (
    'pending',
    'approved',
    'declined'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.character_signal_interaction as enum (
    'in_app',
    'in_person'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. profiles — extend V1 table for Profile V2 public presentation
-- ---------------------------------------------------------------------------
-- Existing V1 fields retained as source of truth where they already map:
--   full_name          → display name
--   short_bio          → About
--   faith_importance   → Faith
--   relationship_goal, service_background, location, age, profile_photo_url

alter table public.profiles
  add column if not exists more_about text,
  add column if not exists children text,
  add column if not exists has_children text,
  add column if not exists education text,
  add column if not exists pets text,
  add column if not exists smoking text,
  add column if not exists drinking text,
  add column if not exists career text,
  add column if not exists relocation text,
  add column if not exists things_i_enjoy text[] not null default '{}',
  add column if not exists favorite_music_artists text[] not null default '{}',
  add column if not exists favorite_music_songs text[] not null default '{}',
  add column if not exists status public.profile_status not null default 'draft',
  add column if not exists is_discoverable boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists last_active_at timestamptz;

comment on table public.profiles is
  'Public-facing profile presentation and lifecycle. Private DOB/coords live in profile_private_details.';
comment on column public.profiles.full_name is
  'Display name shown on the profile (V1 field name retained).';
comment on column public.profiles.short_bio is
  'About section copy (V1 field name retained).';
comment on column public.profiles.faith_importance is
  'Faith / faith importance (V1 field name retained).';
comment on column public.profiles.more_about is
  'Expanded More About narrative beyond short_bio.';
comment on column public.profiles.things_i_enjoy is
  'Ordered Things I Enjoy labels for Profile V2.';
comment on column public.profiles.favorite_music_artists is
  'Ordered favorite artist names.';
comment on column public.profiles.favorite_music_songs is
  'Ordered favorite song titles.';
comment on column public.profiles.status is
  'Profile lifecycle status. Only active + discoverable profiles are browsable by others.';
comment on column public.profiles.is_discoverable is
  'Whether the profile may appear in discovery. Defaults false; never auto-enabled on signup.';
comment on column public.profiles.profile_photo_url is
  'Legacy V1 single-photo URL. Prefer profile_photos + signed URLs going forward.';

create index if not exists profiles_discoverable_active_idx
  on public.profiles (status, is_discoverable)
  where status = 'active' and is_discoverable = true;

-- Owner-only access to the base profiles table.
-- Other authenticated users read intentional public fields via
-- public.discoverable_profiles (not select * on profiles).
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Owners can view own profile" on public.profiles;
drop policy if exists "Authenticated can view discoverable active profiles" on public.profiles;
drop policy if exists "Owners can insert own profile" on public.profiles;
drop policy if exists "Owners can update own profile" on public.profiles;

create policy "Owners can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Owners can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Owners can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Discoverable profile projection: only intentionally public presentation fields.
-- security_invoker = false so peers do not need base-table SELECT (owner-only RLS).
drop view if exists public.discoverable_profiles;
create view public.discoverable_profiles
with (security_invoker = false)
as
select
  p.id,
  p.full_name,
  p.age,
  p.location,
  p.relationship_goal,
  p.faith_importance,
  p.service_background,
  p.short_bio,
  p.more_about,
  p.children,
  p.has_children,
  p.education,
  p.pets,
  p.smoking,
  p.drinking,
  p.career,
  p.relocation,
  p.things_i_enjoy,
  p.favorite_music_artists,
  p.favorite_music_songs,
  p.profile_photo_url
from public.profiles p
where p.status = 'active'
  and p.is_discoverable = true;

comment on view public.discoverable_profiles is
  'Public presentation fields for active+discoverable profiles. Excludes DOB, postal, coords, email, phone, admin status, and private timestamps.';

grant select on public.discoverable_profiles to authenticated;
revoke all on public.discoverable_profiles from anon;

-- ---------------------------------------------------------------------------
-- 4. profile_private_details — owner-only sensitive inputs
-- ---------------------------------------------------------------------------

create table if not exists public.profile_private_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date,
  postal_code text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_private_details_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint profile_private_details_latitude_range check (
    latitude is null or (latitude >= -90 and latitude <= 90)
  ),
  constraint profile_private_details_longitude_range check (
    longitude is null or (longitude >= -180 and longitude <= 180)
  )
);

comment on table public.profile_private_details is
  'Sensitive matching inputs never exposed as ordinary public profile columns. Owner-only RLS.';
comment on column public.profile_private_details.date_of_birth is
  'Exact DOB. Never select this through public profile queries.';

drop trigger if exists profile_private_details_updated_at on public.profile_private_details;
create trigger profile_private_details_updated_at
before update on public.profile_private_details
for each row
execute function public.set_updated_at();

alter table public.profile_private_details enable row level security;

drop policy if exists "Owners manage private details select" on public.profile_private_details;
drop policy if exists "Owners manage private details insert" on public.profile_private_details;
drop policy if exists "Owners manage private details update" on public.profile_private_details;

create policy "Owners manage private details select"
on public.profile_private_details for select to authenticated
using (auth.uid() = user_id);

create policy "Owners manage private details insert"
on public.profile_private_details for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners manage private details update"
on public.profile_private_details for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.profile_private_details to authenticated;
revoke all on table public.profile_private_details from anon;

-- ---------------------------------------------------------------------------
-- 5. profile_preferences
-- ---------------------------------------------------------------------------

create table if not exists public.profile_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender_identity text,
  interested_in text[] not null default '{}',
  preferred_age_min integer,
  preferred_age_max integer,
  max_distance_miles integer,
  discovery_enabled boolean not null default false,
  open_to_chat_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_preferences_age_min_range check (
    preferred_age_min is null or (preferred_age_min >= 18 and preferred_age_min <= 120)
  ),
  constraint profile_preferences_age_max_range check (
    preferred_age_max is null or (preferred_age_max >= 18 and preferred_age_max <= 120)
  ),
  constraint profile_preferences_age_order check (
    preferred_age_min is null
    or preferred_age_max is null
    or preferred_age_min <= preferred_age_max
  ),
  constraint profile_preferences_max_distance_range check (
    max_distance_miles is null
    or (max_distance_miles >= 1 and max_distance_miles <= 500)
  )
);

comment on table public.profile_preferences is
  'Discovery and relationship preferences. Owner-only.';

drop trigger if exists profile_preferences_updated_at on public.profile_preferences;
create trigger profile_preferences_updated_at
before update on public.profile_preferences
for each row
execute function public.set_updated_at();

alter table public.profile_preferences enable row level security;

drop policy if exists "Owners manage preferences select" on public.profile_preferences;
drop policy if exists "Owners manage preferences insert" on public.profile_preferences;
drop policy if exists "Owners manage preferences update" on public.profile_preferences;

create policy "Owners manage preferences select"
on public.profile_preferences for select to authenticated
using (auth.uid() = user_id);

create policy "Owners manage preferences insert"
on public.profile_preferences for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners manage preferences update"
on public.profile_preferences for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.profile_preferences to authenticated;
revoke all on table public.profile_preferences from anon;

-- ---------------------------------------------------------------------------
-- 6. profile_answers — expandable questionnaire store
-- ---------------------------------------------------------------------------

create table if not exists public.profile_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  importance_level integer,
  is_non_negotiable boolean not null default false,
  visibility public.answer_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_answers_user_question_unique unique (user_id, question_key),
  constraint profile_answers_question_key_format check (
    question_key ~ '^[a-z][a-z0-9_]*$'
  ),
  constraint profile_answers_importance_range check (
    importance_level is null
    or (importance_level >= 1 and importance_level <= 5)
  )
);

comment on table public.profile_answers is
  'Compatibility, values, lifestyle, and alignment answers keyed by stable question_key. Matching will consume this later via trusted logic.';
comment on column public.profile_answers.question_key is
  'Stable technical identifier (e.g. relationship_intention), never full question text.';

create index if not exists profile_answers_user_id_idx
  on public.profile_answers (user_id);

create index if not exists profile_answers_question_key_idx
  on public.profile_answers (question_key);

drop trigger if exists profile_answers_updated_at on public.profile_answers;
create trigger profile_answers_updated_at
before update on public.profile_answers
for each row
execute function public.set_updated_at();

alter table public.profile_answers enable row level security;

drop policy if exists "Owners manage answers select" on public.profile_answers;
drop policy if exists "Owners manage answers insert" on public.profile_answers;
drop policy if exists "Owners manage answers update" on public.profile_answers;
drop policy if exists "Owners manage answers delete" on public.profile_answers;

create policy "Owners manage answers select"
on public.profile_answers for select to authenticated
using (auth.uid() = user_id);

create policy "Owners manage answers insert"
on public.profile_answers for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners manage answers update"
on public.profile_answers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners manage answers delete"
on public.profile_answers for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.profile_answers to authenticated;
revoke all on table public.profile_answers from anon;

-- ---------------------------------------------------------------------------
-- 7. profile_photos — ordered photo metadata (not image bytes)
-- ---------------------------------------------------------------------------

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  display_order integer not null,
  is_primary boolean not null default false,
  moderation_status public.photo_moderation_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_photos_display_order_nonneg check (display_order >= 0),
  constraint profile_photos_storage_path_nonempty check (length(trim(storage_path)) > 0),
  constraint profile_photos_user_order_unique unique (user_id, display_order),
  constraint profile_photos_user_path_unique unique (user_id, storage_path)
);

comment on table public.profile_photos is
  'Ordered profile photo metadata. Binary files live in the private profile-photos storage bucket.';

create unique index if not exists profile_photos_one_primary_per_user_idx
  on public.profile_photos (user_id)
  where is_primary = true;

create index if not exists profile_photos_user_id_idx
  on public.profile_photos (user_id);

drop trigger if exists profile_photos_updated_at on public.profile_photos;
create trigger profile_photos_updated_at
before update on public.profile_photos
for each row
execute function public.set_updated_at();

alter table public.profile_photos enable row level security;

drop policy if exists "Owners manage photos select" on public.profile_photos;
drop policy if exists "Owners manage photos insert" on public.profile_photos;
drop policy if exists "Owners manage photos update" on public.profile_photos;
drop policy if exists "Owners manage photos delete" on public.profile_photos;
drop policy if exists "Authenticated can view discoverable profile photos" on public.profile_photos;

-- Owner-only on the base table (hides moderation_status from peers).
create policy "Owners manage photos select"
on public.profile_photos for select to authenticated
using (auth.uid() = user_id);

create policy "Owners manage photos insert"
on public.profile_photos for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners manage photos update"
on public.profile_photos for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners manage photos delete"
on public.profile_photos for delete to authenticated
using (auth.uid() = user_id);

revoke all on table public.profile_photos from anon;
revoke all on table public.profile_photos from authenticated;
grant select, insert, update, delete on public.profile_photos to authenticated;

-- Peer-safe photo metadata (no moderation fields).
drop view if exists public.discoverable_profile_photos;
create view public.discoverable_profile_photos
with (security_invoker = false)
as
select
  ph.id,
  ph.user_id,
  ph.storage_path,
  ph.display_order,
  ph.is_primary
from public.profile_photos ph
inner join public.profiles p on p.id = ph.user_id
where p.status = 'active'
  and p.is_discoverable = true
  and ph.moderation_status = 'approved';

comment on view public.discoverable_profile_photos is
  'Approved photo metadata for active+discoverable profiles. Excludes moderation_status.';

grant select on public.discoverable_profile_photos to authenticated;
revoke all on public.discoverable_profile_photos from anon;

-- ---------------------------------------------------------------------------
-- 8. user_app_state — small cross-device product flags
-- ---------------------------------------------------------------------------

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  onboarding_step text,
  onboarding_completed boolean not null default false,
  open_to_chat_education_seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_app_state is
  'Small durable product state (onboarding progress, first-run education). Not a general JSON dump.';

drop trigger if exists user_app_state_updated_at on public.user_app_state;
create trigger user_app_state_updated_at
before update on public.user_app_state
for each row
execute function public.set_updated_at();

alter table public.user_app_state enable row level security;

drop policy if exists "Owners manage app state select" on public.user_app_state;
drop policy if exists "Owners manage app state insert" on public.user_app_state;
drop policy if exists "Owners manage app state update" on public.user_app_state;

create policy "Owners manage app state select"
on public.user_app_state for select to authenticated
using (auth.uid() = user_id);

create policy "Owners manage app state insert"
on public.user_app_state for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners manage app state update"
on public.user_app_state for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.user_app_state to authenticated;
revoke all on table public.user_app_state from anon;

-- ---------------------------------------------------------------------------
-- 9. saved_profiles — private Save for Later
-- ---------------------------------------------------------------------------

create table if not exists public.saved_profiles (
  id uuid primary key default gen_random_uuid(),
  saver_id uuid not null references auth.users (id) on delete cascade,
  saved_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_profiles_no_self check (saver_id <> saved_id),
  constraint saved_profiles_unique unique (saver_id, saved_id)
);

comment on table public.saved_profiles is
  'Private Save for Later. The saved person cannot read who saved them.';

create index if not exists saved_profiles_saver_id_idx
  on public.saved_profiles (saver_id);

alter table public.saved_profiles enable row level security;

drop policy if exists "Savers manage saved select" on public.saved_profiles;
drop policy if exists "Savers manage saved insert" on public.saved_profiles;
drop policy if exists "Savers manage saved delete" on public.saved_profiles;

create policy "Savers manage saved select"
on public.saved_profiles for select to authenticated
using (auth.uid() = saver_id);

create policy "Savers manage saved insert"
on public.saved_profiles for insert to authenticated
with check (auth.uid() = saver_id and saver_id <> saved_id);

create policy "Savers manage saved delete"
on public.saved_profiles for delete to authenticated
using (auth.uid() = saver_id);

grant select, insert, delete on public.saved_profiles to authenticated;
revoke all on table public.saved_profiles from anon;

-- ---------------------------------------------------------------------------
-- 10. passed_profiles — private Not for Me
-- ---------------------------------------------------------------------------

create table if not exists public.passed_profiles (
  id uuid primary key default gen_random_uuid(),
  passer_id uuid not null references auth.users (id) on delete cascade,
  passed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint passed_profiles_no_self check (passer_id <> passed_id),
  constraint passed_profiles_unique unique (passer_id, passed_id)
);

comment on table public.passed_profiles is
  'Private Not for Me decisions. The passed person is never notified via this table.';

create index if not exists passed_profiles_passer_id_idx
  on public.passed_profiles (passer_id);

alter table public.passed_profiles enable row level security;

drop policy if exists "Passers manage passed select" on public.passed_profiles;
drop policy if exists "Passers manage passed insert" on public.passed_profiles;
drop policy if exists "Passers manage passed delete" on public.passed_profiles;

create policy "Passers manage passed select"
on public.passed_profiles for select to authenticated
using (auth.uid() = passer_id);

create policy "Passers manage passed insert"
on public.passed_profiles for insert to authenticated
with check (auth.uid() = passer_id and passer_id <> passed_id);

create policy "Passers manage passed delete"
on public.passed_profiles for delete to authenticated
using (auth.uid() = passer_id);

grant select, insert, delete on public.passed_profiles to authenticated;
revoke all on table public.passed_profiles from anon;

-- ---------------------------------------------------------------------------
-- 11. interests — Interested actions
-- ---------------------------------------------------------------------------

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status public.interest_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interests_no_self check (sender_id <> recipient_id),
  constraint interests_unique_pair unique (sender_id, recipient_id)
);

comment on table public.interests is
  'Persisted Interested actions. Mutual handling and messaging come later.';

create index if not exists interests_recipient_id_idx
  on public.interests (recipient_id);

create index if not exists interests_sender_id_idx
  on public.interests (sender_id);

drop trigger if exists interests_updated_at on public.interests;
create trigger interests_updated_at
before update on public.interests
for each row
execute function public.set_updated_at();

alter table public.interests enable row level security;

drop policy if exists "Participants read interests" on public.interests;
drop policy if exists "Sender creates interest" on public.interests;
drop policy if exists "Sender withdraws interest" on public.interests;

create policy "Participants read interests"
on public.interests for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Sender creates interest"
on public.interests for insert to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and status = 'pending'
);

-- Sender may only withdraw their own pending interest (no arbitrary status edits)
create policy "Sender withdraws interest"
on public.interests for update to authenticated
using (auth.uid() = sender_id and status = 'pending')
with check (auth.uid() = sender_id and status = 'withdrawn');

grant select, insert, update on public.interests to authenticated;
revoke all on table public.interests from anon;

-- ---------------------------------------------------------------------------
-- 12. open_to_chat_requests
-- ---------------------------------------------------------------------------

create table if not exists public.open_to_chat_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  note text,
  status public.open_to_chat_status not null default 'pending',
  expires_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_to_chat_no_self check (sender_id <> recipient_id),
  constraint open_to_chat_unique_pair unique (sender_id, recipient_id),
  constraint open_to_chat_note_length check (
    note is null or char_length(note) <= 200
  )
);

comment on table public.open_to_chat_requests is
  'Open to Chat V2 requests. Decline is visible only to participants. No read receipts or ignored status.';
comment on column public.open_to_chat_requests.note is
  'Optional introduction note, max 200 characters.';

create index if not exists open_to_chat_recipient_id_idx
  on public.open_to_chat_requests (recipient_id);

create index if not exists open_to_chat_sender_id_idx
  on public.open_to_chat_requests (sender_id);

drop trigger if exists open_to_chat_requests_updated_at on public.open_to_chat_requests;
create trigger open_to_chat_requests_updated_at
before update on public.open_to_chat_requests
for each row
execute function public.set_updated_at();

alter table public.open_to_chat_requests enable row level security;

drop policy if exists "Participants read open to chat" on public.open_to_chat_requests;
drop policy if exists "Sender creates open to chat" on public.open_to_chat_requests;

create policy "Participants read open to chat"
on public.open_to_chat_requests for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Sender creates open to chat"
on public.open_to_chat_requests for insert to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and status = 'pending'
  and (note is null or char_length(note) <= 200)
);

-- No authenticated UPDATE policy: accept/decline/expire via trusted SQL functions in a later PR

grant select, insert on public.open_to_chat_requests to authenticated;
revoke all on table public.open_to_chat_requests from anon;

-- ---------------------------------------------------------------------------
-- 13. connections — mutual interest or accepted Open to Chat
-- ---------------------------------------------------------------------------

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  source public.connection_source not null,
  status public.connection_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_no_self check (user_a_id <> user_b_id),
  constraint connections_ordered_pair check (user_a_id < user_b_id),
  constraint connections_unique_pair unique (user_a_id, user_b_id)
);

comment on table public.connections is
  'Real connections from mutual interest or accepted Open to Chat. Messaging attaches later. Client inserts are denied.';

create index if not exists connections_user_a_id_idx on public.connections (user_a_id);
create index if not exists connections_user_b_id_idx on public.connections (user_b_id);

drop trigger if exists connections_updated_at on public.connections;
create trigger connections_updated_at
before update on public.connections
for each row
execute function public.set_updated_at();

alter table public.connections enable row level security;

drop policy if exists "Participants read connections" on public.connections;

create policy "Participants read connections"
on public.connections for select to authenticated
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- No insert/update/delete for authenticated clients

grant select on public.connections to authenticated;
revoke all on table public.connections from anon;

-- ---------------------------------------------------------------------------
-- 14. user_blocks — basic safety foundation
-- ---------------------------------------------------------------------------

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_no_self check (blocker_id <> blocked_id),
  constraint user_blocks_unique unique (blocker_id, blocked_id)
);

comment on table public.user_blocks is
  'Basic block list for future discovery/connection filtering. Not a full moderation system.';

create index if not exists user_blocks_blocker_id_idx on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Blockers manage blocks select" on public.user_blocks;
drop policy if exists "Blockers manage blocks insert" on public.user_blocks;
drop policy if exists "Blockers manage blocks delete" on public.user_blocks;

create policy "Blockers manage blocks select"
on public.user_blocks for select to authenticated
using (auth.uid() = blocker_id);

create policy "Blockers manage blocks insert"
on public.user_blocks for insert to authenticated
with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

create policy "Blockers manage blocks delete"
on public.user_blocks for delete to authenticated
using (auth.uid() = blocker_id);

grant select, insert, delete on public.user_blocks to authenticated;
revoke all on table public.user_blocks from anon;

-- ---------------------------------------------------------------------------
-- 15. character_signals — positive-only recognition
-- ---------------------------------------------------------------------------

create table if not exists public.character_signals (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  signal_key text not null,
  interaction_type public.character_signal_interaction,
  interaction_context text,
  status public.character_signal_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint character_signals_no_self check (giver_id <> receiver_id),
  constraint character_signals_key_format check (
    signal_key ~ '^[a-z][a-z0-9_]*$'
  )
);

comment on table public.character_signals is
  'Positive-only Character Signals. Receiver controls public display approval. No negative reviews.';
comment on column public.character_signals.signal_key is
  'Stable positive signal key (e.g. respectful_communicator).';

create index if not exists character_signals_receiver_id_idx
  on public.character_signals (receiver_id);

create index if not exists character_signals_giver_id_idx
  on public.character_signals (giver_id);

alter table public.character_signals enable row level security;

drop policy if exists "Participants read character signals" on public.character_signals;
drop policy if exists "Giver creates character signal" on public.character_signals;
drop policy if exists "Receiver responds to character signal" on public.character_signals;

create policy "Participants read character signals"
on public.character_signals for select to authenticated
using (auth.uid() = giver_id or auth.uid() = receiver_id);

create policy "Giver creates character signal"
on public.character_signals for insert to authenticated
with check (
  auth.uid() = giver_id
  and giver_id <> receiver_id
  and status = 'pending'
);

create policy "Receiver responds to character signal"
on public.character_signals for update to authenticated
using (auth.uid() = receiver_id and status = 'pending')
with check (
  auth.uid() = receiver_id
  and status in ('approved', 'declined')
);

grant select, insert, update on public.character_signals to authenticated;
revoke all on table public.character_signals from anon;

-- ---------------------------------------------------------------------------
-- 16. Foundational user records — ensure function + signup trigger
-- ---------------------------------------------------------------------------

create or replace function public.ensure_foundational_user_records(
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_created text[] := array[]::text[];
  v_missing_before text[] := array[]::text[];
  v_row_id uuid;
begin
  v_uid := coalesce(p_user_id, auth.uid());

  if v_uid is null then
    raise exception 'ensure_foundational_user_records: authenticated user required';
  end if;

  -- Authenticated callers may only repair their own rows.
  if auth.uid() is not null and auth.uid() is distinct from v_uid then
    raise exception 'ensure_foundational_user_records: cannot repair another user';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid) then
    v_missing_before := array_append(v_missing_before, 'profiles');
  end if;
  if not exists (select 1 from public.profile_private_details where user_id = v_uid) then
    v_missing_before := array_append(v_missing_before, 'profile_private_details');
  end if;
  if not exists (select 1 from public.profile_preferences where user_id = v_uid) then
    v_missing_before := array_append(v_missing_before, 'profile_preferences');
  end if;
  if not exists (select 1 from public.user_app_state where user_id = v_uid) then
    v_missing_before := array_append(v_missing_before, 'user_app_state');
  end if;

  insert into public.profiles (id)
  values (v_uid)
  on conflict (id) do nothing
  returning id into v_row_id;
  if v_row_id is not null then
    v_created := array_append(v_created, 'profiles');
  end if;
  v_row_id := null;

  insert into public.profile_private_details (user_id)
  values (v_uid)
  on conflict (user_id) do nothing
  returning user_id into v_row_id;
  if v_row_id is not null then
    v_created := array_append(v_created, 'profile_private_details');
  end if;
  v_row_id := null;

  insert into public.profile_preferences (user_id)
  values (v_uid)
  on conflict (user_id) do nothing
  returning user_id into v_row_id;
  if v_row_id is not null then
    v_created := array_append(v_created, 'profile_preferences');
  end if;
  v_row_id := null;

  insert into public.user_app_state (user_id)
  values (v_uid)
  on conflict (user_id) do nothing
  returning user_id into v_row_id;
  if v_row_id is not null then
    v_created := array_append(v_created, 'user_app_state');
  end if;

  if cardinality(v_missing_before) > 0 then
    raise log 'ensure_foundational_user_records repaired user % missing=% created=%',
      v_uid, v_missing_before, v_created;
  end if;

  -- Verify all four rows now exist; surface hard failures to the caller.
  if not exists (select 1 from public.profiles where id = v_uid)
     or not exists (select 1 from public.profile_private_details where user_id = v_uid)
     or not exists (select 1 from public.profile_preferences where user_id = v_uid)
     or not exists (select 1 from public.user_app_state where user_id = v_uid) then
    raise exception 'ensure_foundational_user_records: incomplete after repair for %', v_uid;
  end if;

  return jsonb_build_object(
    'user_id', v_uid,
    'missing_before', to_jsonb(v_missing_before),
    'created', to_jsonb(v_created),
    'ok', true
  );
end;
$$;

comment on function public.ensure_foundational_user_records(uuid) is
  'Idempotent repair for profiles, profile_private_details, profile_preferences, and user_app_state. Callable from the server data layer.';

grant execute on function public.ensure_foundational_user_records(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  begin
    v_result := public.ensure_foundational_user_records(new.id);
    raise log 'handle_new_user ok for %: %', new.id, v_result;
  exception
    when others then
      -- Signup must not fail, but missing rows must not be silent.
      raise warning 'handle_new_user ensure failed for %: % — will rely on server repair',
        new.id, sqlerrm;
  end;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'After signup, ensures foundational owner rows via ensure_foundational_user_records. Logs failures; does not abort auth. Never sets discoverable.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Backfill existing auth users who lack foundation rows (safe, idempotent)
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into public.profile_private_details (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.profile_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.user_app_state (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 17. Storage: keep existing PUBLIC profile-photos bucket (compatibility)
-- ---------------------------------------------------------------------------
-- The live ProfileForm uploads with getPublicUrl(). Flipping this bucket to
-- private would break current photos, previews, and uploads until signed-URL
-- retrieval is wired. Private-bucket hardening is deferred to the
-- profile-persistence PR. This migration only reaffirms safe owner write
-- policies and public read for the existing V1 photo flow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own profile photos" on storage.objects;
drop policy if exists "Users can update own profile photos" on storage.objects;
drop policy if exists "Users can delete own profile photos" on storage.objects;
drop policy if exists "Profile photos are publicly readable" on storage.objects;
drop policy if exists "Owners can read own profile photos" on storage.objects;
drop policy if exists "Authenticated can read discoverable profile photo files" on storage.objects;

create policy "Users can upload own profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own profile photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Preserves current V1 getPublicUrl() behavior.
create policy "Profile photos are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'profile-photos');

-- ---------------------------------------------------------------------------
-- 18. Protect system-controlled columns from ordinary client edits
-- ---------------------------------------------------------------------------

create or replace function public.protect_profiles_system_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- Clients may only create their own draft, non-discoverable shell rows.
    if auth.uid() is not null then
      new.id := auth.uid();
      new.status := coalesce(new.status, 'draft');
      if new.status is distinct from 'draft' then
        raise exception 'profiles: clients may only insert status=draft';
      end if;
      new.is_discoverable := false;
      new.onboarding_completed_at := null;
      new.profile_completed_at := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.id is distinct from old.id then
    raise exception 'profiles: id is immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null then
    if new.status is distinct from old.status then
      raise exception 'profiles: status is system-managed';
    end if;

    -- Allow first stamp of onboarding/profile completion; block other changes.
    if new.onboarding_completed_at is distinct from old.onboarding_completed_at then
      if old.onboarding_completed_at is not null
         or new.onboarding_completed_at is null then
        raise exception 'profiles: onboarding_completed_at is system-managed';
      end if;
    end if;

    if new.profile_completed_at is distinct from old.profile_completed_at then
      if old.profile_completed_at is not null
         or new.profile_completed_at is null then
        raise exception 'profiles: profile_completed_at is system-managed';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_system_columns on public.profiles;
create trigger profiles_protect_system_columns
before insert or update on public.profiles
for each row
execute function public.protect_profiles_system_columns();

create or replace function public.protect_owner_user_id()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception '%: user_id is immutable', tg_table_name;
  end if;

  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profile_private_details_protect_user_id on public.profile_private_details;
create trigger profile_private_details_protect_user_id
before insert or update on public.profile_private_details
for each row
execute function public.protect_owner_user_id();

drop trigger if exists profile_preferences_protect_user_id on public.profile_preferences;
create trigger profile_preferences_protect_user_id
before insert or update on public.profile_preferences
for each row
execute function public.protect_owner_user_id();

drop trigger if exists user_app_state_protect_user_id on public.user_app_state;
create trigger user_app_state_protect_user_id
before insert or update on public.user_app_state
for each row
execute function public.protect_owner_user_id();

drop trigger if exists profile_answers_protect_user_id on public.profile_answers;
create trigger profile_answers_protect_user_id
before insert or update on public.profile_answers
for each row
execute function public.protect_owner_user_id();

create or replace function public.protect_profile_photos_system_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
      new.moderation_status := coalesce(new.moderation_status, 'approved');
      -- Ordinary clients cannot self-approve rejected or force pending away later via insert tricks
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'profile_photos: user_id is immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null
     and new.moderation_status is distinct from old.moderation_status then
    raise exception 'profile_photos: moderation_status is system-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists profile_photos_protect_system_columns on public.profile_photos;
create trigger profile_photos_protect_system_columns
before insert or update on public.profile_photos
for each row
execute function public.protect_profile_photos_system_columns();

create or replace function public.protect_interest_system_columns()
returns trigger
language plpgsql
as $$
begin
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
    -- Only pending → withdrawn is allowed for ordinary users (matches RLS).
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

drop trigger if exists interests_protect_system_columns on public.interests;
create trigger interests_protect_system_columns
before insert or update on public.interests
for each row
execute function public.protect_interest_system_columns();

create or replace function public.protect_open_to_chat_system_columns()
returns trigger
language plpgsql
as $$
begin
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

  -- Ordinary clients have no UPDATE policy; still hard-block identity/status edits.
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
     ) then
    raise exception 'open_to_chat_requests: status fields are system-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists open_to_chat_protect_system_columns on public.open_to_chat_requests;
create trigger open_to_chat_protect_system_columns
before insert or update on public.open_to_chat_requests
for each row
execute function public.protect_open_to_chat_system_columns();

create or replace function public.protect_connections_system_columns()
returns trigger
language plpgsql
as $$
begin
  -- Trusted SQL may set forge.allow_system_writes = 'on' for the transaction.
  if coalesce(current_setting('forge.allow_system_writes', true), 'off') = 'on' then
    if tg_op = 'INSERT' then
      if new.user_a_id = new.user_b_id then
        raise exception 'connections: cannot connect to yourself';
      end if;
      if new.user_a_id > new.user_b_id then
        raise exception 'connections: user_a_id must be less than user_b_id';
      end if;
    elsif new.user_a_id is distinct from old.user_a_id
       or new.user_b_id is distinct from old.user_b_id then
      raise exception 'connections: participant ids are immutable';
    else
      new.created_at := old.created_at;
    end if;
    return new;
  end if;

  if auth.uid() is not null then
    raise exception 'connections: client writes are not permitted';
  end if;

  if tg_op = 'INSERT' then
    if new.user_a_id = new.user_b_id then
      raise exception 'connections: cannot connect to yourself';
    end if;
    if new.user_a_id > new.user_b_id then
      raise exception 'connections: user_a_id must be less than user_b_id';
    end if;
    return new;
  end if;

  if new.user_a_id is distinct from old.user_a_id
     or new.user_b_id is distinct from old.user_b_id then
    raise exception 'connections: participant ids are immutable';
  end if;

  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists connections_protect_system_columns on public.connections;
create trigger connections_protect_system_columns
before insert or update on public.connections
for each row
execute function public.protect_connections_system_columns();

create or replace function public.protect_character_signals_system_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.giver_id := auth.uid();
      new.status := 'pending';
      new.responded_at := null;
    end if;
    if new.giver_id = new.receiver_id then
      raise exception 'character_signals: cannot signal yourself';
    end if;
    return new;
  end if;

  if new.giver_id is distinct from old.giver_id
     or new.receiver_id is distinct from old.receiver_id then
    raise exception 'character_signals: giver/receiver ids are immutable';
  end if;

  if new.signal_key is distinct from old.signal_key then
    raise exception 'character_signals: signal_key is immutable';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null then
    if not (
      auth.uid() = old.receiver_id
      and old.status = 'pending'
      and new.status in ('approved', 'declined')
    ) then
      if new.status is distinct from old.status then
        raise exception 'character_signals: status change not permitted';
      end if;
    else
      new.responded_at := coalesce(new.responded_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists character_signals_protect_system_columns on public.character_signals;
create trigger character_signals_protect_system_columns
before insert or update on public.character_signals
for each row
execute function public.protect_character_signals_system_columns();

create or replace function public.protect_saved_passed_block_ids()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    return new;
  end if;

  -- These tables only allow delete for actors; block any update of identity columns.
  raise exception '%: updates are not permitted', tg_table_name;
end;
$$;

drop trigger if exists saved_profiles_no_update on public.saved_profiles;
create trigger saved_profiles_no_update
before update on public.saved_profiles
for each row
execute function public.protect_saved_passed_block_ids();

drop trigger if exists passed_profiles_no_update on public.passed_profiles;
create trigger passed_profiles_no_update
before update on public.passed_profiles
for each row
execute function public.protect_saved_passed_block_ids();

drop trigger if exists user_blocks_no_update on public.user_blocks;
create trigger user_blocks_no_update
before update on public.user_blocks
for each row
execute function public.protect_saved_passed_block_ids();

-- Index helpers for relationship lookups used by app queries / policies
create index if not exists saved_profiles_saved_id_idx on public.saved_profiles (saved_id);
create index if not exists passed_profiles_passed_id_idx on public.passed_profiles (passed_id);
create index if not exists user_blocks_blocked_id_idx on public.user_blocks (blocked_id);
create index if not exists open_to_chat_status_idx on public.open_to_chat_requests (status);
create index if not exists interests_status_idx on public.interests (status);
create index if not exists character_signals_status_idx on public.character_signals (status);
create index if not exists connections_status_idx on public.connections (status);
