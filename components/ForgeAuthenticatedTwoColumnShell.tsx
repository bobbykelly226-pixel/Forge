import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const PANEL_SCROLLBAR =
  '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(11,45,92,0.28)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#0B2D5C]/25 [&::-webkit-scrollbar-track]:bg-transparent';

type ForgeAuthenticatedTwoColumnShellProps = {
  aside: ReactNode;
  children: ReactNode;
  /**
   * Wider desktop max-width used by Profile / Character Signals (1440)
   * vs Discovery / Connections (1360).
   */
  wide?: boolean;
  asideStyle?: CSSProperties;
  className?: string;
};

/**
 * Shared authenticated app shell for Discovery, Connections, and sibling hubs.
 *
 * Desktop (lg+): fills the viewport-locked ForgeAppCanvas; sidebar and main
 * scroll independently so nav items stay reachable while the feed scrolls.
 * Mobile: document flow with the sidebar hidden (bottom nav unchanged).
 */
export default function ForgeAuthenticatedTwoColumnShell({
  aside,
  children,
  wide = false,
  asideStyle,
  className,
}: ForgeAuthenticatedTwoColumnShellProps) {
  return (
    <div
      className={cn(
        'mx-auto min-h-screen w-full lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-8',
        wide
          ? 'lg:max-w-[1280px] xl:max-w-[1440px] xl:px-10'
          : 'lg:max-w-[1280px] xl:max-w-[1360px] xl:px-10',
        className
      )}
    >
      <div className="lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-stretch lg:gap-10 lg:overflow-hidden xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
        <aside
          className={cn(
            'hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain',
            PANEL_SCROLLBAR
          )}
          style={asideStyle}
        >
          {aside}
        </aside>

        <div
          className={cn(
            'min-h-screen w-full min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain',
            PANEL_SCROLLBAR
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
