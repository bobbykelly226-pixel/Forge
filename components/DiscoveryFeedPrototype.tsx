'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAuthenticatedTwoColumnShell from '@/components/ForgeAuthenticatedTwoColumnShell';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import DiscoveryFiltersDrawer from '@/components/discovery/DiscoveryFiltersDrawer';
import DiscoveryFeedCard from '@/components/DiscoveryFeedCard';
import {
  EMPTY_DISCOVERY_FILTERS,
  countActiveDiscoveryFilters,
  profileMatchesDiscoveryFilters,
} from '@/lib/discovery/filters';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function FilterButton({
  count,
  onClick,
  layout,
}: {
  count: number;
  onClick: () => void;
  layout: 'horizontal' | 'vertical';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        layout === 'vertical'
          ? 'inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-[#0B2D5C] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
          : 'inline-flex items-center gap-2 rounded-full bg-[#0B2D5C] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
      }
    >
      <span className="inline-flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
      </span>
      {count > 0 ? (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>
      ) : null}
    </button>
  );
}

type DiscoveryFeedProps = {
  profiles: DiscoveryFeedCardModel[];
  viewerName: string;
  loadError?: string | null;
  seedProfilesInjected?: boolean;
  showSeedReset?: boolean;
};

export default function DiscoveryFeedPrototype({
  profiles,
  viewerName,
  loadError = null,
  showSeedReset = false,
}: DiscoveryFeedProps) {
  const [filters, setFilters] = useState(EMPTY_DISCOVERY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isPassed, resetSeedState } = useDiscoveryActions();

  const visibleProfiles = profiles.filter(
    (profile) =>
      !isPassed(profile.id) && profileMatchesDiscoveryFilters(profile, filters)
  );
  const greeting = useMemo(() => getTimeGreeting(), []);
  const activeFilterCount = countActiveDiscoveryFilters(filters);

  const feedContent = loadError ? (
    <section
      className="flex min-h-[40vh] flex-col items-center justify-center rounded-[2rem] border border-[#0B2D5C]/08 bg-white/75 px-8 py-16 text-center"
      role="alert"
    >
      <h2
        className="text-2xl text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        Discovery is unavailable right now
      </h2>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5A6575]">{loadError}</p>
    </section>
  ) : visibleProfiles.length === 0 ? (
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
        {activeFilterCount > 0
          ? 'No profiles match these filters'
          : 'No profiles are available right now'}
      </h2>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5A6575] lg:max-w-md lg:text-base">
        {activeFilterCount > 0
          ? 'Try widening or clearing your filters to see more eligible profiles.'
          : 'When eligible Forge members show themselves in Discovery, they will appear here.'}
      </p>
    </section>
  ) : (
    <div
      className="flex flex-col gap-8 sm:gap-10 lg:gap-12"
      style={{ scrollSnapType: 'y proximity' }}
    >
      {visibleProfiles.map((profile, index) => (
        <DiscoveryFeedCard key={profile.id} profile={profile} index={index} />
      ))}
      {showSeedReset ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => resetSeedState()}
            className="text-xs text-[#8A93A0] underline-offset-2 transition hover:text-[#5A6575] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          >
            Reset Seed State
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes discoveryFeedFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes discoveryFeedSoftPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
      `}</style>

      <ForgeAuthenticatedTwoColumnShell
        asideStyle={{ animation: 'discoveryFeedFadeUp 0.5s ease-out both' }}
        aside={
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
              {greeting}, {viewerName}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              Thoughtful introductions from eligible Forge members.
            </p>
            <ForgeDesktopAppNav active="discovery" />
            <div className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Discover
              </p>
              <FilterButton
                count={activeFilterCount}
                onClick={() => setFiltersOpen(true)}
                layout="vertical"
              />
            </div>
          </div>
        }
      >
        <div className="px-0">
          <DiscoveryDesktopTopBar />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-3xl lg:px-0 lg:pb-10 lg:pt-0 xl:max-w-[52rem]">
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
            </div>
            <h1
              className="text-[2.1rem] leading-none tracking-[-0.02em] text-[#0B2D5C] sm:text-[2.45rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {greeting}, {viewerName}
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5A6575] sm:text-base">
              Here are a few thoughtful introductions.
            </p>
          </header>

          <div
            className="mt-6 shrink-0 lg:hidden"
            style={{
              animation: 'discoveryFeedFadeUp 0.55s ease-out both',
              animationDelay: '60ms',
            }}
          >
            <FilterButton
              count={activeFilterCount}
              onClick={() => setFiltersOpen(true)}
              layout="horizontal"
            />
          </div>

          <div className="mt-7 min-h-0 flex-1 lg:mt-0">{feedContent}</div>

        </div>
      </ForgeAuthenticatedTwoColumnShell>

      <ForgeAppBottomNav active="discovery" />
      <DiscoveryFiltersDrawer
        open={filtersOpen}
        profiles={profiles}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
