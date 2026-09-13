import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import BetaEnrollmentWorkspace from '@/components/operator/BetaEnrollmentWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { loadBetaEnrollmentDashboard } from '@/lib/operator/beta-enrollment';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';

const display = Fraunces({ subsets: ['latin'], variable: '--font-discovery-display', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-discovery-sans', display: 'swap' });

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Founding Beta Enrollment | Forge', robots: { index: false, follow: false } };

export default async function BetaEnrollmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/internal/beta-enrollment');
  if (!isForgeOperatorUser(user)) notFound();
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') redirect('/internal/operator-security?redirectTo=/internal/beta-enrollment');
  const dashboard = await loadBetaEnrollmentDashboard();

  return (
    <ForgeAppCanvas className={`${display.variable} ${sans.variable}`} style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}>
      <BetaEnrollmentWorkspace dashboard={dashboard.success ? dashboard.data : null} loadError={dashboard.success ? null : dashboard.message} />
    </ForgeAppCanvas>
  );
}
