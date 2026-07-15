import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import DemoDetailChrome from '@/components/demo/DemoDetailChrome';
import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import { isInternalDemoAccessAllowed } from '@/lib/demo/demo-access';
import {
  DEMO_CONNECTIONS_ROUTE,
  getDemoConnectionById,
} from '@/lib/demo/demo-connections';
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
  title: 'Demo Compatibility | Forge',
  description: 'Private demonstration compatibility detail for a demo connection.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function DemoConnectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isInternalDemoAccessAllowed()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { id } = await params;
    redirect(`/login?redirectTo=${DEMO_CONNECTIONS_ROUTE}/${id}`);
  }

  const { id } = await params;
  const connection = getDemoConnectionById(id);
  if (!connection) {
    notFound();
  }

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <DemoDetailChrome connection={connection} />
    </ForgeAppCanvas>
  );
}
