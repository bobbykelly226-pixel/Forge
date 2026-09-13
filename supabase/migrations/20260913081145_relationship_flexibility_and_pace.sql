alter table public.profiles add column relationship_pace text
  check (relationship_pace in ('naturally', 'slowly', 'ready'));
comment on column public.profiles.relationship_pace is
  'Optional public relationship-development preference, separate from relationship goals.';

create or replace view public.discoverable_profiles
with (security_invoker = true)
as
select
  p.id,
  p.full_name,
  public.forge_discoverable_age(p.id) as age,
  p.location,
  p.location_city,
  p.location_region,
  p.location_country,
  p.relationship_goal,
  p.faith_identity,
  p.faith_tradition,
  p.faith_other,
  p.faith_importance,
  p.service_background,
  p.service_backgrounds,
  p.short_bio,
  p.more_about,
  p.children,
  p.has_children,
  p.children_count,
  p.open_to_partner_with_children,
  p.education,
  p.pets,
  p.pets_types,
  p.smoking,
  p.drinking,
  p.career,
  p.relocation,
  p.things_i_enjoy,
  p.favorite_music_artists,
  p.favorite_music_songs,
  p.profile_photo_url,
  p.relationship_goals,
  p.relationship_pace
from public.profiles p
where p.status = 'active'::public.profile_status
  and p.is_discoverable = true
  and public.forge_discoverable_age(p.id) is not null;


create or replace function public.save_my_relationship_preferences(
  p_primary text, p_also text[] default '{}', p_pace text default null
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  alternatives text[];
begin
  if member_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if p_primary is null or p_primary not in ('marriage','lifelong_partnership','serious_relationship','intentional_dating','getting_to_know_someone')
    or p_also is null or array_position(p_also, null) is not null
    or not (p_also <@ array['marriage','lifelong_partnership','serious_relationship']::text[])
    or (p_pace is not null and p_pace not in ('naturally','slowly','ready')) then
    raise exception 'Invalid relationship preferences' using errcode = '22023';
  end if;
  select coalesce(array_agg(goal order by first_position), '{}'::text[]) into alternatives
    from (select goal, min(position) first_position from unnest(p_also) with ordinality a(goal, position)
          where goal <> p_primary group by goal) normalized;
  update public.profiles set relationship_goal = p_primary,
    relationship_goals = array[p_primary] || alternatives, relationship_pace = p_pace
    where id = member_id;
  if not found then raise exception 'Profile unavailable' using errcode = '42501'; end if;
  insert into public.profile_answers(user_id, question_key, answer, visibility, is_non_negotiable)
    values (member_id, 'relationship_intention', to_jsonb(p_primary), 'private', false),
           (member_id, 'relationship_also_open_to', to_jsonb(alternatives), 'private', false)
    on conflict(user_id, question_key) do update set answer = excluded.answer;
  if p_pace is null then
    delete from public.profile_answers where user_id = member_id and question_key = 'relationship_pace';
  else
    insert into public.profile_answers(user_id, question_key, answer, visibility, is_non_negotiable)
      values(member_id, 'relationship_pace', to_jsonb(p_pace), 'private', false)
      on conflict(user_id, question_key) do update set answer = excluded.answer;
  end if;
end;
$$;
revoke all on function public.save_my_relationship_preferences(text,text[],text) from public, anon;
grant execute on function public.save_my_relationship_preferences(text,text[],text) to authenticated;

-- Extend existing deletion minimization without replacing later security fixes.
do $patch$
declare source text;
begin
  select pg_get_functiondef('public.prepare_account_deletion(uuid,uuid)'::regprocedure) into source;
  if position('relationship_pace = null' in source) = 0 then
    if position('relationship_goal = null,' in source) = 0 then
      raise exception 'Deletion minimization anchor changed';
    end if;
    execute replace(source, 'relationship_goal = null,', 'relationship_goal = null, relationship_pace = null,');
  end if;
end;
$patch$;
