alter table public.profiles add column favorite_music_genres text[] not null default '{}', add column favorite_music_other text, add column favorite_music_meaningful_song text;
alter table public.profiles add constraint music_genres_valid check (cardinality(favorite_music_genres) <= 6 and array_position(favorite_music_genres, null) is null and favorite_music_genres <@ array['Alternative / Indie','Blues','Christian / Gospel','Classical','Classic Rock','Country','Electronic / Dance','Folk / Americana','Hip-Hop / Rap','Jazz','K-pop','Latin','Metal','Pop','Punk','R&B / Soul','Reggae','Rock','Soundtracks / Musicals','World Music','Other']::text[]), add constraint music_other_length check (char_length(favorite_music_other) <= 100), add constraint music_song_length check (char_length(favorite_music_meaningful_song) <= 300);
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
  p.relationship_pace,
  p.favorite_music_genres,
  p.favorite_music_other,
  p.favorite_music_meaningful_song
from public.profiles p
where p.status = 'active'::public.profile_status
  and p.is_discoverable = true
  and public.forge_discoverable_age(p.id) is not null;
do $patch$
declare source text;
begin
  select pg_get_functiondef('public.prepare_account_deletion(uuid,uuid)'::regprocedure) into source;
  if position('favorite_music_songs = ' in source) = 0 then raise exception 'Deletion anchor changed'; end if;
  execute replace(source, 'favorite_music_songs = ', 'favorite_music_genres = ''{}''::text[], favorite_music_other = null, favorite_music_meaningful_song = null, favorite_music_songs = ');
end;
$patch$;
