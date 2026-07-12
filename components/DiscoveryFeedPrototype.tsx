'use client';

import { useCallback, useMemo, useState } from 'react';

import DiscoveryBottomNav from '@/components/DiscoveryBottomNav';
import DiscoveryFeedCard from '@/components/DiscoveryFeedCard';
import OpenToChatDrawer from '@/components/OpenToChatDrawer';
import {
  DISCOVERY_FEED_PROFILES,
  DISCOVERY_FEED_VIEWER_NAME,
  type DiscoveryFeedProfile,
} from '@/lib/discovery-feed-mock';

const FILTERS = ['All', 'Nearby', 'Strong Alignment', 'New', 'Recently Active'] as const;

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DiscoveryFeedPrototype() {
  const [profiles] = useState<DiscoveryFeedProfile[]>(DISCOVERY_FEED_PROFILES);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const [pressedNote, setPressedNote] = useState<string | null>(null);
  const [openToChatDrawerOpen, setOpenToChatDrawerOpen] = useState(false);
  const [openToChatSentById, setOpenToChatSentById] = useState<Record<string, boolean>>({});
  const [openToChatDrawerMode, setOpenToChatDrawerMode] = useState<'educate' | 'success'>(
    'educate'
  );
  const [activeChatProfile, setActiveChatProfile] = useState<DiscoveryFeedProfile | null>(null);

  const visibleProfiles = showEmptyDemo ? [] : profiles;
  const greeting = useMemo(() => getTimeGreeting(), []);

  const flashNote = (message: string) => {
    setPressedNote(message);
    window.setTimeout(() => setPressedNote(null), 2200);
  };

  const openOpenToChat = (profile: DiscoveryFeedProfile) => {
    setActiveChatProfile(profile);
    setOpenToChatDrawerMode(openToChatSentById[profile.id] ? 'success' : 'educate');
    setOpenToChatDrawerOpen(true);
  };

  const closeOpenToChatDrawer = useCallback(() => {
    setOpenToChatDrawerOpen(false);
  }, []);

  const handleOpenToChatSent = useCallback(() => {
    if (!activeChatProfile) return;
    setOpenToChatSentById((prev) => ({ ...prev, [activeChatProfile.id]: true }));
  }, [activeChatProfile]);

  return (
    <>
      <style>{`
        @keyframes discoveryFeedFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes discoveryFeedSoftPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
      `}</style>

      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7">
        <header
          className="shrink-0"
          style={{ animation: 'discoveryFeedFadeUp 0.5s ease-out both' }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <img
              src="/Logos/forgedinlife-header-dark.png"
              alt="Forge"
              className="h-12 w-auto sm:h-14"
            />
            <p className="rounded-full border border-[#0B2D5C]/12 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]/65">
              Prototype
            </p>
          </div>

          <h1
            className="text-[2.1rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-[2.45rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {greeting}, {DISCOVERY_FEED_VIEWER_NAME}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5A6575] sm:text-base">
            Here are a few thoughtful introductions.
          </p>
        </header>

        <div
          className="mt-6 shrink-0"
          style={{ animation: 'discoveryFeedFadeUp 0.55s ease-out both', animationDelay: '60ms' }}
        >
          <div
            className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="toolbar"
            aria-label="Discovery filters (prototype only)"
          >
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter);
                    flashNote('Prototype only — filters do not change results yet.');
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                      : 'border border-[#0B2D5C]/12 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25'
                  }`}
                  aria-pressed={isActive}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 min-h-0 flex-1">
          {visibleProfiles.length === 0 ? (
            <section
              className="flex min-h-[58vh] flex-col items-center justify-center rounded-[2rem] border border-[#0B2D5C]/08 bg-white/75 px-8 py-16 text-center shadow-[0_16px_44px_rgba(11,45,92,0.06)]"
              aria-live="polite"
              style={{ animation: 'discoveryFeedFadeUp 0.55s ease-out both' }}
            >
              <div
                className="mb-6 h-14 w-14 rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6]"
                style={{ animation: 'discoveryFeedSoftPulse 2.4s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <h2
                className="text-2xl tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                We&apos;re finding thoughtful introductions for you.
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5A6575]">
                Forge is preparing a short list of intentional introductions. Check back soon.
              </p>
              <button
                type="button"
                onClick={() => setShowEmptyDemo(false)}
                className="mt-8 text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
              >
                Show sample introductions
              </button>
            </section>
          ) : (
            <div
              className="flex flex-col gap-8 sm:gap-10"
              style={{ scrollSnapType: 'y proximity' }}
            >
              {visibleProfiles.map((profile, index) => (
                <DiscoveryFeedCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  openToChatLabel={
                    openToChatSentById[profile.id] ? 'Request Sent' : 'Open to Chat'
                  }
                  onInterested={() =>
                    flashNote('Prototype only — Interested does not create a match.')
                  }
                  onOpenToChat={() => openOpenToChat(profile)}
                  onSaveForLater={() =>
                    flashNote('Prototype only — Save for Later is not connected yet.')
                  }
                  onNotForMe={() =>
                    flashNote('Prototype only — Not for Me does not hide profiles yet.')
                  }
                />
              ))}
            </div>
          )}
        </div>

        {pressedNote && (
          <p
            className="fixed inset-x-4 bottom-[5.75rem] z-30 mx-auto max-w-lg rounded-2xl border border-[#0B2D5C]/10 bg-[#0B2D5C] px-4 py-3 text-center text-sm text-white shadow-[0_12px_32px_rgba(11,45,92,0.25)] sm:inset-x-auto"
            role="status"
          >
            {pressedNote}
          </p>
        )}

        {visibleProfiles.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowEmptyDemo(true)}
              className="text-xs font-medium text-[#8A93A0] transition hover:text-[#0B2D5C]"
            >
              Preview empty state
            </button>
            <p className="mt-3 text-xs leading-relaxed text-[#8A93A0]">
              Forge Discovery Feed — UI/UX prototype.
              <br />
              No matching, messaging, scoring, or live data.
            </p>
          </div>
        )}
      </div>

      <DiscoveryBottomNav active="discovery" />

      <OpenToChatDrawer
        open={openToChatDrawerOpen}
        onClose={closeOpenToChatDrawer}
        onSent={handleOpenToChatSent}
        profileName={activeChatProfile?.firstName ?? 'them'}
        mode={openToChatDrawerMode}
        showFirstTimeBanner={
          !!activeChatProfile &&
          !openToChatSentById[activeChatProfile.id] &&
          openToChatDrawerMode === 'educate'
        }
      />
    </>
  );
}
