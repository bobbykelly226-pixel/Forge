'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

import {
  useConnectionsHub,
  type ConnectionsTabId,
} from '@/components/connections/ConnectionsHubProvider';

const TAB_DEFS: { id: ConnectionsTabId; label: string; description: string }[] = [
  { id: 'forYou', label: 'Overview', description: 'A summary of incoming interest, chat requests, and people you have connected with.' },
  { id: 'openToChat', label: 'Chat Requests', description: 'People who invited you to chat. Review a request and decide whether to connect.' },
  { id: 'interestedInYou', label: 'Interested in You', description: 'People who expressed interest in you. Decide whether you are interested too.' },
  { id: 'mutual', label: 'Connected', description: 'You both chose to connect through mutual interest or an accepted chat request. Start or continue a conversation.' },
  { id: 'conversations', label: 'Messages', description: 'Your conversations and message history.' },
  { id: 'saved', label: 'Saved', description: 'Profiles you saved privately to revisit. Saving does not send interest or a chat request.' },
  { id: 'sent', label: 'Sent by You', description: 'Interest and chat requests you have sent to other people.' },
];

export function ConnectionsSectionIntro() {
  const { activeTab } = useConnectionsHub();
  const tab = TAB_DEFS.find(item => item.id === activeTab);
  if (!tab) return null;
  return (
    <header className="mb-5">
      <h2 className="text-xl font-semibold text-[#0B2D5C]">{tab.label}</h2>
      <p className="mt-2 text-sm leading-6 text-black">{tab.description}</p>
    </header>
  );
}

type ConnectionsTabsProps = {
  layout?: 'horizontal' | 'vertical';
};

export default function ConnectionsTabs({ layout = 'horizontal' }: ConnectionsTabsProps) {
  const { activeTab, setActiveTab, tabCounts } = useConnectionsHub();
  const tabListRef = useRef<HTMLDivElement>(null);

  const tabs = TAB_DEFS.map((tab) => ({
    ...tab,
    count: tabCounts[tab.id],
  }));

  const selectTab = setActiveTab;

  const focusTab = useCallback((tabId: ConnectionsTabId) => {
    const button = tabListRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${tabId}"]`
    );
    button?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      const nextTab = tabs[nextIndex];
      selectTab(nextTab.id);
      focusTab(nextTab.id);
    },
    [activeTab, focusTab, selectTab, tabs]
  );

  const isVertical = layout === 'vertical';

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Connections sections"
      onKeyDown={handleKeyDown}
      className={
        isVertical
          ? 'flex flex-col gap-2'
          : 'scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      }
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`connections-tab-${tab.id}`}
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls={`connections-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            className={
              isVertical
                ? `inline-flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                    isActive
                      ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                      : 'border border-[#0B2D5C]/10 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25 hover:bg-white'
                  }`
                : `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                    isActive
                      ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                      : 'border border-[#0B2D5C]/12 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25'
                  }`
            }
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[#E8EEF6] text-[#0B2D5C]'
              }`}
              aria-label={`${tab.count} items`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
