import { ensureFoundationalRecords, hasCompletedOnboarding } from '@/lib/data/profile';
import { sanitizeInternalPath } from '@/lib/auth/messages';

/**
 * Safe post-auth destination for a newly confirmed session.
 * Server-only — imports data/profile.
 */
export async function resolvePostAuthRedirect(
  requestedNext: string | null | undefined
): Promise<string> {
  const fallback = '/onboarding';
  const next = sanitizeInternalPath(requestedNext) ?? fallback;

  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return next;
  }

  const completed = await hasCompletedOnboarding();
  if (completed.success && completed.data) {
    if (next === '/onboarding') {
      return '/profile';
    }
    return next;
  }

  return next === '/app' || next === '/profile' ? '/onboarding' : next;
}

export { mapAuthErrorMessage, sanitizeInternalPath } from '@/lib/auth/messages';
