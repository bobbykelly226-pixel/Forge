'use client';

import Link from 'next/link';
import { Bell, MessageCircle, MessageSquarePlus, UserRound } from 'lucide-react';

import { useNotificationsOptional } from '@/components/notifications/NotificationsProvider';

type DiscoveryDesktopTopBarProps = {
  /** When true, also show the utility controls on mobile (readable text controls). */
  showOnMobile?: boolean;
};

/**
 * Authenticated utility controls: Messages, Notifications drawer, My Profile.
 * Desktop-first; optionally visible on mobile as a compact text controls.
 */
export default function DiscoveryDesktopTopBar({
  showOnMobile = true,
}: DiscoveryDesktopTopBarProps) {
  const notifications = useNotificationsOptional();
  const messagesUnread = notifications?.messagesUnread ?? false;
  const notificationsUnreadCount = notifications?.notificationsUnreadCount ?? 0;

  const visibility = showOnMobile
    ? 'forge-header-nav mb-5 grid grid-cols-4 items-stretch gap-1 bg-[#0B1C30] px-2 py-3 lg:mb-8'
    : 'forge-header-nav mb-8 hidden grid-cols-4 items-stretch gap-1 bg-[#0B1C30] px-2 py-3 lg:grid';

  return (
    <div data-profile-chrome="header" className={visibility}>
      <Link
        href="/connections?tab=conversations"
        className="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027] sm:text-sm"
        aria-label={messagesUnread ? 'Messages, unread' : 'Messages'}
      >
        <span className="relative inline-flex">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          {messagesUnread ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="font-semibold">Messages</span>
      </Link>

      <button
        type="button"
        onClick={() => notifications?.openNotifications()}
        className="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027] sm:text-sm"
        aria-label={
          notificationsUnreadCount > 0
            ? `Notifications, ${notificationsUnreadCount} unread`
            : 'Notifications'
        }
      >
        <span className="relative inline-flex">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificationsUnreadCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="font-semibold">Notifications</span>
      </button>

      <Link
        href="/feedback"
        className="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027] sm:text-sm"
        aria-label="Send Beta Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
        <span>Feedback</span>
      </Link>

      <Link
        href="/profile"
        className="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027] sm:text-sm"
        aria-label="My Profile"
      >
        <UserRound className="h-5 w-5" aria-hidden="true" />
        <span>My Profile</span>
      </Link>
    </div>
  );
}
