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
            className="rounded-2xl border border-[#0B2D5C]/15 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-[#0B2D5C]">
                  {document.title}{' '}
                  <span className="font-normal text-[#6B7280]">v{document.version}</span>
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isAccepted ? 'text-emerald-700' : 'text-[#A61F1F]'
                  }`}
                >
                  {isAccepted ? 'Accepted' : 'Not reviewed'}
                </p>
              </div>
              <Link
                href={reviewHref(document.href)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0B2D5C]/25 px-4 py-2 font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2"
              >
                {isAccepted ? 'Review again' : 'Review and accept'}
              </Link>
            </div>
          </div>
        );
      })}

      {allAccepted ? (
        <Link
          href={redirectTo}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#D62828] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2"
        >
          Continue to Forge
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-14 w-full rounded-2xl bg-gray-400 px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed"
        >
          Continue to Forge
        </button>
      )}
    </div>
  );
}
