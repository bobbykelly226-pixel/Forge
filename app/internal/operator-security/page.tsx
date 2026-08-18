import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import OperatorMfaWorkspace from '@/components/operator/OperatorMfaWorkspace';
import type { OperatorMfaScreenState } from '@/components/operator/OperatorMfaWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
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

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Founder Account Security | Forge',
  description: 'Private Forge operator multi-factor authentication.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OperatorSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/internal/operator-security');
  }

  if (!isForgeOperatorUser(user)) {
    notFound();
  }

  const mfa = await getOperatorMfaState(supabase);
  const initialScreen: OperatorMfaScreenState =
    mfa.status === 'challenge-required'
      ? 'challenge'
      : mfa.status === 'verified'
        ? 'verified'
        : mfa.status === 'not-enrolled'
          ? 'not-enrolled'
          : 'unavailable';
  const params = await searchParams;

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <OperatorMfaWorkspace
        email={user.email ?? 'operator account'}
        redirectTo={params.redirectTo ?? '/internal/photo-moderation'}
        initialScreen={initialScreen}
        initialError={mfa.status === 'unavailable' ? mfa.message : null}
      />
    </ForgeAppCanvas>
  );
}
