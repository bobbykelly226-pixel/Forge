import Header from '@/components/Header';
import FoundingBetaWaitlistForm from './FoundingBetaWaitlistForm';
import { betaAccessMessage } from '@/lib/auth/invitations';

export const metadata = {
  title: 'Founding Beta Waitlist | Forge',
  description: 'Join the Forge Founding Beta waitlist.',
};

export default async function FoundingBetaWaitlistPage({ searchParams }: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const explanation = reason === 'full' || reason === 'paused' || reason === 'link_full'
    ? betaAccessMessage(reason)
    : reason === 'invalid' ? 'That invitation is unavailable. You can join the waitlist, or use a different invitation.' : null;
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />
      <main className="mx-auto max-w-md px-5 pb-20 pt-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D62828]">Founding Beta</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">Join the waitlist</h1>
          <p className="mt-4 text-lg leading-relaxed text-[#444444]">
            Forge is welcoming a small group at a time so every early member receives thoughtful support.
          </p>
        </div>
        {explanation ? <p role="status" className="mb-6 rounded-2xl border border-[#0B2D5C]/15 bg-white p-4 text-sm">{explanation}</p> : null}
        <FoundingBetaWaitlistForm />
      </main>
    </div>
  );
}
