import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { mapAuthErrorMessage, resolvePostAuthRedirect, sanitizeInternalPath } from '@/lib/auth/redirects';
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
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${encodeURIComponent('missing_token')}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    console.error('auth confirm verifyOtp failed');
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${encodeURIComponent(mapAuthErrorMessage(error.message))}`
    );
  }

  const destination = await resolvePostAuthRedirect(next);
  return NextResponse.redirect(`${origin}${destination}`);
}
