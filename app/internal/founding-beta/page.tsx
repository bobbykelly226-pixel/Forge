import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import FoundingBetaWorkspace from '@/components/operator/FoundingBetaWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { loadFoundingBetaRequests } from '@/lib/operator/founding-beta';
import { createClient } from '@/lib/supabase/server';

const display = Fraunces({ subsets: ['latin'], variable: '--font-discovery-display', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-discovery-sans', display: 'swap' });

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Founding Beta Requests | Forge', robots: { index: false, follow: false } };

export default async function FoundingBetaAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/internal/founding-beta');
  if (!isForgeOperatorUser(user)) notFound();
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') redirect('/internal/operator-security?redirectTo=/internal/founding-beta');

  const queue = await loadFoundingBetaRequests();
  return (
    <ForgeAppCanvas className={`${display.variable} ${sans.variable}`} style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}>
      <FoundingBetaWorkspace requests={queue.success ? queue.data : []} loadError={queue.success ? null : queue.message} />
    </ForgeAppCanvas>
  );
}
