import Header from '@/components/Header';
import BetaWaitlistForm from '@/components/founding-beta/BetaWaitlistForm';
import { loadBetaCapacity } from '@/lib/operator/beta-enrollment';
import { isBetaFull } from '@/lib/auth/beta-enrollment';

export const dynamic = 'force-dynamic';

import SignupForm from './SignupForm';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const capacity = await loadBetaCapacity();
  if (capacity && isBetaFull(capacity)) return <div className="min-h-screen bg-[#F8F6F2]"><Header /><main className="mx-auto max-w-md px-5 py-16"><BetaWaitlistForm initialEmail={email ?? ''} /></main></div>;
  return <SignupForm initialEmail={email ?? ''} />;
}
