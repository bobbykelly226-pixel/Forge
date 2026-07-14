import { redirect } from 'next/navigation';

import {
  authResultPath,
  classifyConfirmationProviderError,
  parseConfirmationOutcome,
} from '@/lib/auth/confirmation';

/**
 * Legacy confirmation error route.
 * Forwards to /auth/result so titles/messages match the classified outcome
 * (successful confirmation never stays on “Confirmation needed”).
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  const explicit = parseConfirmationOutcome(params.outcome);
  if (explicit) {
    redirect(authResultPath(explicit));
  }

  const reason = params.reason ? decodeURIComponent(params.reason) : '';
  if (reason === 'missing_token') {
    redirect(authResultPath('invalid_or_expired'));
  }

  const outcome = classifyConfirmationProviderError(reason);
  redirect(authResultPath(outcome));
}
