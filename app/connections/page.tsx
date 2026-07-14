import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import { loadConnectionsHubAction } from '@/app/actions/relationships';
import ConnectionsHubPrototype from '@/components/connections/ConnectionsHubPrototype';
import { ConnectionsHubProvider } from '@/components/connections/ConnectionsHubProvider';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { createClient } from '@/lib/supabase/server';
import type { ConnectionsHubData } from '@/lib/data/connections-hub';

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
  title: 'Connections | Forge',
  description:
    'Review Open to Chat requests, mutual interest, and profiles you saved on Forge.',
  robots: {
    index: false,
    follow: false,
  },
};

const EMPTY_HUB: ConnectionsHubData = {
  viewerFirstName: 'there',
  openToChat: [],
  interestReceived: [],
  mutual: [],
  saved: [],
  sent: [],
  educationSeen: false,
  tabCounts: {
    forYou: 0,
    openToChat: 0,
    mutual: 0,
    saved: 0,
    sent: 0,
  },
};

export default async function ConnectionsHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/connections');
  }

  const result = await loadConnectionsHubAction();
  const initialData = result.success ? result.data : EMPTY_HUB;
  const loadError = result.success ? null : result.message;

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <ConnectionsHubProvider initialData={initialData}>
        <ConnectionsHubPrototype loadError={loadError} />
      </ConnectionsHubProvider>
    </ForgeAppCanvas>
  );
}
