import Link from 'next/link';

import Header from '@/components/Header';
import {
  CONFIRMATION_COPY,
  parseConfirmationOutcome,
  type ConfirmationOutcome,
} from '@/lib/auth/confirmation';

function resolveOutcome(
  outcomeParam: string | undefined,
  reasonParam: string | undefined
): ConfirmationOutcome {
  const parsed = parseConfirmationOutcome(outcomeParam);
  if (parsed) {
    return parsed;
  }

  // Legacy /auth/error?reason=… links may still land here after redirects.
  if (reasonParam === 'missing_token') {
    return 'invalid_or_expired';
  }

  return 'invalid_or_expired';
}

export default async function AuthResultPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const outcome = resolveOutcome(params.outcome, params.reason);
  const copy = CONFIRMATION_COPY[outcome];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <main className="mx-auto max-w-md px-5 pb-20 pt-16 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#0B2D5C]">
          {copy.title}
        </h1>
        <p className="mb-8 text-base leading-relaxed text-[#555555]" role="status">
          {copy.message}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={
              copy.offerResend
                ? `${copy.primaryHref}?resend=1`
                : copy.primaryHref
            }
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            {copy.primaryLabel}
          </Link>
          {copy.secondaryHref && copy.secondaryLabel ? (
            <Link
              href={copy.secondaryHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
            >
              {copy.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
