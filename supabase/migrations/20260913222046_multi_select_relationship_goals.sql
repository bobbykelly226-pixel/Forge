-- Five equal choices. Existing records and the older Preview RPC remain intact.
alter table public.profiles drop constraint if exists profiles_relationship_goals_valid;
alter table public.profiles add constraint profiles_relationship_goals_valid
  check (cardinality(relationship_goals) <= 5 and relationship_goals <@
    array['marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone']::text[]);

create or replace function public.save_my_relationship_goals(p_goals text[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  goals text[];
begin
  if member_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_goals is null or cardinality(p_goals) = 0 or array_position(p_goals, null) is not null
    or not (p_goals <@ array['marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone']::text[]) then
    raise exception 'Select at least one valid relationship goal' using errcode = '22023';
  end if;
  -- Catalog order is stable, not a member-selected ranking.
  select array_agg(goal order by position) into goals
    from unnest(array['marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone']::text[])
      with ordinality catalog(goal, position) where goal = any(p_goals);
  update public.profiles set relationship_goals = goals,
    relationship_goal = goals[1] -- Scalar retained for backward-compatible readers only.
    where id = member_id;
  if not found then raise exception 'Profile unavailable' using errcode = '42501'; end if;
  insert into public.profile_answers(user_id, question_key, answer, visibility, is_non_negotiable)
    values(member_id, 'relationship_intention', to_jsonb(goals), 'private', false)
    on conflict(user_id, question_key) do update set answer = excluded.answer;
  -- The choices are now in one answer; don't resurrect stale alternatives on resume.
  delete from public.profile_answers where user_id = member_id and question_key = 'relationship_also_open_to';
  -- Previously saved pace is retained but no longer requested or displayed.
end;
$$;
revoke all on function public.save_my_relationship_goals(text[]) from public, anon;
grant execute on function public.save_my_relationship_goals(text[]) to authenticated;
