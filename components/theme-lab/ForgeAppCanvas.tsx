import type { CSSProperties, ReactNode } from 'react';

import ForgeAppCanvasClient from '@/components/theme-lab/ForgeAppCanvasClient';
import { FORGE_THEME_LAB_BOOTSTRAP_SCRIPT } from '@/lib/forge-theme-lab';

type ForgeAppCanvasProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Shared application canvas for prototype app routes.
 * Background comes only from --forge-app-background (Theme Lab).
 * Temporary — remove after a permanent theme is chosen.
 */
export default function ForgeAppCanvas({ children, className = '', style }: ForgeAppCanvasProps) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: FORGE_THEME_LAB_BOOTSTRAP_SCRIPT }}
      />
      <ForgeAppCanvasClient className={className} style={style}>
        {children}
      </ForgeAppCanvasClient>
    </>
  );
}
