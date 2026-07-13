'use client';

import { useCallback, useRef, useState } from 'react';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import CharacterSignalDetailDrawer from '@/components/character-signals/CharacterSignalDetailDrawer';
import {
  DISCOVERY_PROFILE_PUBLIC_SIGNALS,
  getSignalDefinition,
  type CharacterSignalId,
} from '@/lib/character-signals-mock';

/**
 * Public Character Signals display for /discovery/profile.
 * Prototype only — no live confirmations or persistence.
 */
export default function PublicCharacterSignalsSection({
  cardClassName,
}: {
  cardClassName: string;
}) {
  const [detailSignalId, setDetailSignalId] = useState<CharacterSignalId | null>(null);
  const [detailCount, setDetailCount] = useState(0);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeKeyRef = useRef<string | null>(null);

  const openDetail = (signalId: CharacterSignalId, count: number) => {
    activeKeyRef.current = signalId;
    setDetailSignalId(signalId);
    setDetailCount(count);
  };

  const closeDetail = useCallback(() => {
    const key = activeKeyRef.current;
    setDetailSignalId(null);
    window.requestAnimationFrame(() => {
      if (key) triggers.current[key]?.focus();
    });
  }, []);

  return (
    <>
      <section className={`${cardClassName} mt-4`} aria-labelledby="signals-title">
        <h2
          id="signals-title"
          className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-2xl"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Character Signals
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#7A8494]">
          Positive qualities recognized through meaningful interactions on Forge.
        </p>

        <ul className="mt-6 space-y-3">
          {DISCOVERY_PROFILE_PUBLIC_SIGNALS.map((entry) => {
            const signal = getSignalDefinition(entry.signalId);
            return (
              <li key={entry.signalId}>
                <button
                  ref={(node) => {
                    triggers.current[entry.signalId] = node;
                  }}
                  type="button"
                  onClick={() => openDetail(entry.signalId, entry.confirmationCount)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-[#FBF9F6]/80 px-4 py-3.5 text-left transition hover:border-[#0B2D5C]/18 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  aria-haspopup="dialog"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B2D5C] text-white">
                    <CharacterSignalIcon signalId={entry.signalId} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#0B2D5C]">
                      {signal.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[#5A6575]">
                      {signal.shortDescription}
                    </span>
                    <span className="mt-2 block text-sm font-medium text-[#0B2D5C]">
                      Confirmed by {entry.confirmationCount} people
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <CharacterSignalDetailDrawer
        open={detailSignalId !== null}
        signalId={detailSignalId}
        confirmationCount={detailCount}
        onClose={closeDetail}
        returnLabel="Return to Profile"
      />
    </>
  );
}
