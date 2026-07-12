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
    <span className="inline-flex items-center rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-xs font-medium text-[#0B2D5C]">
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
      <div className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_18px_50px_rgba(11,45,92,0.08)] backdrop-blur-sm transition duration-300 hover:shadow-[0_22px_56px_rgba(11,45,92,0.12)]">
        <button
          type="button"
          onClick={openProfile}
          aria-label={`Open ${profile.firstName}'s discovery profile`}
          className="block w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2D5C]"
        >
          <div
            className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4]"
            style={{ background: profile.portraitGradient }}
            role="img"
            aria-label={`${profile.firstName}, placeholder portrait`}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 70% 70%, rgba(11,45,92,0.25), transparent 48%)',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/55 via-[#0B2D5C]/15 to-transparent px-6 pb-6 pt-28">
              <h2
                className="text-[2rem] leading-none tracking-[-0.02em] text-white sm:text-[2.25rem]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {profile.firstName}, {profile.age}
              </h2>
              <p className="mt-2 text-sm text-white/85 sm:text-base">{profile.location}</p>
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6 sm:py-7">
            <section aria-label="Relationship alignment">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Relationship Alignment
              </p>
              <p
                className="mt-2 text-xl tracking-[-0.01em] text-[#0B2D5C] sm:text-[1.35rem]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {profile.alignmentLabel}
              </p>
              <p className="mt-2 text-sm text-[#5A6575]">
                Confidence:{' '}
                <span className="font-semibold text-[#0B2D5C]">{profile.confidence}</span>
              </p>
            </section>

            {profile.hasImportantFactors && (
              <div className="flex gap-3 rounded-2xl border-2 border-[#D62828]/80 bg-[#FBF6EE] px-4 py-3.5">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  !
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0B2D5C]">
                    Important Alignment Factors
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5A6575]">
                    {profile.importantFactorsSummary ?? 'Review details on their full profile.'}
                  </p>
                </div>
              </div>
            )}

            <section aria-label="About preview">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                About
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#3D4654]">
                {profile.aboutPreview}
              </p>
            </section>

            <section aria-label="Character signals preview">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Character Signals
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.characterSignals.map((signal) => (
                  <SignalChip key={signal}>{signal}</SignalChip>
                ))}
              </div>
            </section>

            <p className="text-center text-xs text-[#8A93A0]">
              Tap to open the full Discovery Profile
            </p>
          </div>
        </button>

        <div className="space-y-3 border-t border-[#0B2D5C]/06 px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
          <button
            type="button"
            onClick={onInterested}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.18)] transition hover:bg-[#A61F1F] active:scale-[0.99]"
          >
            Interested
          </button>
          <button
            type="button"
            onClick={onOpenToChat}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/25 bg-white/80 px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/45 hover:bg-white active:scale-[0.99]"
          >
            {openToChatLabel}
          </button>
          <div className="flex items-center justify-center gap-8 pt-1">
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
