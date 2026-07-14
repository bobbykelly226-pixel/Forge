import Link from 'next/link';

import Header from '@/components/Header';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason;

  const message =
    reason === 'missing_token'
      ? 'This confirmation link is incomplete. Request a new confirmation email and try again.'
      : reason
        ? decodeURIComponent(reason)
        : 'This confirmation link is invalid or has expired.';

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <main className="mx-auto max-w-md px-5 pb-20 pt-16 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#0B2D5C]">
          Confirmation needed
        </h1>
        <p className="mb-8 text-base leading-relaxed text-[#555555]" role="alert">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            Go to sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
          >
            Create an account
          </Link>
        </div>
      </main>
    </div>
  );
}
