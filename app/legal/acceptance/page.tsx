import { redirect } from 'next/navigation';

import LegalAcceptanceForm from '@/components/legal/LegalAcceptanceForm';
import { loadCurrentLegalAcceptance } from '@/lib/data/legal-acceptance';
import { sanitizeInternalPath } from '@/lib/auth/messages';
import { createClient } from '@/lib/supabase/server';

export default async function LegalAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
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
  return (
    <main className="min-h-screen bg-[#A9ADB3] px-4 py-8 text-black sm:px-6 sm:py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#0B2D5C] bg-[#E6E6E7] p-5 shadow-[0_10px_28px_rgba(11,45,92,0.12)] sm:p-8">
        <div className="border-b border-[#C9CBCE] pb-6">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-[#C92027]">
            Forge agreements
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0B2D5C] sm:text-4xl">
            Review your agreements
          </h1>
          <p className="mt-3 text-base leading-7 text-black sm:text-lg">
            Open each document and accept it at the bottom to continue.
          </p>
        </div>

        {status.unavailable ? (
          <div className="mt-6 rounded-md border border-[#C92027] bg-[#F7F7F7] p-5 text-black" role="alert">
            {status.message}
          </div>
        ) : (
          <div className="mt-6">
            <LegalAcceptanceForm
              redirectTo={redirectTo}
              initialAcceptedKeys={status.acceptedKeys}
            />
          </div>
        )}
      </section>
    </main>
  );
}
