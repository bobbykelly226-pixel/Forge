'use server';

import type { EmailOtpType } from '@supabase/supabase-js';

import {
  CONFIRMATION_COPY,
  classifyConfirmationProviderError,
  type ConfirmationOutcome,
} from '@/lib/auth/confirmation';
import { resolvePostAuthRedirect, sanitizeInternalPath } from '@/lib/auth/redirects';
import { createClient } from '@/lib/supabase/server';

export type AuthCallbackResult =
  | { success: true; outcome: 'session_ready'; redirectTo: string }
  | {
      success: false;
      outcome: Exclude<ConfirmationOutcome, 'session_ready'>;
      message: string;
    };

function failureResult(
  outcome: Exclude<ConfirmationOutcome, 'session_ready'>
): AuthCallbackResult {
  return {
    success: false,
    outcome,
    message: CONFIRMATION_COPY[outcome].message,
  };
}

async function redirectForAuthenticatedUser(
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const redirectTo = await resolvePostAuthRedirect(
    sanitizeInternalPath(nextPath) ?? '/onboarding'
  );
  return { success: true, outcome: 'session_ready', redirectTo };
}

export async function completeAuthWithCode(
  code: string,
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('completeAuthWithCode failed');
    return failureResult(classifyConfirmationProviderError(error.message));
  }
  return redirectForAuthenticatedUser(nextPath);
}

export async function completeAuthWithTokenHash(
  tokenHash: string,
  type: EmailOtpType,
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) {
    console.error('completeAuthWithTokenHash failed');
    return failureResult(classifyConfirmationProviderError(error.message));
  }
  return redirectForAuthenticatedUser(nextPath);
}

/**
 * Continue after the browser client has already established a session (hash-token flow).
 * If cookies are not visible to the server yet, return confirmed_needs_signin instead of
 * claiming the link was invalid — the account may already be confirmed.
 */
export async function completeAuthFromExistingSession(
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failureResult('confirmed_needs_signin');
  }

  return redirectForAuthenticatedUser(nextPath);
}

/** Ensure foundation rows once a session is known to the server. */
export async function ensureAuthFoundation(): Promise<{ ok: boolean }> {
  const { ensureFoundationalRecords } = await import('@/lib/data/profile');
  const result = await ensureFoundationalRecords();
  return { ok: result.success };
}
