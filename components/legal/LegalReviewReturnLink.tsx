'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

function LegalReviewReturnLinkContent() {
  const searchParams = useSearchParams();
  const returnTo = safeAgreementReturnPath(searchParams.get('returnTo'));

  if (!returnTo) return null;

  return (
    <div className="mt-12 rounded-3xl border-2 border-[#D62828]/25 bg-[#FFF4F2] p-5 text-center shadow-sm">
      <p className="mb-4 font-semibold leading-7 text-[#0B2D5C]">
        Finished reviewing this document?
      </p>
      <Link
        href={returnTo}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#D62828] px-6 py-3 text-base font-bold text-white transition hover:bg-[#A61F1F]"
      >
        Done — Return to Agreements
      </Link>
    </div>
  );
}

export default function LegalReviewReturnLink() {
  return (
    <Suspense fallback={null}>
      <LegalReviewReturnLinkContent />
    </Suspense>
  );
}
