import 'server-only';

import type { User } from '@supabase/supabase-js';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getForgeOperatorEmails(
  configured = process.env.FORGE_OPERATOR_EMAILS
): ReadonlySet<string> {
  return new Set(
    (configured ?? '')
      .split(',')
      .map(normalizeEmail)
      .filter(Boolean)
  );
}

/**
 * Operator authorization is intentionally server-only and fails closed.
 * Accounts must have a confirmed email that exactly matches the configured
 * comma-separated FORGE_OPERATOR_EMAILS allowlist.
 */
export function isForgeOperatorUser(
  user: Pick<User, 'email' | 'email_confirmed_at'> | null | undefined,
  configured = process.env.FORGE_OPERATOR_EMAILS
) {
  if (!user?.email || !user.email_confirmed_at) return false;
  return getForgeOperatorEmails(configured).has(normalizeEmail(user.email));
}
