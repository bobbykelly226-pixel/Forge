-- Founder-requested survey-only clean slate, with a private recoverable archive.
create schema if not exists forge_research_archive;
revoke all on schema forge_research_archive from public, anon, authenticated, service_role;

create table if not exists forge_research_archive.dating_survey_responses (
  id uuid primary key,
  survey_version text not null,
  submitted_at timestamptz not null,
  answers jsonb not null,
  archived_at timestamptz not null default now(),
  archive_reason text not null
);
alter table forge_research_archive.dating_survey_responses enable row level security;
revoke all on table forge_research_archive.dating_survey_responses from public, anon, authenticated, service_role;
comment on table forge_research_archive.dating_survey_responses is 'Private recovery archive for founder-authorized survey resets. Excluded from live survey results.';

-- Hold concurrent submissions until copying and resetting finish in this migration transaction.
lock table public.dating_survey_responses in share row exclusive mode;
insert into forge_research_archive.dating_survey_responses
  (id, survey_version, submitted_at, answers, archive_reason)
select id, survey_version, submitted_at, answers, 'Founder requested a blank slate after pre-launch testing'
from public.dating_survey_responses
where survey_version = 'dating-experience-v1'
on conflict (id) do nothing;

delete from public.dating_survey_responses r
using forge_research_archive.dating_survey_responses a
where r.id = a.id and r.survey_version = 'dating-experience-v1';
