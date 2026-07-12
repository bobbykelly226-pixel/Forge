'use client';

import { useCallback, useMemo, useState } from 'react';
import { Clock, Heart, LayoutGrid, MapPin, Sparkles, type LucideIcon } from 'lucide-react';

import DiscoveryBottomNav from '@/components/DiscoveryBottomNav';
import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import DiscoveryFeedCard from '@/components/DiscoveryFeedCard';
import OpenToChatDrawer from '@/components/OpenToChatDrawer';
import {
  DISCOVERY_FEED_PROFILES,
  DISCOVERY_FEED_VIEWER_NAME,
  type DiscoveryFeedProfile,
} from '@/lib/discovery-feed-mock';

const FILTERS = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Nearby', label: 'Nearby', icon: MapPin },
  { id: 'Strong Alignment', label: 'Strong Alignment', icon: Heart },
  { id: 'New', label: 'New', icon: Sparkles },
  { id: 'Recently Active', label: 'Recently Active', icon: Clock },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

type FilterButtonsProps = {
  activeFilter: FilterId;
  onSelect: (filter: FilterId) => void;
  layout: 'horizontal' | 'vertical';
};

function FilterButtons({ activeFilter, onSelect, layout }: FilterButtonsProps) {
  const isVertical = layout === 'vertical';

  return (
    <div
      className={
        isVertical
          ? 'flex flex-col gap-2'
          : 'scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      }
      role="toolbar"
      aria-label="Discovery filters (prototype only)"
    >
      {FILTERS.map((filter) => {
        const isActive = filter.id === activeFilter;
        const Icon: LucideIcon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelect(filter.id)}
            className={
              isVertical
                ? `inline-flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                      : 'border border-[#0B2D5C]/10 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25 hover:bg-white'
                  }`
                : `inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                      : 'border border-[#0B2D5C]/12 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25'
                  }`
            }
            aria-pressed={isActive}
          >
            <Icon
              className={isVertical ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DiscoveryFeedPrototype() {
  const [profiles] = useState<DiscoveryFeedProfile[]>(DISCOVERY_FEED_PROFILES);
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterId>('All');
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

  const selectFilter = (filter: FilterId) => {
    setActiveFilter(filter);
    flashNote('Prototype only — filters do not change results yet.');
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

  const feedContent =
    visibleProfiles.length === 0 ? (
      <section
        className="flex min-h-[58vh] flex-col items-center justify-center rounded-[2rem] border border-[#0B2D5C]/08 bg-white/75 px-8 py-16 text-center shadow-[0_16px_44px_rgba(11,45,92,0.06)] lg:min-h-[28rem] lg:rounded-[2.25rem] lg:px-12 lg:py-20"
        aria-live="polite"
        style={{ animation: 'discoveryFeedFadeUp 0.55s ease-out both' }}
      >
        <div
          className="mb-6 h-14 w-14 rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6]"
          style={{ animation: 'discoveryFeedSoftPulse 2.4s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <h2
          className="text-2xl tracking-[-0.01em] text-[#0B2D5C] lg:text-[1.85rem]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          We&apos;re finding thoughtful introductions for you.
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5A6575] lg:max-w-md lg:text-base">
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
        className="flex flex-col gap-8 sm:gap-10 lg:gap-12"
        style={{ scrollSnapType: 'y proximity' }}
      >
        {visibleProfiles.map((profile, index) => (
          <DiscoveryFeedCard
            key={profile.id}
            profile={profile}
            index={index}
            openToChatLabel={openToChatSentById[profile.id] ? 'Request Sent' : 'Open to Chat'}
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
    );

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

      {/*
        Mobile: existing single-column feed (max-w-lg) — preserved.
        Desktop (lg+): sidebar + wider main stage as a premium web app shell.
      */}
      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1360px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          {/* Desktop permanent sidebar */}
          <aside
            className="sticky top-8 hidden self-start lg:block"
            style={{ animation: 'discoveryFeedFadeUp 0.5s ease-out both' }}
          >
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_16px_44px_rgba(11,45,92,0.05)] backdrop-blur-sm xl:p-7">
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto"
              />

              <h1
                className="mt-8 text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {greeting}, {DISCOVERY_FEED_VIEWER_NAME}
              </h1>

              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                We&apos;ve selected a few thoughtful introductions based on your profile.
              </p>

              <div className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                  Discover
                </p>
                <FilterButtons
                  activeFilter={activeFilter}
                  onSelect={selectFilter}
                  layout="vertical"
                />
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-h-screen w-full lg:min-h-0">
            {/* Desktop top utilities span the main stage */}
            <div className="hidden px-0 lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
            </div>

            {/* Mobile + shared feed stage: max-w-lg on mobile (unchanged), wider on desktop */}
            <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-3xl lg:px-0 lg:pb-10 lg:pt-0 xl:max-w-[52rem]">
              {/* Mobile header — hidden on desktop */}
              <header
                className="shrink-0 lg:hidden"
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

              {/* Mobile filter bar — hidden on desktop */}
              <div
                className="mt-6 shrink-0 lg:hidden"
                style={{
                  animation: 'discoveryFeedFadeUp 0.55s ease-out both',
                  animationDelay: '60ms',
                }}
              >
                <FilterButtons
                  activeFilter={activeFilter}
                  onSelect={selectFilter}
                  layout="horizontal"
                />
              </div>

              <div className="mt-7 min-h-0 flex-1 lg:mt-0">{feedContent}</div>

              {pressedNote && (
                <p
                  className="fixed inset-x-4 bottom-[5.75rem] z-30 mx-auto max-w-lg rounded-2xl border border-[#0B2D5C]/10 bg-[#0B2D5C] px-4 py-3 text-center text-sm text-white shadow-[0_12px_32px_rgba(11,45,92,0.25)] sm:inset-x-auto lg:bottom-8 lg:left-auto lg:right-8 lg:max-w-sm"
                  role="status"
                >
                  {pressedNote}
                </p>
              )}

              {visibleProfiles.length > 0 && (
                <div className="mt-8 text-center lg:mt-10 lg:text-left">
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
          </div>
        </div>
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
