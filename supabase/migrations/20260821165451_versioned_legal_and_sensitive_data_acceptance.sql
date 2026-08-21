-- Versioned legal documents and append-only member acceptance history.

create table public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_key text not null check (
    document_key in ('terms', 'privacy', 'community_standards', 'sensitive_data_consent')
  ),
  version text not null check (version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  effective_at timestamptz not null,
  published_at timestamptz not null default now(),
  is_current boolean not null default false,
  is_material_change boolean not null default true,
  created_at timestamptz not null default now(),
  constraint legal_document_versions_key_version_unique unique (document_key, version)
);

create unique index legal_document_versions_one_current_per_key
  on public.legal_document_versions (document_key)
  where is_current;

create table public.member_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  document_version_id uuid not null references public.legal_document_versions(id) on delete restrict,
  accepted_at timestamptz not null default now(),
  source text not null check (source ~ '^[a-z0-9_]{3,64}$'),
  created_at timestamptz not null default now(),
  constraint member_legal_acceptances_user_version_unique unique (user_id, document_version_id)
);

create index member_legal_acceptances_user_id_idx
  on public.member_legal_acceptances (user_id, accepted_at desc);

create index member_legal_acceptances_document_version_id_idx
  on public.member_legal_acceptances (document_version_id);

alter table public.legal_document_versions enable row level security;
alter table public.member_legal_acceptances enable row level security;

revoke all on table public.legal_document_versions from public, anon, authenticated;
revoke all on table public.member_legal_acceptances from public, anon, authenticated;

grant select on table public.legal_document_versions to authenticated;
grant select on table public.member_legal_acceptances to authenticated;

create policy legal_document_versions_current_read
  on public.legal_document_versions
  for select
  to authenticated
  using (is_current);

create policy member_legal_acceptances_owner_read
  on public.member_legal_acceptances
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

insert into public.legal_document_versions (
  document_key,
  version,
  effective_at,
  is_current,
  is_material_change
) values
  ('terms', '2026-08-21', '2026-08-21 00:00:00+00', true, true),
  ('privacy', '2026-08-21', '2026-08-21 00:00:00+00', true, true),
  ('community_standards', '2026-08-21', '2026-08-21 00:00:00+00', true, true),
  ('sensitive_data_consent', '2026-08-21', '2026-08-21 00:00:00+00', true, true);

create or replace function public.has_current_legal_acceptance()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select
    (select count(*) from public.legal_document_versions where is_current) = 4
    and not exists (
      select 1
      from public.legal_document_versions version
      where version.is_current
        and not exists (
          select 1
          from public.member_legal_acceptances acceptance
          where acceptance.document_version_id = version.id
            and acceptance.user_id = (select auth.uid())
        )
    );
$$;

create or replace function public.accept_current_legal_documents()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_source constant text := 'legal_acceptance_gate';
  v_current_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select count(*) into v_current_count
  from public.legal_document_versions
  where is_current;

  if v_current_count <> 4 then
    raise exception 'Current legal document set is incomplete.' using errcode = '55000';
  end if;

  insert into public.member_legal_acceptances (
    user_id,
    document_version_id,
    source
  )
  select v_user_id, version.id, v_source
  from public.legal_document_versions version
  where version.is_current
  on conflict (user_id, document_version_id) do nothing;

  return public.has_current_legal_acceptance();
end;
$$;

revoke all on function public.has_current_legal_acceptance() from public, anon;
revoke all on function public.accept_current_legal_documents() from public, anon;
grant execute on function public.has_current_legal_acceptance() to authenticated;
grant execute on function public.accept_current_legal_documents() to authenticated;

comment on table public.legal_document_versions is
  'Immutable version catalog for Forge Terms, Privacy, Community Standards, and sensitive-data consent.';

comment on table public.member_legal_acceptances is
  'Append-only evidence of the exact legal document versions accepted by each authenticated member.';

comment on function public.has_current_legal_acceptance() is
  'Returns true only when the signed-in member accepted all four current required legal document versions.';

comment on function public.accept_current_legal_documents() is
  'Records the signed-in member acceptance of all current required legal documents with a server timestamp.';
