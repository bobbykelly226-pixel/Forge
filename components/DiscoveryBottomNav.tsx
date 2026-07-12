'use client';

import Link from 'next/link';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/', icon: HomeIcon },
  { id: 'discovery', label: 'Discovery', href: '/discovery', icon: DiscoveryIcon },
  { id: 'messages', label: 'Messages', href: '#messages', icon: MessagesIcon },
  { id: 'profile', label: 'Profile', href: '#profile', icon: ProfileIcon },
] as const;

type DiscoveryBottomNavProps = {
  active?: (typeof NAV_ITEMS)[number]['id'];
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5 12 4l7.5 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-4V21H5.5a1 1 0 0 1-1-1v-9.5Z"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function DiscoveryIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.25" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 9.5-1.2 4.3-4.3 1.2 1.2-4.3 4.3-1.2Z" />
    </svg>
  );
}

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 6.75A1.75 1.75 0 0 1 6.75 5h10.5A1.75 1.75 0 0 1 19 6.75v7.5A1.75 1.75 0 0 1 17.25 16H10l-4.25 3.25V6.75Z"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="3.25" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 18.25c1.4-2.1 3.3-3.15 5.5-3.15s4.1 1.05 5.5 3.15"
      />
    </svg>
  );
}

export default function DiscoveryBottomNav({ active = 'discovery' }: DiscoveryBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0B2D5C]/10 bg-[#FBF9F6]/95 backdrop-blur-md"
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
                <Icon active={isActive} />
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
              <Icon active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <p className="pb-1 text-center text-[10px] tracking-wide text-[#8A93A0]">
        Prototype navigation — Messages and Profile are placeholders
      </p>
    </nav>
  );
}
