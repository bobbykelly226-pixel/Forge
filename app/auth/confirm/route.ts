import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import {
  authResultPath,
  classifyConfirmationProviderError,
} from '@/lib/auth/confirmation';
import { resolvePostAuthRedirect, sanitizeInternalPath } from '@/lib/auth/redirects';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles email confirmation links that include token_hash + type
 * (SSR / custom Confirm signup template flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = sanitizeInternalPath(searchParams.get('next')) ?? '/onboarding';

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}${authResultPath('invalid_or_expired')}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    console.error('auth confirm verifyOtp failed');
    const outcome = classifyConfirmationProviderError(error.message);
    return NextResponse.redirect(`${origin}${authResultPath(outcome)}`);
  }

  const destination = await resolvePostAuthRedirect(next);
  return NextResponse.redirect(`${origin}${destination}`);
}
