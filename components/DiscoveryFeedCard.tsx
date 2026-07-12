'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

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

function SignalChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-xs font-medium text-[#0B2D5C] lg:px-3.5 lg:py-2 lg:text-[13px]">
      {children}
    </span>
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

  return (
    <article
      className="snap-start snap-always"
      style={{
        animation: 'discoveryFeedFadeUp 0.55s ease-out both',
        animationDelay: `${Math.min(index, 3) * 70}ms`,
      }}
    >
      {/*
        Mobile: natural block stack (portrait → details → actions) — unchanged.
        Desktop (lg+): portrait | details+actions side-by-side web layout.
      */}
      <div className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_18px_50px_rgba(11,45,92,0.08)] backdrop-blur-sm transition duration-300 hover:shadow-[0_22px_56px_rgba(11,45,92,0.12)] lg:grid lg:grid-cols-[minmax(280px,40%)_minmax(0,1fr)] lg:rounded-[2.25rem] lg:shadow-[0_22px_56px_rgba(11,45,92,0.09)] lg:hover:shadow-[0_26px_64px_rgba(11,45,92,0.13)]">
        <button
          type="button"
          onClick={openProfile}
          aria-label={`${profile.firstName}'s portrait — open discovery profile`}
          className="relative block aspect-[4/5] w-full cursor-pointer overflow-hidden sm:aspect-[3/4] lg:row-span-2 lg:aspect-auto lg:min-h-[34rem] lg:self-stretch focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2D5C]"
          style={{ background: profile.portraitGradient }}
        >
          <span className="sr-only">{profile.firstName}, placeholder portrait</span>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 70% 70%, rgba(11,45,92,0.25), transparent 48%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/55 via-[#0B2D5C]/15 to-transparent px-6 pb-6 pt-28 lg:px-7 lg:pb-7 lg:pt-32">
            <h2
              className="text-[2rem] leading-none tracking-[-0.02em] text-white sm:text-[2.25rem] lg:text-[2.5rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {profile.firstName}, {profile.age}
            </h2>
            <p className="mt-2 text-sm text-white/85 sm:text-base lg:text-[17px]">
              {profile.location}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={openProfile}
          aria-label={`Open ${profile.firstName}'s discovery profile`}
          className="block w-full cursor-pointer space-y-6 px-5 py-6 text-left sm:px-6 sm:py-7 lg:flex lg:flex-col lg:space-y-7 lg:px-8 lg:pb-4 lg:pt-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2D5C]"
        >
          <section aria-label="Relationship alignment">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
              Relationship Alignment
            </p>
            <p
              className="mt-2 text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem] lg:text-[1.55rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {profile.alignmentLabel}
            </p>
            <p className="mt-2 text-sm text-[#5A6575] lg:text-[15px]">
              Confidence:{' '}
              <span className="font-semibold text-[#0B2D5C]">{profile.confidence}</span>
            </p>
          </section>

          {profile.hasImportantFactors && (
            <div className="flex gap-3 rounded-2xl border-2 border-[#D62828]/80 bg-[#FBF6EE] px-4 py-3.5 lg:px-5 lg:py-4">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-xs font-bold text-white"
                aria-hidden="true"
              >
                !
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0B2D5C] lg:text-[15px]">
                  Important Alignment Factors
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#5A6575] lg:text-[15px]">
                  {profile.importantFactorsSummary ?? 'Review details on their full profile.'}
                </p>
              </div>
            </div>
          )}

          <section aria-label="About preview">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
              About
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#3D4654] lg:text-base lg:leading-[1.7]">
              {profile.aboutPreview}
            </p>
          </section>

          <section aria-label="Character signals preview">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828] lg:text-xs">
              Character Signals
            </p>
            <div className="mt-3 flex flex-wrap gap-2 lg:mt-3.5 lg:gap-2.5">
              {profile.characterSignals.map((signal) => (
                <SignalChip key={signal}>{signal}</SignalChip>
              ))}
            </div>
          </section>

          <p className="text-center text-xs text-[#8A93A0] lg:mt-auto lg:pt-2 lg:text-left">
            <span className="lg:hidden">Tap to open the full Discovery Profile</span>
            <span className="hidden lg:inline">
              Click anywhere on the introduction to open the full Discovery Profile
            </span>
          </p>
        </button>

        <div className="space-y-3 border-t border-[#0B2D5C]/06 px-5 pb-6 pt-5 sm:px-6 sm:pb-7 lg:border-[#0B2D5C]/06 lg:px-8 lg:pb-8 lg:pt-2">
          <button
            type="button"
            onClick={onInterested}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.18)] transition hover:bg-[#A61F1F] active:scale-[0.99] lg:py-4"
          >
            Interested
          </button>
          <button
            type="button"
            onClick={onOpenToChat}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/25 bg-white/80 px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/45 hover:bg-white active:scale-[0.99] lg:py-4"
          >
            {openToChatLabel}
          </button>
          <div className="flex items-center justify-center gap-8 pt-1 lg:justify-start lg:gap-10">
            <button
              type="button"
              onClick={onSaveForLater}
              className="text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
            >
              Save for Later
            </button>
            <button
              type="button"
              onClick={onNotForMe}
              className="text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
            >
              Not for Me
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
