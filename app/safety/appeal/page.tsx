import Link from 'next/link';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import SafetyAppealForm from '@/components/safety/SafetyAppealForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Safety Appeal | Forge',
  robots: { index: false, follow: false },
};

export default async function SafetyAppealPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const params = await searchParams;
  const reportId = params.report?.trim() ?? '';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const destination = reportId ? `/safety/appeal?report=${encodeURIComponent(reportId)}` : '/safety/appeal';
    redirect(`/login?redirectTo=${encodeURIComponent(destination)}`);
  }

  return (
    <ForgeAppCanvas>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]">Forge safety</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#0B2D5C]">Request a decision review</h1>
        <p className="mt-4 text-base leading-relaxed text-[#5A6575]">Appeals are reviewed with the original report, preserved evidence, and operator history. Submitting an appeal does not automatically reverse an action.</p>
        {reportId ? (
          <SafetyAppealForm reportId={reportId} />
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-[#B42318]/20 bg-[#FFF5F4] p-6 text-sm text-[#9B1C1C]">This appeal link is missing its report reference. Use the complete link from the Forge safety email.</div>
        )}
        <Link href="/profile" className="mt-6 inline-flex text-sm font-semibold text-[#0B2D5C] hover:underline">Return to My Profile</Link>
      </main>
    </ForgeAppCanvas>
  );
}
