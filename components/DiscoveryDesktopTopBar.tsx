'use client';

type DiscoveryDesktopTopBarProps = {
  onPrototypeAction: (label: string) => void;
};

function MessagesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 6.75A1.75 1.75 0 0 1 6.75 5h10.5A1.75 1.75 0 0 1 19 6.75v7.5A1.75 1.75 0 0 1 17.25 16H10l-4.25 3.25V6.75Z"
      />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.5 1.5 5.5H5s1.5-1.3 1.5-5.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="9" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 18.25c1.4-2.1 3.3-3.15 5.5-3.15s4.1 1.05 5.5 3.15" />
    </svg>
  );
}

const ACTIONS = [
  { id: 'messages', label: 'Messages', icon: MessagesIcon },
  { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
  { id: 'profile', label: 'My Profile', icon: ProfileIcon },
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
            className="inline-flex items-center gap-2 rounded-full border border-[#0B2D5C]/10 bg-white/75 px-3.5 py-2 text-sm font-medium text-[#0B2D5C] transition hover:border-[#0B2D5C]/22 hover:bg-white"
            aria-label={action.label}
          >
            <Icon />
            <span className="hidden xl:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
