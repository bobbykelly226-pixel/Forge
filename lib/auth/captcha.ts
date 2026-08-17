export const AUTH_CAPTCHA_REQUIRED_MESSAGE =
  'Complete the security check before continuing.';

export function isAuthCaptchaEnabled(
  value: string | undefined = process.env.NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED
): boolean {
  return value === 'true';
}

export function getAuthCaptchaSiteKey(
  value: string | undefined = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
): string | null {
  const siteKey = value?.trim();
  return siteKey || null;
}
