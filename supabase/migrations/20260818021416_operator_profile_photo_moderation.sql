begin;

-- Record the current review decision on each photo for efficient operator reads.
alter table public.profile_photos
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid,
  add column if not exists rejection_reason text;

-- Older rows predate real operator review. Normalize any legacy non-pending
-- state before enforcing evidence requirements.
update public.profile_photos
set moderation_status = 'pending',
    reviewed_at = null,
    reviewed_by = null,
    rejection_reason = null
where moderation_status <> 'pending'
  and reviewed_at is null
  and reviewed_by is null;

alter table public.profile_photos
  drop constraint if exists profile_photos_moderation_review_consistency;

alter table public.profile_photos
  add constraint profile_photos_moderation_review_consistency check (
    (
      moderation_status = 'pending'
      and reviewed_at is null
      and reviewed_by is null
      and rejection_reason is null
    )
    or (
      moderation_status = 'approved'
      and reviewed_at is not null
      and reviewed_by is not null
      and rejection_reason is null
    )
    or (
      moderation_status = 'rejected'
      and reviewed_at is not null
      and reviewed_by is not null
      and char_length(trim(rejection_reason)) between 3 and 500
    )
  );

comment on column public.profile_photos.reviewed_at is
  'Timestamp of the latest operator moderation decision; cleared when photo content changes.';
comment on column public.profile_photos.reviewed_by is
  'Authenticated operator account responsible for the latest moderation decision.';
comment on column public.profile_photos.rejection_reason is
  'Operator-entered reason required for the latest rejected decision.';

-- Preserve an append-only decision history even if the photo is later replaced
-- or deleted. Ordinary member roles have no access to this audit table.
create table if not exists public.profile_photo_moderation_events (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null,
  photo_owner_id uuid not null,
  storage_path text not null,
  operator_id uuid not null,
  decision public.photo_moderation_status not null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  constraint profile_photo_moderation_events_decision_check check (
    decision in ('approved', 'rejected')
  ),
  constraint profile_photo_moderation_events_reason_check check (
    (decision = 'approved' and rejection_reason is null)
    or (
      decision = 'rejected'
      and char_length(trim(rejection_reason)) between 3 and 500
    )
  )
);

create index if not exists profile_photo_moderation_events_photo_id_idx
  on public.profile_photo_moderation_events (photo_id, created_at desc);
create index if not exists profile_photo_moderation_events_operator_id_idx
  on public.profile_photo_moderation_events (operator_id, created_at desc);

alter table public.profile_photo_moderation_events enable row level security;
revoke all on table public.profile_photo_moderation_events from public, anon, authenticated;
grant select, insert on table public.profile_photo_moderation_events to service_role;

comment on table public.profile_photo_moderation_events is
  'Append-only operator audit history for profile-photo approval and rejection decisions.';

-- Member writes cannot alter review fields. Replacing photo content returns the
-- record to a clean pending state for a new decision.
create or replace function public.protect_profile_photos_system_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
      new.moderation_status := 'pending';
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'profile photo owner cannot be changed';
  end if;

  new.created_at := old.created_at;

  if auth.uid() is not null and (
    new.moderation_status is distinct from old.moderation_status
    or new.reviewed_at is distinct from old.reviewed_at
    or new.reviewed_by is distinct from old.reviewed_by
    or new.rejection_reason is distinct from old.rejection_reason
  ) then
    raise exception 'photo moderation fields are system-managed';
  end if;

  if auth.uid() is not null
     and new.storage_path is distinct from old.storage_path then
    new.moderation_status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;

-- The service-role-only operation keeps the photo update and audit insert in a
-- single transaction. The application verifies the operator session and passes
-- that actor's UUID; ordinary members cannot invoke this function.
create or replace function public.review_profile_photo(
  p_photo_id uuid,
  p_operator_id uuid,
  p_decision public.photo_moderation_status,
  p_rejection_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_photo public.profile_photos%rowtype;
  v_reason text := nullif(trim(p_rejection_reason), '');
begin
  if p_operator_id is null then
    raise exception 'operator id is required';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  if p_decision = 'rejected'
     and (v_reason is null or char_length(v_reason) not between 3 and 500) then
    raise exception 'rejection reason must be between 3 and 500 characters';
  end if;

  if p_decision = 'approved' then
    v_reason := null;
  end if;

  select * into v_photo
  from public.profile_photos
  where id = p_photo_id
    and moderation_status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  update public.profile_photos
  set moderation_status = p_decision,
      reviewed_at = now(),
      reviewed_by = p_operator_id,
      rejection_reason = v_reason
  where id = p_photo_id;

  insert into public.profile_photo_moderation_events (
    photo_id,
    photo_owner_id,
    storage_path,
    operator_id,
    decision,
    rejection_reason
  ) values (
    v_photo.id,
    v_photo.user_id,
    v_photo.storage_path,
    p_operator_id,
    p_decision,
    v_reason
  );

  return true;
end;
$$;

comment on function public.review_profile_photo(uuid, uuid, public.photo_moderation_status, text) is
  'Atomically records a service-role-authorized profile-photo moderation decision and audit event.';

revoke all on function public.review_profile_photo(uuid, uuid, public.photo_moderation_status, text)
  from public, anon, authenticated;
grant execute on function public.review_profile_photo(uuid, uuid, public.photo_moderation_status, text)
  to service_role;

commit;
