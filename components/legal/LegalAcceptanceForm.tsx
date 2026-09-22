import {
  CURRENT_LEGAL_DOCUMENTS,
  type LegalDocumentKey,
} from '@/lib/legal/documents';
import Link from 'next/link';

export default function LegalAcceptanceForm({
  redirectTo,
  initialAcceptedKeys,
}: {
  redirectTo: string;
  initialAcceptedKeys: LegalDocumentKey[];
}) {
  const accepted = new Set(initialAcceptedKeys);
  const allAccepted = CURRENT_LEGAL_DOCUMENTS.every((document) =>
    accepted.has(document.key)
  );

  const reviewHref = (href: string) => {
    const returnParams = new URLSearchParams({ redirectTo });
    const documentParams = new URLSearchParams({
      returnTo: `/legal/acceptance?${returnParams.toString()}`,
    });
    return `${href}?${documentParams.toString()}`;
  };

  return (
    <div className="space-y-4">
      {CURRENT_LEGAL_DOCUMENTS.map((document) => {
        const isAccepted = accepted.has(document.key);
        return (
          <div
            key={document.key}
            className="rounded-md border border-[#0B2D5C] bg-[#F7F7F7] p-5 shadow-[0_4px_12px_rgba(11,45,92,0.08)]"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-base font-bold text-[#0B2D5C] sm:text-lg">
                  {document.title}{' '}
                  <span className="whitespace-nowrap font-normal text-[#596273]">v{document.version}</span>
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isAccepted ? 'text-[#16734A]' : 'text-[#C92027]'
                  }`}
                >
                  {isAccepted ? 'Accepted' : 'Not reviewed'}
                </p>
              </div>
              <Link
                href={reviewHref(document.href)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#0B2D5C] bg-[#0B2D5C] px-4 py-2 font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92027] focus-visible:ring-offset-2 sm:w-auto"
              >
                {isAccepted ? 'Review again' : 'Review and accept'}
              </Link>
            </div>
          </div>
        );
      })}

      {allAccepted ? (
        <a
          href={redirectTo}
          className="flex min-h-14 w-full items-center justify-center rounded-md border border-[#0B2D5C] bg-[#0B2D5C] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92027] focus-visible:ring-offset-2"
        >
          Continue to Forge
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-14 w-full rounded-md border border-[#7D8795] bg-[#8E99A9] px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed"
        >
          Continue to Forge
        </button>
      )}
    </div>
  );
}
