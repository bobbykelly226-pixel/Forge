do $patch$
declare source text;
begin
  select pg_get_functiondef('public.load_connection_hub_profiles(uuid[])'::regprocedure) into source;
  if position('p.relationship_goals' || chr(10) || '  from public.profiles p' in source) = 0 then raise exception 'Connection profile projection changed'; end if;
  execute replace(source, 'p.relationship_goals' || chr(10) || '  from public.profiles p', 'p.relationship_goals, p.relationship_pace, p.favorite_music_genres, p.favorite_music_other, p.favorite_music_meaningful_song, p.education_other, p.service_background_other' || chr(10) || '  from public.profiles p');
end;
$patch$;