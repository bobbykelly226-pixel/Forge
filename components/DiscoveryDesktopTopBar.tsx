'use client';

import Link from 'next/link';

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
    ? 'mb-5 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:justify-end lg:mb-8'
    : 'mb-8 hidden items-center justify-end gap-2 lg:flex';

  return (
    <div data-profile-chrome="header" className={visibility}>
      <Link
        href="/connections?tab=conversations"
        className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/30 bg-[#0B1C30] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027]"
        aria-label={messagesUnread ? 'Messages, unread' : 'Messages'}
      >
        <span className="relative inline-flex">
          {messagesUnread ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="font-bold">Messages</span>
      </Link>

      <button
        type="button"
        onClick={() => notifications?.openNotifications()}
        className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/30 bg-[#0B1C30] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027]"
        aria-label={
          notificationsUnreadCount > 0
            ? `Notifications, ${notificationsUnreadCount} unread`
            : 'Notifications'
        }
      >
        <span className="relative inline-flex">
          {notificationsUnreadCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="font-bold">Notifications</span>
      </button>

      <Link
        href="/feedback"
        className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/30 bg-[#0B1C30] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027]"
        aria-label="Send Beta Feedback"
      >
        <span className="font-bold">Feedback</span>
      </Link>

      <Link
        href="/profile"
        className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/30 bg-[#0B1C30] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#20364F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C92027]"
        aria-label="My Profile"
      >
        <span className="font-bold">My Profile</span>
      </Link>
    </div>
  );
}
