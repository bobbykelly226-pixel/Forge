'use client';

import { useRef, type KeyboardEvent } from 'react';
import { useConnectionsHub, type ConnectionsTabId } from '@/components/connections/ConnectionsHubProvider';

const TABS: { id: ConnectionsTabId; label: string }[] = [
  { id: 'mutual', label: 'Connected' },
  { id: 'interestedInYou', label: 'Interested' },
  { id: 'conversations', label: 'Messages' },
  { id: 'saved', label: 'Saved' },
];

export default function ConnectionsTabs({ layout = 'horizontal' }: { layout?: 'horizontal' | 'vertical' }) {
  const { activeTab, setActiveTab, tabCounts, openToChat, getOpenToChatStatus } = useConnectionsHub();
  const tabListRef = useRef<HTMLDivElement>(null);
  const requests = openToChat.filter(profile => ['pending', 'saved_later'].includes(getOpenToChatStatus(profile.id))).length;
  const isVertical = layout === 'vertical';
  const activeIndex = TABS.findIndex(tab => tab.id === activeTab);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = Math.max(0, activeIndex);
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else if (event.key === (isVertical ? 'ArrowDown' : 'ArrowRight')) next = (current + 1) % TABS.length;
    else if (event.key === (isVertical ? 'ArrowUp' : 'ArrowLeft')) next = (current + TABS.length - 1) % TABS.length;
    else return;
    event.preventDefault();
    setActiveTab(TABS[next].id);
    tabListRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${TABS[next].id}"]`)?.focus();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        {requests > 0 ? (
          <button data-text-link type="button" onClick={() => setActiveTab('openToChat')} className="text-sm font-semibold">
            Chat requests · {requests}
          </button>
        ) : <span />}
        <details className="relative ml-auto">
          <summary className="cursor-pointer py-2 text-sm text-[#0B2D5C]" aria-label="More connection options">More</summary>
          <button data-text-link type="button" className="mt-2 block text-sm" onClick={event => {
            setActiveTab('sent');
            event.currentTarget.closest('details')?.removeAttribute('open');
          }}>Sent activity</button>
        </details>
      </div>
      <div ref={tabListRef} role="tablist" aria-label="Connections sections"
        aria-orientation={isVertical ? 'vertical' : 'horizontal'}
        onKeyDown={handleKeyDown}
        data-connection-tabs
        className={isVertical ? 'flex flex-col gap-2' : 'grid grid-cols-4 gap-1'}>
        {TABS.map((tab, index) => (
          <button key={tab.id} type="button" role="tab"
            id={`connections-tab-${layout}-${tab.id}`}
            data-tab-id={tab.id} aria-selected={activeTab === tab.id}
            aria-controls={activeTab === tab.id ? `connections-panel-${tab.id}` : undefined}
            tabIndex={activeTab === tab.id || (activeIndex < 0 && index === 0) ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027]">
            <span>{tab.label}</span>
            {(tabCounts[tab.id] ?? 0) > 0 ? <span className="text-xs" aria-label={`${tabCounts[tab.id]} items`}>{tabCounts[tab.id]}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
