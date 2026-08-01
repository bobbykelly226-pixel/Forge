'use client';

import Link from 'next/link';

import {
  NewRecognitionSection,
  PrivateSignalsSection,
  VisibleOnProfileSection,
} from '@/components/character-signals/CharacterSignalsSections';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';

export default function CharacterSignalsProfileSection() {
  const { signals } = useCharacterSignals();
  const pendingCount = signals.filter((signal) => signal.status === 'pending').length;

  return (
    <section
      aria-labelledby="profile-character-signals-heading"
      className="rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5 shadow-[0_8px_28px_rgba(11,45,92,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="profile-character-signals-heading"
            className="text-xl tracking-[-0.01em] text-[#0B2D5C] lg:text-2xl"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Character Signals
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6575]">
            Review recognition you receive and control what may appear on your profile.
          </p>
        </div>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-[#D62828] px-3 py-1 text-xs font-semibold text-white">
            {pendingCount} new
          </span>
        ) : null}
      </div>

      <div className="mt-6 space-y-7">
        <NewRecognitionSection signals={signals} />
        <PrivateSignalsSection signals={signals} />
        <VisibleOnProfileSection signals={signals} />
      </div>

      <div className="mt-6 border-t border-[#0B2D5C]/08 pt-5">
        <Link
          href="/character-signals"
          className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6]"
        >
          View Recognition History
        </Link>
      </div>
    </section>
  );
}
