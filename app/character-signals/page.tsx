import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import CharacterSignalsWorkspace from '@/components/character-signals/CharacterSignalsPrototype';
import { CharacterSignalsProvider } from '@/components/character-signals/CharacterSignalsProvider';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import NotificationsProvider from '@/components/notifications/NotificationsProvider';
import { loadMyCharacterSignals } from '@/lib/data/character-signals';
import { createClient } from '@/lib/supabase/server';

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

export default async function CharacterSignalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/character-signals');
  const dashboard = await loadMyCharacterSignals();

  return (
    <ForgeAppCanvas
      desktopViewportLock
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <NotificationsProvider>
        <CharacterSignalsProvider initialData={dashboard}>
          <CharacterSignalsWorkspace />
        </CharacterSignalsProvider>
      </NotificationsProvider>
    </ForgeAppCanvas>
  );
}
