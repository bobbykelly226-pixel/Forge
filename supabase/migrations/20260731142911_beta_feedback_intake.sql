-- Forge Beta Feedback Intake
-- A private product-feedback channel for authenticated beta members.
-- This remains separate from member safety reports and moderation records.

create type public.beta_feedback_category as enum (
  'broken',
  'confusing',
  'support',
  'idea'
);

create type public.beta_feedback_area as enum (
  'discovery',
  'profile',
  'compatibility_profile',
  'connections_messaging',
  'account_access',
  'other'
);

create table public.beta_feedback_submissions (
  id uuid primary key,
  submitter_id uuid not null references auth.users (id) on delete cascade,
  category public.beta_feedback_category not null,
  area public.beta_feedback_area not null,
  message text not null check (char_length(trim(message)) between 10 and 2000),
  contact_requested boolean not null default true,
  triage_status text not null default 'new' check (
    triage_status in ('new', 'reviewing', 'planned', 'resolved', 'closed')
  ),
  notification_status text not null default 'pending' check (
    notification_status in ('pending', 'accepted', 'failed', 'not_configured')
  ),
  provider_message_id text null,
  notification_attempted_at timestamptz null,
  notification_error text null check (
    notification_error is null or char_length(notification_error) <= 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.beta_feedback_submissions is
  'Private authenticated beta feedback. Safety and member reports remain in user_reports.';

comment on column public.beta_feedback_submissions.contact_requested is
  'Whether the beta member would like a direct response at the email on their account.';

create index beta_feedback_submissions_submitter_idx
  on public.beta_feedback_submissions (submitter_id, created_at desc);

create index beta_feedback_submissions_triage_idx
  on public.beta_feedback_submissions (triage_status, created_at asc);

create index beta_feedback_submissions_notification_idx
  on public.beta_feedback_submissions (notification_status, created_at asc);

create unique index beta_feedback_submissions_provider_message_idx
  on public.beta_feedback_submissions (provider_message_id)
  where provider_message_id is not null;

alter table public.beta_feedback_submissions enable row level security;

revoke all on table public.beta_feedback_submissions
  from public, anon, authenticated;

grant insert (
  id,
  submitter_id,
  category,
  area,
  message,
  contact_requested
) on table public.beta_feedback_submissions to authenticated;

grant select, insert, update, delete
  on table public.beta_feedback_submissions to service_role;

create policy "Authenticated members submit private beta feedback"
on public.beta_feedback_submissions
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and submitter_id = (select auth.uid())
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
);

-- Deliberately no authenticated SELECT, UPDATE, or DELETE policy. The Server
-- Action returns a reference at submission time; review fields remain private
-- to trusted Forge operations.
