import { Fraunces, Manrope } from 'next/font/google';

import CharacterSignalsPrototype from '@/components/character-signals/CharacterSignalsPrototype';

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
    <div
      className={`${display.variable} ${sans.variable} min-h-screen text-[#1A2332]`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        background:
          'radial-gradient(ellipse 120% 80% at 50% -10%, #E8EEF6 0%, #F4F1EC 42%, #EFEAE3 100%)',
      }}
    >
      <CharacterSignalsPrototype />
    </div>
  );
}
