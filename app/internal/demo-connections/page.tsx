import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import DemoConnectionsHub from '@/components/demo/DemoConnectionsHub';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { isInternalDemoAccessAllowed } from '@/lib/demo/demo-access';
import { getDemoConnections } from '@/lib/demo/demo-connections';
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
  title: 'Demo Connections | Forge',
  description:
    'Private demonstration of Forge Connections and compatibility language using local fixtures.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function DemoConnectionsPage() {
  if (!isInternalDemoAccessAllowed()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/internal/demo-connections');
  }

  const connections = [...getDemoConnections()];

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DemoConnectionsHub connections={connections} />
    </ForgeAppCanvas>
  );
}
