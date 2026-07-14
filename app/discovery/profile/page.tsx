import { Fraunces, Manrope } from 'next/font/google';

import DiscoveryProfilePrototype from '@/components/DiscoveryProfilePrototype';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';

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
  title: 'Discovery Profile Prototype | Forge',
  description:
    'Design prototype for the future Forge Discovery Profile experience. Layout and hierarchy only — no matching or messaging.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiscoveryProfilePrototypePage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DiscoveryProfilePrototype />
    </ForgeAppCanvas>
  );
}
