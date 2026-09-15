'use client';
import { useState } from 'react';
import { MUSIC_GENRES } from '@/lib/profile/music';
import type { Profile } from '@/lib/types/profile';
export default function MusicFields({ profile, disabled }: { profile: Profile; disabled?: boolean }) {
  const [genres, setGenres] = useState<string[]>(profile.favorite_music_genres ?? []);
  const [notice, setNotice] = useState('');
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="text-base font-semibold text-[#0B2D5C]">What kinds of music do you enjoy most?</legend>
    <p className="text-sm text-black">Choose up to six.</p>
    <p role="status" className="text-sm text-black">{genres.length} of 6 selected. {notice}</p>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {MUSIC_GENRES.map(genre => <label key={genre} className="flex min-h-11 items-center gap-3 rounded-[6px] border border-[#0B2D5C]/30 bg-[#F7F7F7] px-3 py-2 text-[#0B2D5C]">
        <input type="checkbox" name="favorite_music_genres" value={genre} checked={genres.includes(genre)} className="h-5 w-5 shrink-0 accent-[#C92027]"
          onChange={() => { if (genres.includes(genre)) { setGenres(genres.filter(item => item !== genre)); setNotice(''); } else if (genres.length < 6) { setGenres([...genres, genre]); setNotice(''); } else setNotice('Deselect a genre before choosing another.'); }} />
        {genre === 'Other' ? 'Other — write in' : genre}
      </label>)}
    </div>
    {genres.includes('Other') && <label className="block text-sm text-black">Other music you enjoy
      <input name="favorite_music_other" defaultValue={profile.favorite_music_other ?? ''} required maxLength={100} className="mt-2 w-full rounded-[6px] border p-3" />
    </label>}
  </fieldset>;
}
