'use client';

import Link from 'next/link';
import { Compass, Link2, MessageCircle, UserRound } from 'lucide-react';

import { useNotificationsOptional } from '@/components/notifications/NotificationsProvider';

const NAV_ITEMS = [
  { id: 'discovery', label: 'Discovery', href: '/discovery', icon: Compass },
  { id: 'connections', label: 'Connections', href: '/connections', icon: Link2 },
  { id: 'messages', label: 'Messages', href: '/connections?tab=conversations', icon: MessageCircle },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
] as const;

export type ForgeAppNavId = (typeof NAV_ITEMS)[number]['id'];

type ForgeAppBottomNavProps = {
  active?: ForgeAppNavId;
  /** Optional override when provider is unavailable. */
  messagesUnread?: boolean;
};

export default function ForgeAppBottomNav({
  active = 'discovery',
  messagesUnread: messagesUnreadProp,
}: ForgeAppBottomNavProps) {
  const notifications = useNotificationsOptional();
  const messagesUnread = messagesUnreadProp ?? notifications?.messagesUnread ?? false;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0B2D5C]/10 bg-[#FBF9F6]/95 backdrop-blur-md lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          const showUnread = item.id === 'messages' && messagesUnread;
          const className = `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold tracking-wide transition ${
            isActive ? 'text-[#D62828]' : 'text-[#7A8494] hover:text-[#0B2D5C]'
          }`;

          return (
            <Link
              key={item.id}
              href={item.href}
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
      </div>
    </nav>
  );
}
