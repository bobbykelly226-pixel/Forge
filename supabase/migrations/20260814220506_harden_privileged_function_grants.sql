-- Internal SECURITY DEFINER functions must not inherit PostgreSQL's default
-- PUBLIC execute grant. Keep the signed-in self-repair RPC available to the
-- member it protects, while leaving the Auth trigger callable only by trusted
-- server roles.

revoke all on function public.ensure_foundational_user_records(uuid)
  from public, anon, authenticated;

grant execute on function public.ensure_foundational_user_records(uuid)
  to authenticated, service_role;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;

grant execute on function public.handle_new_user()
  to service_role;
