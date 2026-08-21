import { redirect } from 'next/navigation';

import LegalAcceptanceForm from '@/components/legal/LegalAcceptanceForm';
import { loadCurrentLegalAcceptance } from '@/lib/data/legal-acceptance';
import { sanitizeInternalPath } from '@/lib/auth/messages';
import { createClient } from '@/lib/supabase/server';

export default async function LegalAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const requested = sanitizeInternalPath(params.redirectTo) ?? '/app';
  const redirectTo = requested.startsWith('/legal/acceptance') ? '/app' : requested;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/legal/acceptance?redirectTo=${redirectTo}`)}`);
  }

  const status = await loadCurrentLegalAcceptance();
  if (status.accepted) {
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-12 text-[#222222] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#D62828]">
          Required before continuing
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">
          Review Forge&apos;s current agreements
        </h1>
        <p className="mb-8 mt-4 text-lg leading-8 text-[#444444]">
          Forge records the exact version and time of each acceptance. If a material
          version changes later, you will be asked to review and accept it again.
        </p>

        {status.unavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">
            {status.message}
          </div>
        ) : (
          <LegalAcceptanceForm redirectTo={redirectTo} />
        )}
      </div>
    </main>
  );
}
