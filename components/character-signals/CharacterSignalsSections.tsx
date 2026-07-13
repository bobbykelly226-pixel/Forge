'use client';

import CharacterSignalCard from '@/components/character-signals/CharacterSignalCard';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';
import {
  getSignalDefinition,
  type RecognitionHistoryEntry,
  type UserSignalInstance,
} from '@/lib/character-signals-mock';

const sectionShell =
  'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-5 shadow-[0_12px_40px_rgba(11,45,92,0.05)] sm:p-6 lg:p-7';

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#0B2D5C]/15 bg-[#FBF9F6]/80 px-5 py-10 text-center">
      <p
        className="text-lg text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5A6575]">{description}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2
        className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">{description}</p>
    </div>
  );
}

export function PublicSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { hideFromProfile, showOnProfile, openSignalDetail, registerDetailTrigger } =
    useCharacterSignals();

  const visible = signals.filter(
    (signal) => signal.status === 'public' || signal.status === 'hidden'
  );

  return (
    <section className={sectionShell} aria-labelledby="public-signals-heading">
      <SectionHeader
        title="Your Public Signals"
        description="Signals currently displayed on your profile, or hidden by you."
      />
      {visible.length === 0 ? (
        <EmptyBlock
          title="No Character Signals are displayed yet."
          description="Positive recognition takes time and meaningful interaction."
        />
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
          {visible.map((instance) => (
            <CharacterSignalCard
              key={instance.id}
              signalId={instance.signalId}
              confirmationCount={instance.confirmationCount}
              status={instance.status}
              detailTriggerRef={(node) => registerDetailTrigger(instance.signalId, node)}
              onViewDetails={() =>
                openSignalDetail(instance.signalId, instance.confirmationCount)
              }
              actions={
                instance.status === 'public' ? (
                  <button
                    type="button"
                    onClick={() => hideFromProfile(instance.id)}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-[#FBF9F6] px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  >
                    Hide from Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => showOnProfile(instance.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  >
                    Show on Profile
                  </button>
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function PendingSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { approveForProfile, keepPrivate, openSignalDetail, registerDetailTrigger } =
    useCharacterSignals();

  const pending = signals.filter(
    (signal) => signal.status === 'pending' || signal.status === 'private'
  );

  return (
    <section className={sectionShell} aria-labelledby="pending-signals-heading">
      <SectionHeader
        title="Pending Approval"
        description="Signals that have enough confirmations and are waiting for your choice."
      />
      {pending.length === 0 ? (
        <EmptyBlock
          title="Nothing is waiting for your approval."
          description="When a signal becomes eligible for display, it will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((instance) => (
            <div key={instance.id} className="space-y-3">
              {instance.status === 'pending' && (
                <p className="text-sm text-[#5A6575]">
                  This signal is ready to appear on your profile.
                </p>
              )}
              <CharacterSignalCard
                signalId={instance.signalId}
                confirmationCount={instance.confirmationCount}
                status={instance.status}
                detailTriggerRef={(node) => registerDetailTrigger(instance.signalId, node)}
                onViewDetails={() =>
                  openSignalDetail(instance.signalId, instance.confirmationCount)
                }
                actions={
                  instance.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => approveForProfile(instance.id)}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                      >
                        Add to My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => keepPrivate(instance.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                      >
                        Keep Private
                      </button>
                    </>
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function GrowingSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { openSignalDetail, registerDetailTrigger } = useCharacterSignals();
  const growing = signals.filter((signal) => signal.status === 'growing');

  return (
    <section className={sectionShell} aria-labelledby="growing-signals-heading">
      <SectionHeader
        title="Growing Signals"
        description="Growing Signals remain visible only to you until enough independent people confirm the same quality."
      />
      {growing.length === 0 ? (
        <EmptyBlock
          title="No growing signals yet."
          description="When someone recognizes a positive quality, early progress will appear here privately."
        />
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
          {growing.map((instance) => (
            <CharacterSignalCard
              key={instance.id}
              signalId={instance.signalId}
              confirmationCount={instance.confirmationCount}
              countLabel={`Recognized by ${instance.confirmationCount} ${
                instance.confirmationCount === 1 ? 'person' : 'people'
              }`}
              status={instance.status}
              detailTriggerRef={(node) => registerDetailTrigger(instance.signalId, node)}
              onViewDetails={() =>
                openSignalDetail(instance.signalId, instance.confirmationCount)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function RecognitionHistorySection({
  history,
}: {
  history: RecognitionHistoryEntry[];
}) {
  return (
    <section className={sectionShell} aria-labelledby="history-heading">
      <SectionHeader
        title="Recognition History"
        description="A private record of recognitions you have received and given."
      />
      {history.length === 0 ? (
        <EmptyBlock
          title="No recognition activity yet."
          description="Meaningful interactions will appear here over time."
        />
      ) : (
        <ul className="space-y-3">
          {history.map((entry) => {
            const signal = getSignalDefinition(entry.signalId);
            const title =
              entry.kind === 'received'
                ? `You received ${signal.title}`
                : `You recognized ${entry.recipientFirstName ?? 'someone'} as ${signal.title}`;
            return (
              <li
                key={entry.id}
                className="rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4"
              >
                <p className="text-sm font-semibold text-[#0B2D5C]">{title}</p>
                <p className="mt-1 text-sm text-[#5A6575]">{entry.contextLabel}</p>
                <p className="mt-1 text-xs text-[#8A93A0]">{entry.relativeTime}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function HowCharacterSignalsWorkSection() {
  return (
    <section className={sectionShell} aria-labelledby="how-it-works-heading">
      <SectionHeader
        title="How It Works"
        description="Character Signals celebrate recurring positive behavior."
      />
      <ul className="space-y-3 text-sm leading-relaxed text-[#5A6575]">
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          Positive recognition only
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          No public written reviews
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          No negative badges
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          Signals require meaningful interaction
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          Multiple people must confirm the same quality
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          Recipients control public display
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[#0B2D5C]">•</span>
          Reports and safety concerns are handled separately
        </li>
      </ul>
      <p className="mt-6 rounded-2xl border border-[#0B2D5C]/08 bg-[#E8EEF6]/70 px-4 py-4 text-sm leading-relaxed text-[#0B2D5C]">
        Character Signals are designed to encourage respectful dating, not judge someone&apos;s
        worth.
      </p>
    </section>
  );
}
