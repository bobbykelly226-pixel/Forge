import { notFound, redirect } from 'next/navigation';

import { isInternalDemoAccessAllowed } from '@/lib/demo/demo-access';

export const dynamic = 'force-dynamic';

/**
 * Retired custom showcase. Redirect into the real Connections experience
 * with sample injection enabled for preview/local.
 */
export default function RetiredDemoConnectionsRedirect() {
  if (!isInternalDemoAccessAllowed()) {
    notFound();
  }

  redirect('/connections?demo=1');
}
