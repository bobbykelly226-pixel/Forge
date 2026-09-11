'use client';

import { acceptCurrentLegalDocument } from '@/app/actions/legal-acceptance';
import { getLegalDocument, type LegalDocumentKey } from '@/lib/legal/documents';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function safeAgreementReturnPath(value: string | null): string | null {
  if (!value) return null;

  try {
    const base = new URL('https://forge.local');
    const candidate = new URL(value, base);
    if (candidate.origin !== base.origin || candidate.pathname !== '/legal/acceptance') {
      return null;
    }
    return `${candidate.pathname}${candidate.search}`;
  } catch {
    return null;
  }
}

function AcceptanceAction({ documentKey }: { documentKey: LegalDocumentKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeAgreementReturnPath(searchParams.get('returnTo'));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!returnTo) return null;

  const document = getLegalDocument(documentKey);

  const accept = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await acceptCurrentLegalDocument(documentKey);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError('Forge could not record your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 rounded-3xl border-2 border-[#D62828]/25 bg-[#FFF4F2] p-5 text-center shadow-sm">
      <p className="mb-4 font-semibold leading-7 text-[#0B2D5C]">
        Ready to accept this document?
      </p>
      <button
        type="button"
        onClick={accept}
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#D62828] px-6 py-3 text-base font-bold text-white transition hover:bg-[#A61F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-gray-400"
      >
        {isSubmitting ? 'Recording acceptance…' : document.acceptanceAction}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-[#A61F1F]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LegalDocumentAcceptanceAction({
  documentKey,
}: {
  documentKey: LegalDocumentKey;
}) {
  return (
    <Suspense fallback={null}>
      <AcceptanceAction documentKey={documentKey} />
    </Suspense>
  );
}
