'use client';

import Link from 'next/link';
import { Compass, Link2, MessageCircle, UserRound } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'discovery', label: 'Discovery', href: '/discovery', icon: Compass },
  { id: 'connections', label: 'Connections', href: '/connections', icon: Link2 },
  {
    id: 'messages',
    label: 'Messages',
    href: '/connections?tab=conversations',
    icon: MessageCircle,
  },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
] as const;

type ForgeDesktopAppNavProps = {
  active: 'discovery' | 'connections' | 'messages' | 'profile' | 'character-signals';
};

export default function ForgeDesktopAppNav({ active }: ForgeDesktopAppNavProps) {
  const resolvedActive = active === 'character-signals' ? 'profile' : active;

  return (
    <nav aria-label="App sections" className="mt-8 border-t border-[#0B2D5C]/08 pt-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
        Navigate
      </p>
      <div className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === resolvedActive;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                isActive
                  ? 'bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.18)]'
                  : 'border border-[#0B2D5C]/10 bg-white/70 text-[#0B2D5C] hover:border-[#0B2D5C]/25 hover:bg-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
