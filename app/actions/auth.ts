'use server';

import { mapAuthErrorMessage } from '@/lib/auth/redirects';
import { createClient } from '@/lib/supabase/server';

type ActionResult = {
  success: boolean;
  message: string;
};

function buildConfirmRedirectTo(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/auth/callback?next=/onboarding`;
}

/**
 * Resend signup confirmation email with the correct environment redirect.
 */
export async function resendConfirmationEmail(input: {
  email: string;
  origin: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' };
  }

  if (!input.origin.startsWith('http://') && !input.origin.startsWith('https://')) {
    return { success: false, message: 'Could not determine the current site address.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: buildConfirmRedirectTo(input.origin),
    },
  });

  if (error) {
    console.error('resendConfirmationEmail failed');
    return { success: false, message: mapAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    message: 'If an account needs confirmation, a new email is on the way. Check your inbox.',
  };
}
