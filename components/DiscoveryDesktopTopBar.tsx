'use client';

import Link from 'next/link';
import { Bell, MessageCircle, UserRound } from 'lucide-react';

import { useNotificationsOptional } from '@/components/notifications/NotificationsProvider';

type DiscoveryDesktopTopBarProps = {
  /** When true, also show the utility controls on mobile (restrained icon row). */
  showOnMobile?: boolean;
};

/**
 * Authenticated utility controls: Messages, Notifications drawer, My Profile.
 * Desktop-first; optionally visible on mobile as a compact icon row.
 */
export default function DiscoveryDesktopTopBar({
  showOnMobile = true,
}: DiscoveryDesktopTopBarProps) {
  const notifications = useNotificationsOptional();
  const messagesUnread = notifications?.messagesUnread ?? false;
  const notificationsUnreadCount = notifications?.notificationsUnreadCount ?? 0;

  const visibility = showOnMobile
    ? 'mb-5 flex items-center justify-end gap-2 lg:mb-8'
    : 'mb-8 hidden items-center justify-end gap-2 lg:flex';

  return (
    <div className={visibility}>
      <Link
        href="/connections?tab=conversations"
        className="relative inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3.5 py-2 text-sm font-medium text-[#0B2D5C] transition hover:border-[#0B2D5C]/22 hover:bg-white"
        aria-label={messagesUnread ? 'Messages, unread' : 'Messages'}
      >
        <span className="relative inline-flex">
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
          {messagesUnread ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="hidden xl:inline">Messages</span>
      </Link>

      <button
        type="button"
        onClick={() => notifications?.openNotifications()}
        className="relative inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3.5 py-2 text-sm font-medium text-[#0B2D5C] transition hover:border-[#0B2D5C]/22 hover:bg-white"
        aria-label={
          notificationsUnreadCount > 0
            ? `Notifications, ${notificationsUnreadCount} unread`
            : 'Notifications'
        }
      >
        <span className="relative inline-flex">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
          {notificationsUnreadCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="hidden xl:inline">Notifications</span>
      </button>

      <Link
        href="/profile"
        className="relative inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3.5 py-2 text-sm font-medium text-[#0B2D5C] transition hover:border-[#0B2D5C]/22 hover:bg-white"
        aria-label="My Profile"
      >
        <UserRound className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden xl:inline">My Profile</span>
      </Link>
    </div>
  );
}
