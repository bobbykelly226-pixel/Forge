'use client';

import CharacterSignalCard from '@/components/character-signals/CharacterSignalCard';
import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';
import { getSignalDefinition, PUBLIC_DISPLAY_THRESHOLD } from '@/lib/character-signals/catalog';
import type {
  RecognitionHistoryEntry,
  RecognitionRecipient,
  UserSignalInstance,
} from '@/lib/character-signals/types';

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

export function EligibleRecipientsSection({ recipients }: { recipients: RecognitionRecipient[] }) {
  const { openRecognition, registerRecognitionTrigger } = useCharacterSignals();
  return (
    <QuietSection headingId="eligible-recognition-heading" title="Recognize a Positive Quality">
      {recipients.length === 0 ? (
        <div className="rounded-2xl border border-[#0B2D5C]/08 bg-white/75 px-4 py-4">
          <p className="text-sm leading-relaxed text-[#5A6575]">
            Eligible connections appear here after both people have participated in a Forge conversation.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recipients.map((recipient, index) => (
            <li key={recipient.id} className="flex flex-col gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#0B2D5C]">{recipient.firstName}</p>
                <p className="mt-1 text-sm text-[#5A6575]">{recipient.contextLabel}</p>
              </div>
              <button
                ref={index === 0 ? registerRecognitionTrigger : undefined}
                type="button"
                onClick={() => openRecognition(recipient.id)}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              >
                Recognize {recipient.firstName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </QuietSection>
  );
}

export function VisibleOnProfileSection({ signals }: { signals: UserSignalInstance[] }) {
  const { setVisibility, isSaving } = useCharacterSignals();
  const visible = signals.filter((signal) => signal.status === 'public');
  return (
    <QuietSection headingId="visible-on-profile-heading" title="Visible on My Profile">
      {visible.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">No Character Signals are displayed on your profile yet.</p>
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
                    disabled={isSaving}
                    onClick={() => setVisibility(instance.signalId, false)}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-[#FBF9F6] px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white disabled:opacity-60"
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

export function PrivateSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { setVisibility, isSaving } = useCharacterSignals();
  const privateSignals = signals.filter((signal) => signal.status === 'hidden' || signal.status === 'growing');
  if (privateSignals.length === 0) return null;
  return (
    <QuietSection headingId="private-signals-heading" title="Private Character Signals">
      <ul className="space-y-3">
        {privateSignals.map((instance) => (
          <li key={instance.id}>
            <CharacterSignalCard
              signalId={instance.signalId}
              confirmationCount={instance.confirmationCount}
              actions={instance.status === 'hidden' ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setVisibility(instance.signalId, true)}
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Show on Profile
                </button>
              ) : (
                <span className="text-xs text-[#8A93A0]">
                  {instance.confirmationCount} of {PUBLIC_DISPLAY_THRESHOLD} confirmations
                </span>
              )}
            />
          </li>
        ))}
      </ul>
    </QuietSection>
  );
}

export function NewRecognitionSection({ signals }: { signals: UserSignalInstance[] }) {
  const { respondToRecognition, isSaving } = useCharacterSignals();
  const pending = signals.filter((signal) => signal.status === 'pending');
  return (
    <QuietSection headingId="new-recognition-heading" title="New Recognition">
      {pending.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">You&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((instance) => {
            const signal = getSignalDefinition(instance.signalId);
            return (
              <li key={instance.id} className="rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#0B2D5C]">
                    <CharacterSignalIcon signalId={instance.signalId} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-[#5A6575]">{instance.recognizedBy ?? 'A Forge member'} recognized:</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#0B2D5C]">{signal.title}</p>
                    {!instance.canPublishAfterApproval && (
                      <p className="mt-1 text-xs text-[#8A93A0]">Accepting keeps it private until three independent confirmations.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => respondToRecognition(instance.id, instance.canPublishAfterApproval ? 'public' : 'private')}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {instance.canPublishAfterApproval ? 'Show on Profile' : 'Accept Recognition'}
                  </button>
                  {instance.canPublishAfterApproval && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => respondToRecognition(instance.id, 'private')}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] disabled:opacity-60"
                    >
                      Keep Private
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => respondToRecognition(instance.id, 'decline')}
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#6B7585] underline decoration-[#6B7585]/45 underline-offset-4 disabled:opacity-60"
                  >
                    Decline Recognition
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

export function RecognitionHistorySection({ history }: { history: RecognitionHistoryEntry[] }) {
  return (
    <QuietSection headingId="history-heading" title="Recognition History">
      {history.length === 0 ? (
        <p className="text-sm leading-relaxed text-[#5A6575]">No recognition activity yet.</p>
      ) : (
        <ul className="divide-y divide-[#0B2D5C]/08 rounded-2xl border border-[#0B2D5C]/08 bg-white/80">
          {history.map((entry) => {
            const signal = getSignalDefinition(entry.signalId);
            return (
              <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B2D5C]">{entry.kind === 'received' ? 'Received' : 'Given'}</p>
                  <p className="mt-0.5 text-sm text-[#5A6575]">
                    {entry.kind === 'received' ? signal.title : `${signal.title} · ${entry.recipientFirstName ?? 'Forge member'}`}
                  </p>
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

export function LearnMoreSection({
  onLearnMore,
  learnMoreButtonRef,
}: {
  onLearnMore: () => void;
  learnMoreButtonRef?: React.RefCallback<HTMLButtonElement> | React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <QuietSection headingId="learn-more-heading" title="How Character Signals Work">
      <p className="max-w-xl text-sm leading-relaxed text-[#5A6575]">
        Character Signals are positive-only. Three independent confirmations are required for public display, and you decide what appears on your profile.
      </p>
      <button
        ref={learnMoreButtonRef}
        type="button"
        onClick={onLearnMore}
        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6]"
      >
        Learn More
      </button>
    </QuietSection>
  );
}
