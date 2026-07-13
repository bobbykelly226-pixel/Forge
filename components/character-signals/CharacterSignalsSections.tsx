'use client';

import {
  EyeOff,
  Handshake,
  Heart,
  ShieldCheck,
  Users,
  MessageSquareOff,
} from 'lucide-react';

import CharacterSignalCard from '@/components/character-signals/CharacterSignalCard';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';
import {
  getSignalDefinition,
  type RecognitionHistoryEntry,
  type UserSignalInstance,
} from '@/lib/character-signals-mock';

const sectionShell =
  'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-5 shadow-[0_12px_40px_rgba(11,45,92,0.05)] sm:p-6 lg:p-7 xl:p-8';

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
  headingId,
}: {
  title: string;
  description: string;
  headingId: string;
}) {
  return (
    <div className="mb-5 lg:mb-6">
      <h2
        id={headingId}
        className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.4rem]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A6575] lg:text-[15px]">
        {description}
      </p>
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
    <section className={`${sectionShell} h-full`} aria-labelledby="public-signals-heading">
      <SectionHeader
        headingId="public-signals-heading"
        title="Your Public Signals"
        description="Signals currently displayed on your profile, or hidden by you."
      />
      {visible.length === 0 ? (
        <EmptyBlock
          title="No Character Signals are displayed yet."
          description="Positive recognition takes time and meaningful interaction."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
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
    <section className={`${sectionShell} h-full`} aria-labelledby="pending-signals-heading">
      <SectionHeader
        headingId="pending-signals-heading"
        title="Pending Approval"
        description="Signals with enough confirmations, waiting for your choice."
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
                <p className="text-sm leading-relaxed text-[#5A6575]">
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
        headingId="growing-signals-heading"
        title="Growing Signals"
        description="These remain visible only to you until enough independent people confirm the same quality."
      />
      {growing.length === 0 ? (
        <EmptyBlock
          title="No growing signals yet."
          description="When someone recognizes a positive quality, early progress will appear here privately."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {growing.map((instance) => (
            <CharacterSignalCard
              key={instance.id}
              signalId={instance.signalId}
              confirmationCount={instance.confirmationCount}
              countLabel={`Recognized by ${instance.confirmationCount} ${
                instance.confirmationCount === 1 ? 'person' : 'people'
              }`}
              status={instance.status}
              layout="horizontal"
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
        headingId="history-heading"
        title="Recognition History"
        description="A private record of recognitions you have received and given."
      />
      {history.length === 0 ? (
        <EmptyBlock
          title="No recognition activity yet."
          description="Meaningful interactions will appear here over time."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
          {history.map((entry) => {
            const signal = getSignalDefinition(entry.signalId);
            const title =
              entry.kind === 'received'
                ? `You received ${signal.title}`
                : `You recognized ${entry.recipientFirstName ?? 'someone'} as ${signal.title}`;
            return (
              <li
                key={entry.id}
                className="rounded-2xl border border-[#0B2D5C]/08 bg-white/85 px-4 py-4 sm:px-5"
              >
                <p className="text-sm font-semibold leading-snug text-[#0B2D5C] lg:text-[15px]">
                  {title}
                </p>
                <p className="mt-1.5 text-sm text-[#5A6575]">{entry.contextLabel}</p>
                <p className="mt-1 text-xs text-[#8A93A0]">{entry.relativeTime}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const PRINCIPLES = [
  {
    title: 'Positive recognition only',
    description: 'Character Signals celebrate respectful behavior — never ratings or criticism.',
    icon: Heart,
  },
  {
    title: 'Multiple independent confirmations',
    description: 'A signal becomes eligible only after several people recognize the same quality.',
    icon: Users,
  },
  {
    title: 'Recipient controls public display',
    description: 'You choose what appears on your profile. Nothing is automatic.',
    icon: EyeOff,
  },
  {
    title: 'No public written reviews',
    description: 'There are no comments, star ratings, or public testimonials.',
    icon: MessageSquareOff,
  },
  {
    title: 'No negative badges',
    description: 'Character Signals never display negative traits or popularity scores.',
    icon: Handshake,
  },
  {
    title: 'Safety reports are handled separately',
    description: 'Reporting and blocking remain a separate path from Character Signals.',
    icon: ShieldCheck,
  },
] as const;

export function HowCharacterSignalsWorkSection() {
  return (
    <section className={sectionShell} aria-labelledby="how-it-works-heading">
      <SectionHeader
        headingId="how-it-works-heading"
        title="How It Works"
        description="Character Signals celebrate recurring positive behavior."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {PRINCIPLES.map((principle) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.title}
              className="rounded-2xl border border-[#0B2D5C]/08 bg-white/85 px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EEF6] text-[#0B2D5C]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B2D5C]">{principle.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">
                    {principle.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 rounded-2xl border border-[#0B2D5C]/10 bg-[#E8EEF6]/80 px-5 py-4 text-[15px] leading-relaxed text-[#0B2D5C]">
        Character Signals are designed to encourage respectful dating, not judge someone&apos;s
        worth.
      </p>
    </section>
  );
}
