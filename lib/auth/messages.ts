/**
 * Client-safe auth path/error helpers (no server imports).
 */

export function sanitizeInternalPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//')) return null;
  if (path.includes('://')) return null;
  return path;
}

export function mapAuthErrorMessage(errorMessage: string | undefined): string {
  const message = (errorMessage ?? '').toLowerCase();

  if (
    message.includes('rate limit') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('email rate limit')
  ) {
    return 'Too many confirmation emails were requested recently. Please wait a few minutes and try again, or check spam while you wait.';
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'Please confirm your email before signing in. You can resend the confirmation email below.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Those credentials did not work. If you just signed up, confirm your email first — or resend the confirmation email below.';
  }

  if (message.includes('expired') || message.includes('otp')) {
    return 'This confirmation link is invalid or has expired. Request a new confirmation email and try again.';
  }

  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'If an account already exists for that email, sign in instead. You can also reset your password or resend confirmation.';
  }

  return 'We could not complete that request. Please try again.';
}

/**
 * Interpret a Supabase signUp() payload.
 * When an email is already registered, Auth often returns a user with empty identities
 * and no error (anti-enumeration). That must not be treated as a fresh signup.
 */
export function interpretSignUpResult(input: {
  errorMessage?: string | null;
  user: { id?: string; identities?: unknown[] | null; confirmation_sent_at?: string | null } | null;
  session: unknown;
}): {
  kind: 'session' | 'confirmation_sent' | 'already_registered' | 'error';
  message: string;
} {
  if (input.errorMessage) {
    return {
      kind: 'error',
      message: mapAuthErrorMessage(input.errorMessage),
    };
  }

  if (input.session) {
    return {
      kind: 'session',
      message: 'Signed in.',
    };
  }

  const identities = input.user?.identities;
  const identityCount = Array.isArray(identities) ? identities.length : 0;

  if (!input.user?.id || identityCount === 0) {
    return {
      kind: 'already_registered',
      message:
        'If an account already exists for that email, sign in instead. You can reset your password or resend confirmation from the sign-in page.',
    };
  }

  // Auth may set confirmation_sent_at even when the mailer later rate-limits delivery.
  // Callers that know a delivery error occurred should override this.
  return {
    kind: 'confirmation_sent',
    message:
      'Check your email to confirm your account. After you confirm, you will continue into Forge onboarding.',
  };
}

export const AUTH_RESEND_COOLDOWN_MS = 60_000;
