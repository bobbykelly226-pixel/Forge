import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import AccountLifecyclePanel from '@/components/profile/AccountLifecyclePanel';
import { loadMyAccountLifecycle } from '@/lib/account/lifecycle';
import { createClient } from '@/lib/supabase/server';

const display = Fraunces({ subsets: ['latin'], variable: '--font-discovery-display', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-discovery-sans', display: 'swap' });

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Account & Privacy | Forge',
  description: 'Manage your Forge account, privacy, export, and deletion choices.',
  robots: { index: false, follow: false },
};

export default async function AccountPrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/profile/account');
  const result = await loadMyAccountLifecycle();

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      <AccountLifecyclePanel
        email={user.email ?? ''}
        lifecycle={result.success ? result.data : null}
        loadError={result.success ? null : result.message}
      />
    </ForgeAppCanvas>
  );
}
