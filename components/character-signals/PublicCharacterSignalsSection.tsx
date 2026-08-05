'use client';

import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { giveCharacterSignalAction } from '@/app/actions/character-signals';
import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import CharacterSignalDetailDrawer from '@/components/character-signals/CharacterSignalDetailDrawer';
import RecognitionFlowDrawer from '@/components/character-signals/RecognitionFlowDrawer';
import WhatAreCharacterSignalsDrawer from '@/components/character-signals/WhatAreCharacterSignalsDrawer';
import {
  DISCOVERY_PROFILE_PUBLIC_SIGNALS,
} from '@/lib/character-signals-mock';
import {
  getSignalDefinition,
  type CharacterSignalId,
  type InteractionType,
} from '@/lib/character-signals/catalog';
import type {
  CharacterSignalActionResult,
  PublicCharacterSignal,
  RecognitionRecipient,
} from '@/lib/character-signals/types';

/**
 * Public Character Signals display for /discovery/profile.
 * Compact secondary treatment — valuable, not visually dominant.
 * Production callers provide privacy-filtered aggregate confirmations.
 */
export type PublicCharacterSignalEntry = PublicCharacterSignal;

export default function PublicCharacterSignalsSection({
  cardClassName,
  signals,
  emptyCopy,
  recognitionRecipient,
}: {
  /** Kept for call-site compatibility; compact section uses its own denser card shell. */
  cardClassName: string;
  /** Seed-only callers may omit this and use the demo fixture list. */
  signals?: PublicCharacterSignalEntry[];
  emptyCopy?: string;
  /** Present only when the signed-in viewer may recognize this profile. */
  recognitionRecipient?: RecognitionRecipient | null;
}) {
  void cardClassName;
  const router = useRouter();
  const [detailSignalId, setDetailSignalId] = useState<CharacterSignalId | null>(null);
  const [detailCount, setDetailCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [activeRecognitionRecipient, setActiveRecognitionRecipient] =
    useState<RecognitionRecipient | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const infoTriggerRef = useRef<HTMLButtonElement>(null);
  const recognitionTriggerRef = useRef<HTMLButtonElement>(null);
  const sectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const recognitionSubmittedRef = useRef(false);
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

  const openRecognition = () => {
    if (!recognitionRecipient) return;
    recognitionSubmittedRef.current = false;
    setDetailSignalId(null);
    setInfoOpen(false);
    setActiveRecognitionRecipient(recognitionRecipient);
    setRecognitionOpen(true);
  };

  const closeRecognition = useCallback(() => {
    const submitted = recognitionSubmittedRef.current;
    recognitionSubmittedRef.current = false;
    setRecognitionOpen(false);
    setActiveRecognitionRecipient(null);
    if (submitted) router.refresh();
    window.requestAnimationFrame(() => {
      if (submitted) sectionHeadingRef.current?.focus();
      else recognitionTriggerRef.current?.focus();
    });
  }, [router]);

  const submitRecognition = useCallback(async (payload: {
    recipientId: string;
    recipientName: string;
    signalId: CharacterSignalId;
    interactionType: InteractionType;
  }): Promise<CharacterSignalActionResult> => {
    const result = await giveCharacterSignalAction({
      receiverId: payload.recipientId,
      signalId: payload.signalId,
      interactionType: payload.interactionType,
    });
    if (result.success) recognitionSubmittedRef.current = true;
    return result;
  }, []);

  return (
    <>
      <section
        className="mt-4 rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-4 sm:p-5"
        aria-labelledby="signals-title"
      >
        <div className="flex items-center gap-1.5">
          <h2
            ref={sectionHeadingRef}
            id="signals-title"
            tabIndex={-1}
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

        {recognitionRecipient ? (
          <div className="mt-4 border-t border-[#0B2D5C]/08 pt-4">
            <p className="text-sm leading-relaxed text-[#5A6575]">
              Had a meaningful interaction with {recognitionRecipient.firstName}?
            </p>
            <button
              ref={recognitionTriggerRef}
              type="button"
              onClick={openRecognition}
              aria-haspopup="dialog"
              aria-expanded={recognitionOpen}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#123E72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] sm:w-auto"
            >
              Recognize a Positive Quality
            </button>
          </div>
        ) : null}
      </section>

      <CharacterSignalDetailDrawer
        open={detailSignalId !== null}
        signalId={detailSignalId}
        confirmationCount={detailCount}
        onClose={closeDetail}
        returnLabel="Return to Profile"
      />
      <WhatAreCharacterSignalsDrawer open={infoOpen} onClose={closeInfo} />
      <RecognitionFlowDrawer
        open={recognitionOpen}
        recipient={activeRecognitionRecipient}
        onClose={closeRecognition}
        onSubmitted={submitRecognition}
        successReturnLabel={
          activeRecognitionRecipient
            ? `Return to ${activeRecognitionRecipient.firstName}'s Profile`
            : 'Return to Profile'
        }
      />
    </>
  );
}
