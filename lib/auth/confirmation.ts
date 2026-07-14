/**
 * Confirmation-link outcome classification (client-safe).
 *
 * Outcomes:
 * - session_ready: email confirmed and a session is established
 * - confirmed_needs_signin: email confirmed, but session cookies are not usable yet
 * - already_confirmed: link was previously consumed / account already confirmed
 * - invalid_or_expired: link is genuinely unusable
 */

export type ConfirmationOutcome =
  | 'session_ready'
  | 'confirmed_needs_signin'
  | 'already_confirmed'
  | 'invalid_or_expired';

export type ConfirmationPresentation = {
  outcome: ConfirmationOutcome;
  title: string;
  message: string;
  primaryHref: '/onboarding' | '/login';
  primaryLabel: string;
  secondaryHref?: '/login' | '/signup';
  secondaryLabel?: string;
  /** When true, login page should show the resend-confirmation path. */
  offerResend?: boolean;
};

export const CONFIRMATION_COPY: Record<ConfirmationOutcome, ConfirmationPresentation> = {
  session_ready: {
    outcome: 'session_ready',
    title: 'Email confirmed',
    message: 'Your email is confirmed. Continuing into Forge onboarding.',
    primaryHref: '/onboarding',
    primaryLabel: 'Continue',
  },
  confirmed_needs_signin: {
    outcome: 'confirmed_needs_signin',
    title: 'Email confirmed',
    message: 'Your email is confirmed. Sign in to continue into Forge.',
    primaryHref: '/login',
    primaryLabel: 'Sign in',
  },
  already_confirmed: {
    outcome: 'already_confirmed',
    title: 'Already confirmed',
    message: 'Your email has already been confirmed. Sign in to continue.',
    primaryHref: '/login',
    primaryLabel: 'Sign in',
  },
  invalid_or_expired: {
    outcome: 'invalid_or_expired',
    title: 'Confirmation needed',
    message:
      'This confirmation link is invalid or has expired. Request a new confirmation email and try again.',
    primaryHref: '/login',
    primaryLabel: 'Go to sign in',
    secondaryHref: '/signup',
    secondaryLabel: 'Create an account',
    offerResend: true,
  },
};

/**
 * Classify provider error text from query/hash without revealing account existence.
 *
 * Supabase reuses “Email link is invalid or has expired” / otp_expired for both
 * already-consumed confirmation links and genuinely expired ones. Prefer the
 * already-confirmed guidance for that specific phrasing so a confirmed account
 * never sees “Confirmation needed” after a successful verify.
 */
export function classifyConfirmationProviderError(
  errorText: string | null | undefined
): Exclude<ConfirmationOutcome, 'session_ready' | 'confirmed_needs_signin'> {
  const message = (errorText ?? '').toLowerCase().trim();
  if (!message) {
    return 'invalid_or_expired';
  }

  if (
    message.includes('already been confirmed') ||
    message.includes('already confirmed') ||
    message.includes('user already registered') ||
    message.includes('email_confirmed')
  ) {
    return 'already_confirmed';
  }

  // Standard Supabase reused/expired confirmation redirect payload.
  if (
    message.includes('email link is invalid or has expired') ||
    message.includes('otp_expired') ||
    message.includes('flow_state_expired') ||
    message.includes('flow state') ||
    (message.includes('token') && message.includes('expired'))
  ) {
    return 'already_confirmed';
  }

  if (
    message.includes('invalid') ||
    message.includes('expired') ||
    message.includes('missing') ||
    message.includes('not found') ||
    message.includes('bad_jwt') ||
    message.includes('access_denied')
  ) {
    return 'invalid_or_expired';
  }

  return 'invalid_or_expired';
}

export function presentationForOutcome(
  outcome: ConfirmationOutcome
): ConfirmationPresentation {
  return CONFIRMATION_COPY[outcome];
}

export function parseConfirmationOutcome(
  value: string | null | undefined
): ConfirmationOutcome | null {
  if (
    value === 'session_ready' ||
    value === 'confirmed_needs_signin' ||
    value === 'already_confirmed' ||
    value === 'invalid_or_expired'
  ) {
    return value;
  }
  return null;
}

export function authResultPath(outcome: ConfirmationOutcome): string {
  return `/auth/result?outcome=${encodeURIComponent(outcome)}`;
}

/** True when the outcome must never show the “Confirmation needed” chrome. */
export function isSuccessfulConfirmationOutcome(outcome: ConfirmationOutcome): boolean {
  return (
    outcome === 'session_ready' ||
    outcome === 'confirmed_needs_signin' ||
    outcome === 'already_confirmed'
  );
}
