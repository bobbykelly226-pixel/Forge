'use client';

import CharacterSignalCard from '@/components/character-signals/CharacterSignalCard';
import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';
import {
  getSignalDefinition,
  type RecognitionHistoryEntry,
  type UserSignalInstance,
} from '@/lib/character-signals-mock';

function QuietSection({
  headingId,
  title,
  children,
}: {
  headingId: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-lg tracking-[-0.01em] text-[#0B2D5C] sm:text-xl"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Section 2 — signals currently displayed on the public profile */
export function VisibleOnProfileSection({ signals }: { signals: UserSignalInstance[] }) {
  const { hideFromProfile } = useCharacterSignals();
  const visible = signals.filter((signal) => signal.status === 'public');

  return (
    <QuietSection headingId="visible-on-profile-heading" title="Visible on My Profile">
      {visible.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">
          No Character Signals are displayed on your profile yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((instance) => (
            <li key={instance.id}>
              <CharacterSignalCard
                signalId={instance.signalId}
                confirmationCount={instance.confirmationCount}
                actions={
                  <button
                    type="button"
                    onClick={() => hideFromProfile(instance.id)}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-[#FBF9F6] px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  >
                    Hide from Profile
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </QuietSection>
  );
}

/** Section 3 — recent recognitions ready for a simple decision */
export function NewRecognitionSection({ signals }: { signals: UserSignalInstance[] }) {
  const { approveForProfile, keepPrivate } = useCharacterSignals();
  const pending = signals.filter((signal) => signal.status === 'pending');

  return (
    <QuietSection headingId="new-recognition-heading" title="New Recognition">
      {pending.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">You&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((instance) => {
            const signal = getSignalDefinition(instance.signalId);
            const fromName = instance.recognizedBy ?? 'Someone';
            return (
              <li
                key={instance.id}
                className="rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#0B2D5C]">
                    <CharacterSignalIcon signalId={instance.signalId} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-[#5A6575]">{fromName} recognized:</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#0B2D5C]">{signal.title}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => approveForProfile(instance.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  >
                    Add to Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => keepPrivate(instance.id)}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  >
                    Keep Private
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </QuietSection>
  );
}

/** Section 4 — simple chronological activity */
export function RecognitionHistorySection({
  history,
}: {
  history: RecognitionHistoryEntry[];
}) {
  return (
    <QuietSection headingId="history-heading" title="Recognition History">
      {history.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">No recognition activity yet.</p>
      ) : (
        <ul className="divide-y divide-[#0B2D5C]/08 rounded-2xl border border-[#0B2D5C]/08 bg-white/80">
          {history.map((entry) => {
            const signal = getSignalDefinition(entry.signalId);
            const kindLabel = entry.kind === 'received' ? 'Received' : 'Given';
            const detail =
              entry.kind === 'received'
                ? signal.title
                : `${signal.title} · ${entry.recipientFirstName ?? 'someone'}`;
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B2D5C]">{kindLabel}</p>
                  <p className="mt-0.5 text-sm text-[#5A6575]">{detail}</p>
                </div>
                <p className="shrink-0 text-xs text-[#8A93A0]">{entry.relativeTime}</p>
              </li>
            );
          })}
        </ul>
      )}
    </QuietSection>
  );
}

/** Section 5 — brief learn-more entry point */
export function LearnMoreSection({
  onLearnMore,
  learnMoreButtonRef,
}: {
  onLearnMore: () => void;
  learnMoreButtonRef?:
    | React.RefCallback<HTMLButtonElement>
    | React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <QuietSection headingId="learn-more-heading" title="How Character Signals Work">
      <p className="max-w-xl text-sm leading-relaxed text-[#5A6575]">
        Character Signals appear after multiple independent people recognize the same positive
        quality. You choose what shows on your profile.
      </p>
      <button
        ref={learnMoreButtonRef}
        type="button"
        onClick={onLearnMore}
        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
      >
        Learn More
      </button>
    </QuietSection>
  );
}
