'use client';

import type { ReactNode } from 'react';

import ForgeThemeLabControl from '@/components/theme-lab/ForgeThemeLabControl';
import {
  ForgeThemeLabProvider,
  forgeAppCanvasFallbackStyle,
} from '@/components/theme-lab/ForgeThemeLabProvider';

type ForgeAppCanvasClientProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function ForgeAppCanvasClient({
  children,
  className = '',
  style,
}: ForgeAppCanvasClientProps) {
  return (
    <ForgeThemeLabProvider>
      <div
        className={className}
        style={{
          ...forgeAppCanvasFallbackStyle,
          ...style,
        }}
        data-forge-app-canvas=""
      >
        {children}
        <ForgeThemeLabControl />
      </div>
    </ForgeThemeLabProvider>
  );
}
