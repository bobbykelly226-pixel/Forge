import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import { loadConnectionsHubAction } from '@/app/actions/relationships';
import ConnectionsHubPrototype from '@/components/connections/ConnectionsHubPrototype';
import { ConnectionsHubProvider } from '@/components/connections/ConnectionsHubProvider';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { parseSeedQueryParam } from '@/lib/seed/access';
import {
  countRealMutualConnections,
  injectSeedConnections,
  shouldInjectSeedConnectionsForRequest,
} from '@/lib/seed/inject-connections';
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

export default async function ConnectionsHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ seed?: string; demo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/connections');
  }

  const result = await loadConnectionsHubAction();
  let initialData = result.success ? result.data : EMPTY_HUB;
  const loadError = result.success ? null : result.message;

  const params = searchParams ? await searchParams : {};
  const seedFlags = parseSeedQueryParam(params.seed);
  const forceSeed = seedFlags.forceSeed || params.demo === '1';
  const realMutualCount = countRealMutualConnections(initialData);
  const shouldInject = shouldInjectSeedConnectionsForRequest({
    realMutualCount,
    forceSeed,
    disableSeed: seedFlags.disableSeed,
  });

  let seedConnectionsInjected = false;
  if (shouldInject) {
    initialData = injectSeedConnections(initialData);
    seedConnectionsInjected = true;
  }

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <ConnectionsHubProvider initialData={initialData}>
        <ConnectionsHubPrototype
          loadError={loadError}
          seedConnectionsInjected={seedConnectionsInjected}
          showSeedReset={seedFlags.showReset}
        />
      </ConnectionsHubProvider>
    </ForgeAppCanvas>
  );
}
