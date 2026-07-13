import { Fraunces, Manrope } from 'next/font/google';

import CharacterSignalsPrototype from '@/components/character-signals/CharacterSignalsPrototype';
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
  title: 'Character Signals Prototype | Forge',
  description:
    'Design prototype for Forge Character Signals — positive recognitions from meaningful interactions. Layout only — no reviews, ratings, or persistent data.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CharacterSignalsPage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable} min-h-screen text-[#1A2332]`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <CharacterSignalsPrototype />
    </ForgeAppCanvas>
  );
}
