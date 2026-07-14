import { Fraunces, Manrope } from 'next/font/google';

import DiscoveryFeedPrototype from '@/components/DiscoveryFeedPrototype';
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
  title: 'Discovery Feed Prototype | Forge',
  description:
    'Design prototype for the Forge Discovery Feed — thoughtful introductions, not endless swiping. Layout only — no matching or messaging.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiscoveryFeedPrototypePage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DiscoveryFeedPrototype />
    </ForgeAppCanvas>
  );
}
