export function accountAuthErrorMessage(error: { code?: string; status?: number }): string {
  if (error.code === 'invalid_credentials') return 'That password was not accepted.';
  if (error.code === 'captcha_failed') {
    return 'The security check could not be verified. Complete the new check and try again.';
  }
  if (error.status === 429 || error.code === 'over_request_rate_limit') {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  return 'Account confirmation is temporarily unavailable. Please try again.';
}
