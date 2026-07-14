'use server';

import type { EmailOtpType } from '@supabase/supabase-js';

import { mapAuthErrorMessage, resolvePostAuthRedirect, sanitizeInternalPath } from '@/lib/auth/redirects';
import { createClient } from '@/lib/supabase/server';

type AuthCallbackResult =
  | { success: true; redirectTo: string }
  | { success: false; message: string };

export async function completeAuthWithCode(
  code: string,
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('completeAuthWithCode failed');
    return { success: false, message: mapAuthErrorMessage(error.message) };
  }
  const redirectTo = await resolvePostAuthRedirect(sanitizeInternalPath(nextPath) ?? '/onboarding');
  return { success: true, redirectTo };
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
    return { success: false, message: mapAuthErrorMessage(error.message) };
  }
  const redirectTo = await resolvePostAuthRedirect(sanitizeInternalPath(nextPath) ?? '/onboarding');
  return { success: true, redirectTo };
}

export async function completeAuthFromExistingSession(
  nextPath?: string | null
): Promise<AuthCallbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'This confirmation link is invalid or has expired. Request a new confirmation email.',
    };
  }

  const redirectTo = await resolvePostAuthRedirect(sanitizeInternalPath(nextPath) ?? '/onboarding');
  return { success: true, redirectTo };
}
