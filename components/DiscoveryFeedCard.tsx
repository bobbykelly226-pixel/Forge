'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import {
  Bookmark,
  Heart,
  Info,
  Lightbulb,
  MapPin,
  MessageCircle,
  Send,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

import type { DiscoveryFeedProfile } from '@/lib/discovery-feed-mock';

type DiscoveryFeedCardProps = {
  profile: DiscoveryFeedProfile;
  index: number;
  onInterested: () => void;
  onOpenToChat: () => void;
  onSaveForLater: () => void;
  onNotForMe: () => void;
  openToChatLabel?: string;
};

const SIGNAL_ICONS: Record<string, LucideIcon> = {
  'Respectful Communicator': MessageCircle,
  'Good Listener': Lightbulb,
  'Genuine and Present': Heart,
  'Values Family': Users,
  Dependable: Bookmark,
  'Thoughtful Planner': Lightbulb,
  'Warm Presence': Heart,
  Empathetic: Heart,
  'Clear Communicator': MessageCircle,
  'Servant Hearted': Users,
  'Steady Under Pressure': Bookmark,
  'Good Humor': Lightbulb,
};

function SignalChip({ label }: { label: string }) {
  const Icon = SIGNAL_ICONS[label] ?? Heart;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-xs font-medium text-[#0B2D5C] lg:px-3.5 lg:py-2 lg:text-[13px]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#0B2D5C]/70" strokeWidth={1.75} aria-hidden="true" />
      {label}
    </span>
  );
}

function ActionTile({
  onClick,
  label,
  description,
  icon,
  variant,
}: {
  onClick: () => void;
  label: string;
  description: string;
  icon: ReactNode;
  variant: 'primary' | 'outline' | 'secondary';
}) {
  const base =
    'flex w-full flex-col items-start gap-1 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:gap-1.5 lg:px-5 lg:py-4';

  const variants = {
    primary:
      'bg-[#D62828] text-white shadow-[0_10px_28px_rgba(214,40,40,0.18)] hover:bg-[#A61F1F] focus-visible:outline-[#D62828]',
    outline:
      'border border-[#0B2D5C]/25 bg-white text-[#0B2D5C] hover:border-[#0B2D5C]/45 hover:bg-[#FBF9F6] focus-visible:outline-[#0B2D5C]',
    secondary:
      'border border-[#0B2D5C]/12 bg-[#FBF9F6] text-[#0B2D5C] hover:border-[#0B2D5C]/25 hover:bg-white focus-visible:outline-[#0B2D5C]',
  } as const;

  return (
    <button type="button" onClick={onClick} className={`${base} ${variants[variant]}`}>
      <span className="inline-flex items-center gap-2.5">
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[15px] font-semibold lg:text-base">{label}</span>
      </span>
      <span
        className={`pl-8 text-xs leading-snug lg:pl-9 lg:text-[13px] ${
          variant === 'primary' ? 'text-white/85' : 'text-[#6B7585]'
        } hidden sm:block`}
      >
        {description}
      </span>
    </button>
  );
}

