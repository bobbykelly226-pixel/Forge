'use client';

import { useMemo, useState } from 'react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAuthenticatedTwoColumnShell from '@/components/ForgeAuthenticatedTwoColumnShell';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import {
  EmptyState,
  ForYouOverviewCard,
  MutualConnectionCard,
  OpenToChatRequestCard,
  SavedProfileCard,
  SectionHeading,
  SentActivityCard,
} from '@/components/connections/ConnectionCards';
import ConnectionsTabs from '@/components/connections/ConnectionsTabs';
import { useConnectionsHub } from '@/components/connections/ConnectionsHubProvider';
import ConversationHub from '@/components/conversations/ConversationHub';
import { resetAllSeedState } from '@/lib/seed/actions';

export default function ConnectionsHubPrototype({
  loadError = null,
  seedConnectionsInjected = false,
  showSeedReset = false,
  onResetSeedState,
}: {
  loadError?: string | null;
  /** Preview/local only — seed mutuals were injected into hub data. */
  seedConnectionsInjected?: boolean;
  /** Developer-only reset control (?seed=1). */
  showSeedReset?: boolean;
  onResetSeedState?: () => void;
}) {
  const {
    activeTab,
    openToChat,
    interestReceived,
    mutual,
    saved,
    sent,
    conversations,
    conversationsError,
    getOpenToChatStatus,
    getInterestStatus,
    isSavedRemoved,
    isSentWithdrawn,
  } = useConnectionsHub();
  const [desktopNote, setDesktopNote] = useState<string | null>(null);

  const flashNote = (message: string) => {
    setDesktopNote(message);
    window.setTimeout(() => setDesktopNote(null), 2200);
  };

  const handleResetSeedState = () => {
    if (onResetSeedState) {
      onResetSeedState();
      return;
    }
    resetAllSeedState();
    flashNote('Seed state was reset.');
  };

  const visibleOpenToChat = useMemo(
    () => openToChat.filter((profile) => getOpenToChatStatus(profile.id) !== 'declined'),
    [getOpenToChatStatus, openToChat]
  );

  const visibleInterest = useMemo(
    () =>
      interestReceived.filter((profile) => getInterestStatus(profile.id) === 'pending'),
    [getInterestStatus, interestReceived]
  );

  const visibleMutual = useMemo(() => {
    const base = mutual.filter((profile) => getInterestStatus(profile.id) !== 'declined');
    const newlyMutual = interestReceived.filter(
      (profile) => getInterestStatus(profile.id) === 'mutual'
    );
    const ids = new Set(base.map((p) => p.id));
    return [...base, ...newlyMutual.filter((p) => !ids.has(p.id))];
  }, [getInterestStatus, interestReceived, mutual]);

  const visibleSaved = useMemo(
    () => saved.filter((profile) => !isSavedRemoved(profile.id)),
    [isSavedRemoved, saved]
  );

  const visibleSent = useMemo(
    () => sent.filter((entry) => !isSentWithdrawn(entry.id)),
    [isSentWithdrawn, sent]
  );

  const forYouOpenToChat = visibleOpenToChat
    .filter((profile) => getOpenToChatStatus(profile.id) === 'pending')
    .slice(0, 2);
  const hasForYouContent =
    forYouOpenToChat.length > 0 ||
    visibleInterest.length > 0 ||
    visibleMutual.length > 0;

  const seedResetControl = showSeedReset ? (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={handleResetSeedState}
        className="text-xs text-[#8A93A0] underline-offset-2 transition hover:text-[#5A6575] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
      >
        Reset Seed State
      </button>
    </div>
  ) : null;

  const tabPanels = {
    forYou: (
      <div className="flex flex-col gap-8">
        {!hasForYouContent ? (
          <EmptyState
            title="Nothing needs your attention right now."
            description="We'll let you know when someone expresses interest or opens the door to a conversation."
          />
        ) : (
          <>
            {forYouOpenToChat.length > 0 && (
              <section>
                <SectionHeading>Open to Chat Requests</SectionHeading>
                <div className="flex flex-col gap-4">
                  {forYouOpenToChat.map((profile) => (
                    <ForYouOverviewCard
                      key={profile.id}
                      profile={profile}
                      variant="open_to_chat"
                    />
                  ))}
                </div>
              </section>
            )}
            {visibleInterest.length > 0 && (
              <section>
                <SectionHeading>Interest Received</SectionHeading>
                <div className="flex flex-col gap-4">
                  {visibleInterest.map((profile) => (
                    <ForYouOverviewCard
                      key={profile.id}
                      profile={profile}
                      variant="interest"
                    />
                  ))}
                </div>
              </section>
            )}
            {visibleMutual.length > 0 && (
              <section>
                <SectionHeading>New Mutual Connection</SectionHeading>
                <div className="flex flex-col gap-4">
                  {visibleMutual.map((profile) => (
                    <ForYouOverviewCard
                      key={profile.id}
                      profile={profile}
                      variant="mutual"
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    ),
    openToChat: (
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8">
        {visibleOpenToChat.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyState
              title="No new Open to Chat requests."
              description="When someone opens the door to a conversation, their request will appear here."
            />
          </div>
        ) : (
          visibleOpenToChat.map((profile) => (
            <OpenToChatRequestCard key={profile.id} profile={profile} />
          ))
        )}
      </div>
    ),
    mutual: (
      <div className="flex flex-col gap-6">
        {visibleMutual.length === 0 ? (
          <EmptyState
            title="No mutual connections yet."
            description="Thoughtful introductions take time."
          />
        ) : (
          <>
            {visibleMutual.map((profile) => (
              <MutualConnectionCard key={profile.id} profile={profile} />
            ))}
            {seedResetControl}
          </>
        )}
        {visibleMutual.length === 0 ? seedResetControl : null}
      </div>
    ),
    conversations: (
      <ConversationHub
        initialItems={conversations}
        error={conversationsError}
        seedMode={Boolean(seedConnectionsInjected)}
      />
    ),
    saved: (
      <div className="flex flex-col gap-6">
        <p className="rounded-2xl border border-[#0B2D5C]/08 bg-white/60 px-4 py-3 text-sm text-[#5A6575]">
          Only you can see the profiles you save.
        </p>
        {visibleSaved.length === 0 ? (
          <EmptyState
            title="No saved profiles yet."
            description="Profiles you save privately will appear here."
          />
        ) : (
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
            {visibleSaved.map((profile) => (
              <SavedProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    ),
    sent: (
      <div className="flex flex-col gap-4">
        {visibleSent.length === 0 ? (
          <EmptyState
            title="No recent activity."
            description="Your Interested and Open to Chat activity will appear here."
          />
        ) : (
          visibleSent.map((entry) => <SentActivityCard key={entry.id} entry={entry} />)
        )}
      </div>
    ),
  };

  return (
    <>
      <style>{`
        @keyframes connectionsFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <ForgeAuthenticatedTwoColumnShell
        asideStyle={{ animation: 'connectionsFadeUp 0.5s ease-out both' }}
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
              Connections
            </h1>

            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              Review conversations, mutual interest, and profiles you chose to revisit.
            </p>

            <ForgeDesktopAppNav active="connections" />

            <div className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Sections
              </p>
              <ConnectionsTabs layout="vertical" />
            </div>
          </div>
        }
      >
        <div className="hidden px-0 lg:block">
          <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
          <header
            className="shrink-0 lg:hidden"
            style={{ animation: 'connectionsFadeUp 0.5s ease-out both' }}
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
              Connections
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5A6575] sm:text-base">
              Review conversations, mutual interest, and profiles you chose to revisit.
            </p>
          </header>

          {loadError && (
            <p
              className="mt-4 rounded-2xl border border-[#D62828]/25 bg-[#FBF6EE] px-4 py-3 text-sm text-[#5A6575]"
              role="alert"
            >
              {loadError}
            </p>
          )}

          <div
            className="mt-6 shrink-0 lg:hidden"
            style={{
              animation: 'connectionsFadeUp 0.55s ease-out both',
              animationDelay: '60ms',
            }}
          >
            <ConnectionsTabs layout="horizontal" />
          </div>

          <div
            role="tabpanel"
            id={`connections-panel-${activeTab}`}
            aria-labelledby={`connections-tab-${activeTab}`}
            className="mt-7 min-h-0 flex-1 lg:mt-0"
            style={{
              animation: 'connectionsFadeUp 0.55s ease-out both',
              animationDelay: '80ms',
            }}
          >
            {tabPanels[activeTab]}
          </div>

          {desktopNote && (
            <p
              className="fixed inset-x-4 bottom-[5.75rem] z-30 mx-auto max-w-lg rounded-2xl border border-[#0B2D5C]/10 bg-[#0B2D5C] px-4 py-3 text-center text-sm text-white shadow-[0_12px_32px_rgba(11,45,92,0.25)] lg:bottom-8 lg:left-auto lg:right-8 lg:max-w-sm"
              role="status"
            >
              {desktopNote}
            </p>
          )}
        </div>
      </ForgeAuthenticatedTwoColumnShell>

      <ForgeAppBottomNav active="connections" />
    </>
  );
}
