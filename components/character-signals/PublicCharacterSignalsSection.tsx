'use client';

import { Info } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import CharacterSignalDetailDrawer from '@/components/character-signals/CharacterSignalDetailDrawer';
import WhatAreCharacterSignalsDrawer from '@/components/character-signals/WhatAreCharacterSignalsDrawer';
import {
  DISCOVERY_PROFILE_PUBLIC_SIGNALS,
  getSignalDefinition,
  type CharacterSignalId,
} from '@/lib/character-signals-mock';

/**
 * Public Character Signals display for /discovery/profile.
 * Compact secondary treatment — valuable, not visually dominant.
 * Prototype only — no live confirmations or persistence.
 */
export type PublicCharacterSignalEntry = {
  signalId: CharacterSignalId;
  confirmationCount: number;
};

export default function PublicCharacterSignalsSection({
  cardClassName,
  signals,
  emptyCopy,
}: {
  /** Kept for call-site compatibility; compact section uses its own denser card shell. */
  cardClassName: string;
  /** When omitted, uses the prototype Discovery public signals list. */
  signals?: PublicCharacterSignalEntry[];
  emptyCopy?: string;
}) {
  void cardClassName;
  const [detailSignalId, setDetailSignalId] = useState<CharacterSignalId | null>(null);
  const [detailCount, setDetailCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const infoTriggerRef = useRef<HTMLButtonElement>(null);
  const activeKeyRef = useRef<string | null>(null);
  const list = signals ?? DISCOVERY_PROFILE_PUBLIC_SIGNALS;

  const openDetail = (signalId: CharacterSignalId, count: number) => {
    activeKeyRef.current = signalId;
    setInfoOpen(false);
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

  const openInfo = () => {
    setDetailSignalId(null);
    setInfoOpen(true);
  };

  const closeInfo = useCallback(() => {
    setInfoOpen(false);
    window.requestAnimationFrame(() => {
      infoTriggerRef.current?.focus();
    });
  }, []);

  return (
    <>
      <section
        className="mt-4 rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-4 sm:p-5"
        aria-labelledby="signals-title"
      >
        <div className="flex items-center gap-1.5">
          <h2
            id="signals-title"
            className="text-lg tracking-[-0.01em] text-[#0B2D5C] sm:text-xl"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Character Signals
          </h2>
          <button
            ref={infoTriggerRef}
            type="button"
            onClick={openInfo}
            aria-label="Learn about Character Signals"
            aria-haspopup="dialog"
            aria-expanded={infoOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6B7585] transition hover:bg-[#0B2D5C]/06 hover:text-[#0B2D5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0B2D5C]/15 bg-white/80">
              <Info className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </button>
        </div>
        <p className="mt-1.5 text-sm leading-snug text-[#7A8494]">
          Positive qualities recognized through meaningful interactions on Forge.
        </p>

        {list.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
            {emptyCopy ?? 'No public Character Signals yet'}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {list.map((entry) => {
              const signal = getSignalDefinition(entry.signalId);
              return (
                <li key={entry.signalId}>
                  <button
                    ref={(node) => {
                      triggers.current[entry.signalId] = node;
                    }}
                    type="button"
                    onClick={() => openDetail(entry.signalId, entry.confirmationCount)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[#0B2D5C]/08 border-l-[3px] border-l-[#557A67] bg-[#EDF4EF]/35 px-3 py-2.5 text-left transition hover:border-[#0B2D5C]/18 hover:bg-[#EDF4EF]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                    aria-haspopup="dialog"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#557A67] text-white">
                      <CharacterSignalIcon signalId={entry.signalId} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-[#0B2D5C]">
                        {signal.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-[#5A6575]">
                        {signal.shortDescription}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-[#0B2D5C]">
                        Confirmed by {entry.confirmationCount} people
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CharacterSignalDetailDrawer
        open={detailSignalId !== null}
        signalId={detailSignalId}
        confirmationCount={detailCount}
        onClose={closeDetail}
        returnLabel="Return to Profile"
      />
      <WhatAreCharacterSignalsDrawer open={infoOpen} onClose={closeInfo} />
    </>
  );
}