export default function DiscoveryFeedCard({
  profile,
  index,
  onInterested,
  onOpenToChat,
  onSaveForLater,
  onNotForMe,
  openToChatLabel = 'Open to Chat',
}: DiscoveryFeedCardProps) {
  const router = useRouter();

  const openProfile = () => {
    router.push('/discovery/profile');
  };

  const handleOpenProfileKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProfile();
    }
  };

  const stopAnd =
    (action: () => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      action();
    };

  return (
    <article
      className="snap-start snap-always"
      style={{
        animation: 'discoveryFeedFadeUp 0.55s ease-out both',
        animationDelay: `${Math.min(index, 3) * 70}ms`,
      }}
    >
      {/*
        Desktop (lg+):
          1) Top row — portrait (3:4) | information (height locked to portrait)
          2) Full-width action row beneath a single horizontal divider
             (portrait bottom === divider; portrait never enters actions)

        Mobile:
          Stacked portrait → information → actions (approved structure preserved)
      */}
      <div className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_18px_50px_rgba(11,45,92,0.08)] backdrop-blur-sm transition duration-300 hover:shadow-[0_22px_56px_rgba(11,45,92,0.12)] lg:rounded-[2.25rem] lg:shadow-[0_22px_56px_rgba(11,45,92,0.09)] lg:hover:shadow-[0_26px_64px_rgba(11,45,92,0.13)]">
        <div className="lg:grid lg:grid-cols-[minmax(17.5rem,40%)_minmax(0,1fr)]">
          {/* Portrait — 3:4 aspect drives the top-section row height on desktop */}
          <div
            role="link"
            tabIndex={0}
            onClick={openProfile}
            onKeyDown={handleOpenProfileKey}
            aria-label={`${profile.firstName}'s portrait — open discovery profile`}
            className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden sm:aspect-[3/4] lg:aspect-[3/4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2D5C]"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: profile.portraitGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 70% 70%, rgba(11,45,92,0.25), transparent 48%)',
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/60 via-[#0B2D5C]/18 to-transparent px-6 pb-6 pt-28 lg:px-7 lg:pb-7 lg:pt-24">
              <h2
                className="text-[2rem] leading-none tracking-[-0.02em] text-white sm:text-[2.25rem] lg:text-[2.35rem]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {profile.firstName}, {profile.age}
              </h2>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90 sm:text-base lg:text-[15px]">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {profile.location}
              </p>
            </div>
          </div>

          {/* Information — desktop height locked to portrait via h-0/min-h-full */}
          <div
            onClick={openProfile}
            className="flex min-h-0 cursor-pointer flex-col px-5 py-6 text-left sm:px-6 sm:py-7 lg:h-0 lg:min-h-full lg:overflow-y-auto lg:px-8 lg:py-7"
          >
            <div className="space-y-5 lg:space-y-5">
              <section aria-label="Relationship alignment">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
                  Relationship Alignment
                </p>
                <p
                  className="mt-2 inline-flex items-center gap-2 text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem] lg:text-[1.4rem]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  {profile.alignmentLabel}
                  <Info
                    className="hidden h-4 w-4 shrink-0 text-[#0B2D5C]/45 lg:inline"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </p>
                <p className="mt-2 text-sm text-[#5A6575] lg:text-[15px]">
                  Confidence:{' '}
                  <span className="font-semibold text-[#0B2D5C]">{profile.confidence}</span>
                </p>
              </section>

              {profile.hasImportantFactors ? (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#D62828]/80 bg-[#FBF6EE] px-4 py-3.5 lg:items-center lg:px-4 lg:py-3">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-xs font-bold text-white lg:mt-0"
                    aria-hidden="true"
                  >
                    !
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B2D5C] lg:text-[15px]">
                      Important Alignment Factors
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5A6575] lg:text-[14px]">
                      {profile.importantFactorsSummary ?? 'Review details on their full profile.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={stopAnd(openProfile)}
                    className="hidden shrink-0 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828] lg:inline-flex lg:items-center"
                  >
                    Learn more
                    <span aria-hidden="true">&nbsp;→</span>
                  </button>
                </div>
              ) : null}

              <section aria-label="About preview">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
                  About
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#3D4654] lg:text-[15px] lg:leading-[1.65]">
                  {profile.aboutPreview}
                </p>
              </section>

              <section aria-label="Character signals preview">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
                  Character Signals
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.characterSignals.map((signal) => (
                    <SignalChip key={signal} label={signal} />
                  ))}
                </div>
              </section>
            </div>

            <button
              type="button"
              onClick={stopAnd(openProfile)}
              className="mt-6 hidden text-left text-sm font-medium text-[#0B2D5C]/75 transition hover:text-[#D62828] lg:mt-auto lg:block lg:pt-5"
            >
              View full profile to learn more about {profile.firstName}
              <span aria-hidden="true">&nbsp;→</span>
            </button>
          </div>
        </div>

        {/*
          Full-width action section.
          Top border is the single divider; sits directly under the portrait/info row,
          so the portrait bottom aligns with this divider and never enters this section.
        */}
        <div className="border-t border-[#0B2D5C]/10 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActionTile
              variant="primary"
              label="Interested"
              description={`Let ${profile.firstName} know you're interested`}
              onClick={onInterested}
              icon={<Heart className="h-5 w-5" strokeWidth={1.75} />}
            />
            <ActionTile
              variant="outline"
              label={openToChatLabel}
              description="Send a low-pressure chat request"
              onClick={onOpenToChat}
              icon={<Send className="h-5 w-5" strokeWidth={1.75} />}
            />
            <ActionTile
              variant="secondary"
              label="Save for Later"
              description={`Keep ${profile.firstName} in your discovery`}
              onClick={onSaveForLater}
              icon={<Bookmark className="h-5 w-5" strokeWidth={1.75} />}
            />
            <ActionTile
              variant="secondary"
              label="Not for Me"
              description="Pass on this introduction"
              onClick={onNotForMe}
              icon={<X className="h-5 w-5" strokeWidth={1.75} />}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
