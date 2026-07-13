'use client';

import {
  BookOpen,
  Clock3,
  Eye,
  EyeOff,
  Handshake,
  Heart,
  History,
  MessageSquareOff,
  ShieldCheck,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react';

import CharacterSignalCard from '@/components/character-signals/CharacterSignalCard';
import { useCharacterSignals } from '@/components/character-signals/CharacterSignalsProvider';
import {
  getSignalDefinition,
  type RecognitionHistoryEntry,
  type UserSignalInstance,
} from '@/lib/character-signals-mock';

type SectionTone = 'public' | 'pending' | 'growing' | 'history' | 'education';

const SECTION_THEME: Record<
  SectionTone,
  {
    accent: string;
    medium: string;
    pale: string;
    surface: string;
  }
> = {
  public: {
    accent: '#557A67',
    medium: '#8EAD9B',
    pale: '#EDF4EF',
    surface: 'bg-[#EDF4EF]/55',
  },
  pending: {
    accent: '#9A6A22',
    medium: '#C69A52',
    pale: '#FBF3E5',
    surface: 'bg-[#FBF3E5]/60',
  },
  growing: {
    accent: '#586B85',
    medium: '#91A2BA',
    pale: '#EEF2F7',
    surface: 'bg-[#EEF2F7]/55',
  },
  history: {
    accent: '#667085',
    medium: '#98A2B3',
    pale: '#F2F4F7',
    surface: 'bg-[#F2F4F7]/70',
  },
  education: {
    accent: '#5B6B7C',
    medium: '#8FA0B2',
    pale: '#FCFBF8',
    surface: 'bg-[#FCFBF8]',
  },
};

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#0B2D5C]/15 bg-white/80 px-5 py-10 text-center">
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

function SectionFrame({
  tone,
  headingId,
  title,
  description,
  icon: Icon,
  children,
  className = '',
}: {
  tone: SectionTone;
  headingId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  const theme = SECTION_THEME[tone];

  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border border-[#0B2D5C]/08 shadow-[0_12px_40px_rgba(11,45,92,0.05)] ${theme.surface} ${className}`}
      aria-labelledby={headingId}
      style={{ borderTopWidth: 3, borderTopColor: theme.accent }}
    >
      <div className="border-b border-[#0B2D5C]/06 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6 xl:px-8">
        <div className="flex items-start gap-3.5">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: theme.accent }}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.4rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5A6575] lg:text-[15px]">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7 xl:px-8">{children}</div>
    </section>
  );
}

export function PublicSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { hideFromProfile, showOnProfile, openSignalDetail, registerDetailTrigger } =
    useCharacterSignals();

  const visible = signals.filter(
    (signal) => signal.status === 'public' || signal.status === 'hidden'
  );

  return (
    <SectionFrame
      className="h-full"
      tone="public"
      headingId="public-signals-heading"
      title="Your Public Signals"
      description="Visible to people who view your profile."
      icon={Eye}
    >
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
              tone="public"
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
    </SectionFrame>
  );
}

export function PendingSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { approveForProfile, keepPrivate, openSignalDetail, registerDetailTrigger } =
    useCharacterSignals();

  const pending = signals.filter(
    (signal) => signal.status === 'pending' || signal.status === 'private'
  );

  return (
    <SectionFrame
      className="h-full"
      tone="pending"
      headingId="pending-signals-heading"
      title="Waiting for Your Decision"
      description="These signals are ready to appear on your profile if you choose."
      icon={Clock3}
    >
      {pending.length === 0 ? (
        <EmptyBlock
          title="Nothing is waiting for your decision."
          description="When a signal becomes eligible for display, it will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((instance) => (
            <CharacterSignalCard
              key={instance.id}
              signalId={instance.signalId}
              confirmationCount={instance.confirmationCount}
              status={instance.status}
              tone="pending"
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
          ))}
        </div>
      )}
    </SectionFrame>
  );
}

export function GrowingSignalsSection({ signals }: { signals: UserSignalInstance[] }) {
  const { openSignalDetail, registerDetailTrigger } = useCharacterSignals();
  const growing = signals.filter((signal) => signal.status === 'growing');

  return (
    <SectionFrame
      tone="growing"
      headingId="growing-signals-heading"
      title="Growing Signals"
      description="Private signals still gathering independent confirmations."
      icon={Sprout}
    >
      <p className="mb-5 text-sm leading-relaxed text-[#5A6575]">
        Growing Signals remain visible only to you until enough independent people confirm the
        same quality.
      </p>
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
              tone="growing"
              layout="horizontal"
              showConfirmationProgress
              detailTriggerRef={(node) => registerDetailTrigger(instance.signalId, node)}
              onViewDetails={() =>
                openSignalDetail(instance.signalId, instance.confirmationCount)
              }
            />
          ))}
        </div>
      )}
    </SectionFrame>
  );
}

export function RecognitionHistorySection({
  history,
}: {
  history: RecognitionHistoryEntry[];
}) {
  return (
    <SectionFrame
      tone="history"
      headingId="history-heading"
      title="Recognition History"
      description="A private record of recognitions you have received and shared."
      icon={History}
    >
      <p className="mb-5 inline-flex rounded-full border border-[#667085]/20 bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-[#667085]">
        Private activity
      </p>
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
                className="rounded-2xl border border-[#0B2D5C]/08 border-l-[3px] border-l-[#667085] bg-white px-4 py-4 sm:px-5"
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
    </SectionFrame>
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
    <SectionFrame
      tone="education"
      headingId="how-it-works-heading"
      title="How Character Signals Work"
      description="The principles that keep recognition positive, private, and trustworthy."
      icon={BookOpen}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {PRINCIPLES.map((principle) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.title}
              className="rounded-2xl border border-[#0B2D5C]/08 bg-white px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#5B6B7C]">
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
      <p className="mt-6 rounded-2xl border border-[#5B6B7C]/15 bg-white px-5 py-4 text-[15px] leading-relaxed text-[#0B2D5C]">
        Character Signals are designed to encourage respectful dating, not judge someone&apos;s
        worth.
      </p>
    </SectionFrame>
  );
}
