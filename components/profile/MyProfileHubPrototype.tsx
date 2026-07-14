'use client';

import Link from 'next/link';
import {
  Camera,
  ChevronRight,
  Compass,
  HeartHandshake,
  Lock,
  Mic,
  Music2,
  Sparkles,
  Star,
  TextQuote,
  UserRound,
  Video,
  type LucideIcon,
} from 'lucide-react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import {
  MY_PROFILE_COMPLETION,
  MY_PROFILE_HUB,
  MY_PROFILE_SECTION_CARDS,
  type ProfileHubCard,
} from '@/lib/profile-v2-mock';

const CARD_ICONS: Record<ProfileHubCard['icon'], LucideIcon> = {
  photos: Camera,
  about: TextQuote,
  alignment: Compass,
  factors: Star,
  enjoy: HeartHandshake,
  music: Music2,
  signals: Sparkles,
  voice: Mic,
  video: Video,
  privacy: Lock,
  subscription: UserRound,
};

function CompletionRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(11,45,92,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#D62828"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-[#0B2D5C]">{percent}%</span>
      </div>
    </div>
  );
}

export default function MyProfileHubPrototype() {
  const flashNote = (_message: string) => {
    // Desktop top-bar prototype actions remain placeholders.
  };

  return (
    <>
      <style>{`
        @keyframes profileHubFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1440px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          <aside
            className="sticky top-8 hidden max-h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain lg:block"
            style={{ animation: 'profileHubFadeUp 0.45s ease-out both' }}
          >
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] backdrop-blur-sm xl:p-7">
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto"
              />
              <h1
                className="mt-8 text-[1.75rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                My Profile
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                Your home inside Forge — manage how you show up.
              </p>
              <ForgeDesktopAppNav active="profile" />
            </div>
          </aside>

          <div className="min-h-screen w-full min-w-0 lg:min-h-0">
            <div className="hidden px-0 lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
            </div>

            <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
              <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
                <img
                  src="/Logos/forgedinlife-header-dark.png"
                  alt="Forge"
                  className="h-12 w-auto sm:h-14"
                />
                <p className="rounded-full border border-[#0B2D5C]/12 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]/65">
                  Prototype
                </p>
              </div>

              <div
                className="lg:grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-10"
                style={{ animation: 'profileHubFadeUp 0.5s ease-out both' }}
              >
                {/* Left: summary */}
                <div className="space-y-5">
                  <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-20 w-20 shrink-0 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(11,45,92,0.12)]"
                        style={{ background: MY_PROFILE_HUB.portraitGradient }}
                        role="img"
                        aria-label={`${MY_PROFILE_HUB.firstName} profile photo`}
                      />
                      <div className="min-w-0">
                        <h1
                          className="text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                          style={{
                            fontFamily: 'var(--font-discovery-display), Georgia, serif',
                          }}
                        >
                          {MY_PROFILE_HUB.firstName}
                        </h1>
                        <p className="mt-2 text-sm text-[#5A6575]">{MY_PROFILE_HUB.location}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4 border-t border-[#0B2D5C]/06 pt-5">
                      <CompletionRing percent={MY_PROFILE_HUB.completionPercent} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
                          Profile completion
                        </p>
                        <p className="mt-1.5 text-lg font-semibold text-[#0B2D5C]">
                          {MY_PROFILE_HUB.completionPercent}% Complete
                        </p>
                        <p className="mt-1 text-sm text-[#5A6575]">
                          A few more details can strengthen your introductions.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section
                    className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]"
                    aria-labelledby="completion-checklist-title"
                  >
                    <h2
                      id="completion-checklist-title"
                      className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                      style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                    >
                      Profile checklist
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {MY_PROFILE_COMPLETION.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 text-sm text-[#0B2D5C]">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              item.complete
                                ? 'bg-[#0B2D5C] text-white'
                                : 'border border-[#0B2D5C]/20 bg-white text-[#8A93A0]'
                            }`}
                            aria-hidden="true"
                          >
                            {item.complete ? '✓' : ''}
                          </span>
                          <span className={item.complete ? '' : 'text-[#5A6575]'}>{item.label}</span>
                          <span className="sr-only">
                            {item.complete ? 'Complete' : 'Incomplete'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {/* Right: section cards */}
                <section aria-labelledby="my-profile-sections-title">
                  <h2
                    id="my-profile-sections-title"
                    className="mt-8 text-xl tracking-[-0.01em] text-[#0B2D5C] lg:mt-0 lg:text-2xl"
                    style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                  >
                    My Profile
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5A6575]">
                    Each section answers a different question about who you are.
                  </p>

                  <ul className="mt-5 space-y-3">
                    {MY_PROFILE_SECTION_CARDS.map((card) => {
                      const Icon = CARD_ICONS[card.icon];
                      const content = (
                        <>
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#0B2D5C]">
                            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[15px] font-semibold text-[#0B2D5C]">
                                {card.title}
                              </span>
                              {card.comingSoon && (
                                <span className="rounded-full border border-[#0B2D5C]/12 bg-[#F8F6F2] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5A6575]">
                                  Coming Soon
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block text-sm leading-relaxed text-[#5A6575]">
                              {card.description}
                            </span>
                          </span>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 text-[#8A93A0]"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </>
                      );

                      const className =
                        'flex w-full items-center gap-3.5 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 px-4 py-4 shadow-[0_8px_28px_rgba(11,45,92,0.04)] transition hover:border-[#0B2D5C]/18 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]';

                      if (card.href.startsWith('/')) {
                        return (
                          <li key={card.id}>
                            <Link href={card.href} className={className}>
                              {content}
                            </Link>
                          </li>
                        );
                      }

                      return (
                        <li key={card.id}>
                          <button
                            type="button"
                            className={className}
                            onClick={(event) => event.preventDefault()}
                            aria-disabled={card.comingSoon || undefined}
                          >
                            {content}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </div>

              <p className="mt-10 text-xs leading-relaxed text-[#8A93A0] lg:mt-12">
                Forge My Profile — UI/UX prototype.
                <br />
                No editing, Spotify, recording, subscriptions, or persistent data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ForgeAppBottomNav active="profile" />
    </>
  );
}
