import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC_GENRES, parseMusicPreferences } from '../profile/music';
const form = (genres: string[], other = '', song = '') => { const f = new FormData(); genres.forEach(g => f.append('favorite_music_genres', g)); f.set('favorite_music_other', other); f.set('favorite_music_meaningful_song', song); return f; };
test('music accepts optional empty, up to six genres, and preserves Other and meaningful song', () => {
  assert.equal(MUSIC_GENRES.length, 21);
  assert.equal(parseMusicPreferences(form([])).ok, true);
  assert.equal(parseMusicPreferences(form(MUSIC_GENRES.slice(0,6))).ok, true);
  assert.equal(parseMusicPreferences(form(MUSIC_GENRES.slice(0,7))).ok, false);
  assert.equal(parseMusicPreferences(form(['invented'])).ok, false);
  assert.equal(parseMusicPreferences(form(['Other'])).ok, false);
  const result = parseMusicPreferences(form(['Other','Country'], 'Bluegrass', 'My song — Artist'));
  assert.equal(result.ok, true);
  if(result.ok) assert.deepEqual(result.fields, {favorite_music_genres:['Other','Country'],favorite_music_other:'Bluegrass',favorite_music_meaningful_song:'My song — Artist'});
});
