-- Record one current legal document acceptance at the moment the member affirms it.

create or replace function public.accept_current_legal_document(p_document_key text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_document_version_id uuid;
  v_source constant text := 'legal_document_review';
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  if p_document_key not in (
    'terms',
    'privacy',
    'community_standards',
    'sensitive_data_consent'
  ) then
    raise exception 'Unknown legal document.' using errcode = '22023';
  end if;

  select version.id
    into v_document_version_id
  from public.legal_document_versions as version
  where version.document_key = p_document_key
    and version.is_current;

  if v_document_version_id is null then
    raise exception 'Current legal document version is unavailable.' using errcode = '55000';
  end if;

  insert into public.member_legal_acceptances (
    user_id,
    document_version_id,
    source
  ) values (
    v_user_id,
    v_document_version_id,
    v_source
  )
  on conflict (user_id, document_version_id) do nothing;

  return true;
end;
$$;

revoke all on function public.accept_current_legal_document(text) from public, anon;
grant execute on function public.accept_current_legal_document(text) to authenticated;

comment on function public.accept_current_legal_document(text) is
  'Idempotently records the signed-in member acceptance of one current legal document version.';
