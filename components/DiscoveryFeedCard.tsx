'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import {
  Heart,
  Info,
  Lightbulb,
  MapPin,
  MessageCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';

type DiscoveryFeedCardProps = {
  profile: DiscoveryFeedCardModel;
  index: number;
};

const SIGNAL_ICONS: Record<string, LucideIcon> = {
  'Respectful Communicator': MessageCircle,
  'Good Listener': Lightbulb,
  'Genuine and Present': Heart,
  'Values Family': Users,
  Dependable: Heart,
  'Thoughtful Planner': Lightbulb,
  'Warm Presence': Heart,
  Empathetic: Heart,
  'Clear Communicator': MessageCircle,
  'Servant Hearted': Users,
  'Steady Under Pressure': Heart,
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

export default function DiscoveryFeedCard({ profile, index }: DiscoveryFeedCardProps) {
  const router = useRouter();

  const openProfile = () => {
    router.push(`/discovery/profile/${profile.id}`);
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
      <div className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_18px_50px_rgba(11,45,92,0.08)] backdrop-blur-sm transition duration-300 hover:shadow-[0_22px_56px_rgba(11,45,92,0.12)] lg:rounded-[2.25rem] lg:shadow-[0_22px_56px_rgba(11,45,92,0.09)] lg:hover:shadow-[0_26px_64px_rgba(11,45,92,0.13)]">
        <div className="lg:grid lg:grid-cols-[minmax(17.5rem,40%)_minmax(0,1fr)]">
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
                backgroundImage: profile.photoUrl
                  ? `url(${profile.photoUrl})`
                  : profile.portraitGradient,
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
                {profile.firstName}
                {profile.age != null ? `, ${profile.age}` : ''}
              </h2>
              {profile.location ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90 sm:text-base lg:text-[15px]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {profile.location}
                </p>
              ) : null}
            </div>
          </div>

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
                  className="mt-2.5 inline-flex items-center gap-2 text-xl font-medium tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem] lg:text-[1.4rem]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  {profile.alignmentLabel}
                  <Info
                    className="hidden h-4 w-4 shrink-0 text-[#0B2D5C]/45 lg:inline"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
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

              {profile.aboutPreview ? (
                <section aria-label="About preview">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
                    About
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#3D4654] lg:text-[15px] lg:leading-[1.65]">
                    {profile.aboutPreview}
                  </p>
                </section>
              ) : null}

              {profile.characterSignals.length > 0 ? (
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
              ) : null}
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

        <div className="border-t border-[#0B2D5C]/10 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
          <DiscoveryActionTiles
            profileId={profile.id}
            profileName={profile.firstName}
            layout="feed-grid"
          />
        </div>
      </div>
    </article>
  );
}
