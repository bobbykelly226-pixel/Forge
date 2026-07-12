'use client';

import { Bell, ChevronDown, MessageCircle, UserRound } from 'lucide-react';

type DiscoveryDesktopTopBarProps = {
  onPrototypeAction: (label: string) => void;
};

const ACTIONS = [
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageCircle,
    showBadge: false,
    showChevron: false,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    showBadge: true,
    showChevron: false,
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: UserRound,
    showBadge: false,
    showChevron: true,
  },
] as const;

/**
 * Desktop-only top utility bar for Discovery Feed.
 * Hidden below the lg breakpoint so mobile layout is untouched.
 */
export default function DiscoveryDesktopTopBar({ onPrototypeAction }: DiscoveryDesktopTopBarProps) {
  return (
    <div className="mb-8 hidden items-center justify-end gap-2 lg:flex">
      <p className="mr-3 rounded-full border border-[#0B2D5C]/10 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]/60">
        Prototype
      </p>
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() =>
              onPrototypeAction(`Prototype only — ${action.label} is not connected yet.`)
            }
            className="relative inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3.5 py-2 text-sm font-medium text-[#0B2D5C] transition hover:border-[#0B2D5C]/22 hover:bg-white"
            aria-label={action.label}
          >
            <span className="relative inline-flex">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {action.showBadge && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D62828]"
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="hidden xl:inline">{action.label}</span>
            {action.showChevron && (
              <ChevronDown className="hidden h-3.5 w-3.5 xl:inline" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
