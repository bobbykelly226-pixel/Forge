import SignupForm from './SignupForm';
import { redirect } from 'next/navigation';
import { betaSignupLandingReason } from '@/lib/auth/beta-access';
import { betaWaitlistPath } from '@/lib/auth/invitations';

export const metadata = { referrer: 'no-referrer', robots: { index: false, follow: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawInvite = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  if (rawInvite !== undefined && !/^[A-Za-z0-9_-]{32,256}$/.test(rawInvite)) {
    redirect('/waitlist?reason=invalid');
  }
  const invitationToken = rawInvite;
  const reason = await betaSignupLandingReason(invitationToken);
  const waitlistPath = reason ? betaWaitlistPath(reason) : undefined;
  if (waitlistPath) redirect(waitlistPath);

  return <SignupForm invitationToken={invitationToken} />;
}
