'use client';

import Link from 'next/link';
import { Compass, Link2, MessageCircle, UserRound } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'discovery', label: 'Discovery', href: '/discovery', icon: Compass },
  { id: 'connections', label: 'Connections', href: '/connections', icon: Link2 },
  { id: 'messages', label: 'Messages', href: '#messages', icon: MessageCircle },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
] as const;

export type ForgeAppNavId = (typeof NAV_ITEMS)[number]['id'];

type ForgeAppBottomNavProps = {
  active?: ForgeAppNavId;
};

export default function ForgeAppBottomNav({ active = 'discovery' }: ForgeAppBottomNavProps) {
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
          const className = `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold tracking-wide transition ${
            isActive ? 'text-[#D62828]' : 'text-[#7A8494] hover:text-[#0B2D5C]'
          }`;

          if (item.href.startsWith('#')) {
            return (
              <button
                key={item.id}
                type="button"
                className={className}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => event.preventDefault()}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={className}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <p className="pb-1 text-center text-[10px] tracking-wide text-[#8A93A0]">
        Prototype navigation — Messages is a placeholder
      </p>
    </nav>
  );
}
