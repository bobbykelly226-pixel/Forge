import { Fraunces, Manrope } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import ReportReviewWorkspace from '@/components/operator/ReportReviewWorkspace';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { loadOperatorReportReview } from '@/lib/operator/report-review';
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
  title: 'Report Review | Forge',
  description: 'Private operator review for Forge safety reports.',
  robots: { index: false, follow: false },
};

export default async function ReportReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/internal/report-review');
  }
  if (!isForgeOperatorUser(user)) {
    notFound();
  }

  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') {
    redirect('/internal/operator-security?redirectTo=/internal/report-review');
  }

  const params = await searchParams;
  const result = await loadOperatorReportReview(params.case);

  return (
    <ForgeAppCanvas
      className={`${display.variable} ${sans.variable}`}
      style={{ fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      <ReportReviewWorkspace
        data={result.success ? result.data : null}
        loadError={result.success ? null : result.message}
      />
    </ForgeAppCanvas>
  );
}
