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

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'Please confirm your email before signing in. You can resend the confirmation email below.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Those credentials did not work. If you just signed up, confirm your email first — or resend the confirmation email below.';
  }

  if (message.includes('expired') || message.includes('otp')) {
    return 'This confirmation link is invalid or has expired. Request a new confirmation email and try again.';
  }

  return 'We could not complete that request. Please try again.';
}
