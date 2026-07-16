import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ForgeAppCanvasProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Desktop: lock the canvas to the viewport so nested shell regions
   * (sidebar + main) scroll independently. Mobile keeps document scroll.
   * Use on authenticated two-column hubs (Discovery, Connections, Profile).
   */
  desktopViewportLock?: boolean;
};

/**
 * Permanent Forge application canvas.
 * Soft Slate (#E8EBF0) via --forge-app-background.
 * Use only on authenticated app shell routes — not marketing pages.
 */
export default function ForgeAppCanvas({
  children,
  className = '',
  style,
  desktopViewportLock = false,
}: ForgeAppCanvasProps) {
  return (
    <div
      className={cn(
        'forge-app-canvas min-h-screen text-[#1A2332]',
        desktopViewportLock && 'lg:h-dvh lg:min-h-0 lg:overflow-hidden',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
