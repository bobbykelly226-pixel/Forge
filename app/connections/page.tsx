import { Fraunces, Manrope } from 'next/font/google';

import ConnectionsHubPrototype from '@/components/connections/ConnectionsHubPrototype';
import ForgeAppCanvas from '@/components/theme-lab/ForgeAppCanvas';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-discovery-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-discovery-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Connections Hub Prototype | Forge',
  description:
    'Design prototype for the Forge Connections Hub — manage conversations, mutual interest, and saved profiles. Layout only — no messaging or persistent data.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnectionsHubPage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable} min-h-screen text-[#1A2332]`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <ConnectionsHubPrototype />
    </ForgeAppCanvas>
  );
}
