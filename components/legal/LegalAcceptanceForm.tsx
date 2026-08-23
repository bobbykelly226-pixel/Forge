'use client';

import { acceptCurrentLegalDocuments } from '@/app/actions/legal-acceptance';
import {
  CURRENT_LEGAL_DOCUMENTS,
  type LegalDocumentKey,
} from '@/lib/legal/documents';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LegalAcceptanceForm({
  redirectTo,
  initialReviewedKeys,
  initialAcknowledgedKeys,
}: {
  redirectTo: string;
  initialReviewedKeys: LegalDocumentKey[];
  initialAcknowledgedKeys: LegalDocumentKey[];
}) {
  const router = useRouter();
  const reviewed = new Set(initialReviewedKeys);
  const [acknowledged, setAcknowledged] = useState<Set<LegalDocumentKey>>(
    new Set(initialAcknowledgedKeys)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allAcknowledged = CURRENT_LEGAL_DOCUMENTS.every((document) =>
    acknowledged.has(document.key)
  );

  const reviewHref = (key: LegalDocumentKey, href: string) => {
    const reviewedKeys = Array.from(new Set([...reviewed, key]));
    const returnParams = new URLSearchParams({
      redirectTo,
      reviewed: reviewedKeys.join(','),
      acknowledged: Array.from(acknowledged).join(','),
    });
    const documentParams = new URLSearchParams({
      returnTo: `/legal/acceptance?${returnParams.toString()}`,
    });

    return `${href}?${documentParams.toString()}`;
  };

  const toggle = (key: LegalDocumentKey) => {
    setAcknowledged((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await acceptCurrentLegalDocuments({
        acknowledgedKeys: Array.from(acknowledged),
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError('Forge could not record your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div
        role="note"
        className="rounded-2xl border-2 border-[#D62828]/30 bg-[#FFF4F2] px-5 py-4 text-base font-bold leading-7 text-[#0B2D5C] shadow-sm sm:text-lg"
      >
        Open and read each document first. Then select “Done — Return to Agreements”
        on that document page. Once you return, its checkbox will be available.
      </div>

      {CURRENT_LEGAL_DOCUMENTS.map((document) => (
        <label
          key={document.key}
          className={`flex items-start gap-4 rounded-2xl border border-[#0B2D5C]/15 bg-white p-5 shadow-sm transition hover:border-[#0B2D5C]/30 ${reviewed.has(document.key) ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <input
            type="checkbox"
            checked={acknowledged.has(document.key)}
            onChange={() => toggle(document.key)}
            disabled={!reviewed.has(document.key)}
            aria-describedby={`${document.key}-review-status`}
            className="mt-1 h-5 w-5 shrink-0 accent-[#D62828] disabled:cursor-not-allowed disabled:opacity-45"
          />
          <span className="min-w-0">
            <span className="block font-semibold text-[#0B2D5C]">
              {document.title} <span className="font-normal text-[#6B7280]">v{document.version}</span>
            </span>
            <span className="mt-1 block text-sm leading-6 text-[#444444]">
              {document.acknowledgement}{' '}
              <Link
                href={reviewHref(document.key, document.href)}
                className="font-semibold text-[#0B2D5C] underline underline-offset-2"
              >
                Open and read this document
              </Link>
            </span>
            <span
              id={`${document.key}-review-status`}
              className={`mt-2 block text-sm font-semibold ${
                reviewed.has(document.key) ? 'text-[#0B2D5C]' : 'text-[#A61F1F]'
              }`}
            >
              {reviewed.has(document.key)
                ? 'Review completed. You may now select this agreement.'
                : 'Open and read this document, then use its Done button to unlock this agreement.'}
            </span>
          </span>
        </label>
      ))}

      {error && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!allAcknowledged || isSubmitting}
        className="w-full rounded-2xl bg-[#D62828] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSubmitting ? 'Recording acceptance...' : 'Accept and continue'}
      </button>
    </form>
  );
}
