import { notFound, redirect } from 'next/navigation';

import { isBetaSeedAccessAllowed } from '@/lib/seed/access';

export const dynamic = 'force-dynamic';

/**
 * Retired internal route. Redirects into Connections with seed injection
 * forced for allowed preview/local environments.
 */
export default function RetiredDemoConnectionsRedirect() {
  if (!isBetaSeedAccessAllowed()) {
    notFound();
  }

  redirect('/connections?seed=1');
}
