export const MUSIC_GENRES = ['Alternative / Indie', 'Blues', 'Christian / Gospel', 'Classical', 'Classic Rock', 'Country', 'Electronic / Dance', 'Folk / Americana', 'Hip-Hop / Rap', 'Jazz', 'K-pop', 'Latin', 'Metal', 'Pop', 'Punk', 'R&B / Soul', 'Reggae', 'Rock', 'Soundtracks / Musicals', 'World Music', 'Other'] as const;
export function parseMusicPreferences(form: FormData) {
  const raw = form.getAll('favorite_music_genres').map(String);
  const genres = [...new Set(raw)];
  const other = String(form.get('favorite_music_other') ?? '').trim();
  const song = String(form.get('favorite_music_meaningful_song') ?? '').trim();
  if (genres.length > 6 || genres.some(value => !MUSIC_GENRES.some(genre => genre === value))) return { ok: false as const, message: 'Choose up to six music genres.' };
  if (genres.includes('Other') && !other) return { ok: false as const, message: 'Describe the other music you enjoy.' };
  if (other.length > 100 || song.length > 300) return { ok: false as const, message: 'Keep the genre under 100 characters and the song under 300.' };
  return { ok: true as const, fields: { favorite_music_genres: genres, favorite_music_other: genres.includes('Other') ? other : null, favorite_music_meaningful_song: song || null } };
}
