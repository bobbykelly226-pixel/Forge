import { Fraunces, Manrope } from 'next/font/google';

import CharacterSignalsPrototype from '@/components/character-signals/CharacterSignalsPrototype';
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
  title: 'Character Signals | Forge',
  description:
    'Lightweight profile management for Forge Character Signals — choose which positive qualities appear on your Discovery Profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CharacterSignalsPage() {
  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <CharacterSignalsPrototype />
    </ForgeAppCanvas>
  );
}
