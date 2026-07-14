'use client';

import { Mic, Play, Video } from 'lucide-react';

import {
  DISCOVERY_FAVORITE_MUSIC,
  DISCOVERY_THINGS_I_ENJOY,
} from '@/lib/profile-v2-mock';

const cardClassName =
  'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.06)] backdrop-blur-sm sm:p-7';

export function ThingsIEnjoySection() {
  return (
    <section className={`${cardClassName} mt-4`} aria-labelledby="enjoy-title">
      <h2
        id="enjoy-title"
        className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        Things I Enjoy
      </h2>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {DISCOVERY_THINGS_I_ENJOY.map((item) => (
          <li key={item.id}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3.5 py-2 text-sm font-medium text-[#0B2D5C]">
              <span aria-hidden="true">{item.emoji}</span>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FavoriteMusicSection() {
  return (
    <section className={`${cardClassName} mt-4`} aria-labelledby="music-title">
      <h2
        id="music-title"
        className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        Favorite Music
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#7A8494]">
        A few favorites that help tell the story.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
            Favorite Artists
          </h3>
          <ul className="mt-3 space-y-2.5">
            {DISCOVERY_FAVORITE_MUSIC.artists.map((artist) => (
              <li key={artist} className="flex items-center gap-2.5 text-[15px] text-[#0B2D5C]">
                <span className="text-[#0B2D5C]/35" aria-hidden="true">
                  •
                </span>
                {artist}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
            Favorite Songs
          </h3>
          <ul className="mt-3 space-y-2.5">
            {DISCOVERY_FAVORITE_MUSIC.songs.map((song) => (
              <li key={song} className="flex items-center gap-2.5 text-[15px] text-[#0B2D5C]">
                <span className="text-[#0B2D5C]/35" aria-hidden="true">
                  •
                </span>
                {song}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-xs text-[#8A93A0]">Prototype only — Spotify is not connected.</p>
    </section>
  );
}

export function VoiceIntroductionSection() {
  return (
    <section className={`${cardClassName} mt-4`} aria-labelledby="voice-title">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#0B2D5C]">
          <Mic className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="voice-title"
            className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Voice Introduction
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
            Hear a short introduction in their own words.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C]/85 px-6 py-3.5 text-base font-semibold text-white opacity-90"
      >
        <Play className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Coming Soon
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-[#8A93A0]">
        Voice introductions will be available in a future Forge update.
      </p>
    </section>
  );
}

export function VideoIntroductionSection() {
  return (
    <section className={`${cardClassName} mt-4`} aria-labelledby="video-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#0B2D5C]">
            <Video className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="video-title"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Video Introduction
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              See a short introduction and get a better sense of personality.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[#D62828]/25 bg-[#FBF6EE] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D62828]">
          Forge Premium
        </span>
      </div>
      <button
        type="button"
        disabled
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C]/85 px-6 py-3.5 text-base font-semibold text-white opacity-90"
      >
        <Play className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Coming Soon
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-[#8A93A0]">
        Video introductions will be available in a future Forge update.
      </p>
    </section>
  );
}
