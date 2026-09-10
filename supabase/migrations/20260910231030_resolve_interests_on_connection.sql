-- An active connection is the terminal state for any pending interest between
-- the same two members. Resolve those rows in the same transaction so the
-- recipient cannot see an obsolete "Interested Too" action beside Mutual.
create or replace function public.forge_ensure_connection(
  p_user_1 uuid,
  p_user_2 uuid,
  p_source public.connection_source
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_a uuid;
  v_b uuid;
  v_id uuid;
begin
  if p_user_1 is null or p_user_2 is null or p_user_1 = p_user_2 then
    raise exception 'forge_ensure_connection: invalid pair';
  end if;

  select o.user_a_id, o.user_b_id into v_a, v_b
  from public.forge_order_pair(p_user_1, p_user_2) o;

  perform set_config('forge.allow_system_writes', 'on', true);

  insert into public.connections (user_a_id, user_b_id, source, status)
  values (v_a, v_b, p_source, 'active')
  on conflict (user_a_id, user_b_id) do update
    set status = 'active',
        source = excluded.source,
        updated_at = now()
  returning id into v_id;

  update public.conversations
  set status = 'active',
      ended_at = null,
      ended_by_user_id = null,
      updated_at = now()
  where connection_id = v_id
    and status = 'ended';

  update public.interests
  set status = 'mutual',
      updated_at = now()
  where status = 'pending'
    and (
      (sender_id = v_a and recipient_id = v_b)
      or (sender_id = v_b and recipient_id = v_a)
    );

  return v_id;
end;
$$;

revoke all on function public.forge_ensure_connection(
  uuid, uuid, public.connection_source
) from public, anon, authenticated;
