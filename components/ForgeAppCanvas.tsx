import type { CSSProperties, ReactNode } from 'react';

type ForgeAppCanvasProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
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
}: ForgeAppCanvasProps) {
  return (
    <div className={`forge-app-canvas min-h-screen text-[#1A2332] ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
