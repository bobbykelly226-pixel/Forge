'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Compass, Link2, Menu, MessageCircle, MessageSquarePlus, UserRound } from 'lucide-react';

import { useNotificationsOptional } from '@/components/notifications/NotificationsProvider';

const NAV_ITEMS = [
  { id: 'discovery', label: 'Discovery', href: '/discovery', icon: Compass },
  { id: 'connections', label: 'Connections', href: '/connections', icon: Link2 },
  { id: 'messages', label: 'Messages', href: '/connections?tab=conversations', icon: MessageCircle },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
] as const;

export type ForgeAppNavId = (typeof NAV_ITEMS)[number]['id'];

type ForgeAppBottomNavProps = {
  active?: ForgeAppNavId | null;
  /** Optional override when provider is unavailable. */
  messagesUnread?: boolean;
};

export default function ForgeAppBottomNav({
  active = 'discovery',
  messagesUnread: messagesUnreadProp,
}: ForgeAppBottomNavProps) {
  const notifications = useNotificationsOptional();
  const messagesUnread = messagesUnreadProp ?? notifications?.messagesUnread ?? false;
  const notificationsUnreadCount = notifications?.notificationsUnreadCount ?? 0;
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav
      data-profile-chrome="navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0B2D5C]/10 bg-[#FBF9F6]/95 backdrop-blur-md lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {moreOpen ? (
        <div id="forge-mobile-more-menu" className="mx-auto max-w-lg border-b border-[#0B2D5C]/10 px-4 py-3">
          <div className="rounded-2xl border border-[#0B2D5C]/10 bg-white p-2 shadow-[0_-8px_28px_rgba(11,45,92,0.08)]">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                notifications?.openNotifications();
              }}
              disabled={!notifications}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#0B2D5C] hover:bg-[#FBF9F6] disabled:opacity-50"
              aria-label={notificationsUnreadCount > 0 ? `Notifications, ${notificationsUnreadCount} unread` : 'Notifications'}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              Notifications{notificationsUnreadCount > 0 ? ` (${notificationsUnreadCount})` : ''}
            </button>
            <Link
              href="/feedback"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#0B2D5C] hover:bg-[#FBF9F6]"
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
              Beta Feedback
            </Link>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active !== null && item.id === active;
          const Icon = item.icon;
          const showUnread = item.id === 'messages' && messagesUnread;
          const className = `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold tracking-wide transition ${
            isActive ? 'text-[#D62828]' : 'text-[#7A8494] hover:text-[#0B2D5C]'
          }`;

          return (
            <Link
              key={item.id}
              href={item.href}
              onNavigate={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                document.querySelectorAll<HTMLElement>('[data-forge-scroll-region]').forEach((region) => {
                  region.scrollTo({ top: 0, behavior: 'instant' });
                });
              }}
              className={className}
              aria-current={isActive ? 'page' : undefined}
              aria-label={showUnread ? `${item.label}, unread` : item.label}
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                {showUnread ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold tracking-wide transition ${moreOpen ? 'text-[#D62828]' : 'text-[#7A8494] hover:text-[#0B2D5C]'}`}
          aria-expanded={moreOpen}
          aria-controls="forge-mobile-more-menu"
          aria-label={notificationsUnreadCount > 0 ? `More, ${notificationsUnreadCount} unread notifications` : 'More'}
        >
          <span className="relative inline-flex">
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {notificationsUnreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]" aria-hidden="true" /> : null}
          </span>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
