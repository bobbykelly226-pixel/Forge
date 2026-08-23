import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import AccountGovernanceWorkspace from '@/components/operator/AccountGovernanceWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { loadAccountGovernanceByEmail } from '@/lib/operator/account-governance';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';

const display = Fraunces({ subsets: ['latin'], variable: '--font-discovery-display', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-discovery-sans', display: 'swap' });
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account Governance | Forge', robots: { index: false, follow: false } };

export default async function AccountGovernancePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/internal/account-governance');
  if (!isForgeOperatorUser(user)) notFound();
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') redirect('/internal/operator-security?redirectTo=/internal/account-governance');
  const email = (await searchParams).email ?? '';
  const result = await loadAccountGovernanceByEmail(email);
  return (
    <ForgeAppCanvas className={`${display.variable} ${sans.variable}`} style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}>
      <AccountGovernanceWorkspace email={email} record={result.success ? result.data : null} error={result.success ? null : result.message} />
    </ForgeAppCanvas>
  );
}
