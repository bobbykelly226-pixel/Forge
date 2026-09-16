-- Preserve reported conversation videos independently from member messages.
begin;

create table public.reported_video_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.user_reports (id) on delete restrict,
  source_attachment_id uuid not null,
  source_message_id uuid not null,
  source_conversation_id uuid not null,
  source_sender_id uuid not null,
  source_storage_path text not null,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('video/mp4', 'video/webm')),
  file_size bigint not null check (file_size between 1 and 10485760),
  created_at timestamptz not null default now(),
  unique (report_id, source_attachment_id)
);

comment on table public.reported_video_evidence is
  'Private preserved copies of reported video messages. Source identifiers remain after member content is removed.';

create index reported_video_evidence_report_id_idx
  on public.reported_video_evidence (report_id, created_at, id);

alter table public.reported_video_evidence enable row level security;
revoke all on table public.reported_video_evidence from public, anon, authenticated;
grant select, insert, update, delete on table public.reported_video_evidence to service_role;

drop trigger if exists reported_video_evidence_immutable on public.reported_video_evidence;
create trigger reported_video_evidence_immutable
before update or delete on public.reported_video_evidence
for each row execute function public.forge_reject_safety_record_mutation();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reported-video-evidence',
  'reported-video-evidence',
  false,
  10485760,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No anon or authenticated storage policy is created. Only trusted service-role
-- operations may copy, read, sign, or remove preserved video evidence.

commit;
