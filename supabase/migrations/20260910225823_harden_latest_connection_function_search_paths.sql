-- Connection lifecycle migrations replaced these functions after the global
-- search-path hardening pass. Restore the repository's required ordering with
-- the PostgreSQL system catalog first and the application schema second.
alter function public.send_interest(uuid)
  set search_path to pg_catalog, public;

alter function public.send_open_to_chat(uuid, text)
  set search_path to pg_catalog, public;

alter function public.forge_ensure_connection(
  uuid, uuid, public.connection_source
)
  set search_path to pg_catalog, public;

alter function public.respond_open_to_chat(uuid, text)
  set search_path to pg_catalog, public;
