import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  AUTH_CAPTCHA_REQUIRED_MESSAGE,
  getAuthCaptchaSiteKey,
  isAuthCaptchaEnabled,
} from '@/lib/auth/captcha';

const authAction = readFileSync('app/actions/auth.ts', 'utf8');
const loginForm = readFileSync('app/login/LoginForm.tsx', 'utf8');
const signupForm = readFileSync('app/signup/SignupForm.tsx', 'utf8');

describe('authentication CAPTCHA protection', () => {
  it('is explicit and fail-closed when enabled without a site key', () => {
    assert.equal(isAuthCaptchaEnabled(undefined), false);
    assert.equal(isAuthCaptchaEnabled('true'), true);
    assert.equal(getAuthCaptchaSiteKey(undefined), null);
    assert.equal(getAuthCaptchaSiteKey('  '), null);
    assert.equal(getAuthCaptchaSiteKey('site-key'), 'site-key');
    assert.match(AUTH_CAPTCHA_REQUIRED_MESSAGE, /security check/i);
  });

  it('passes CAPTCHA tokens through every public authentication flow', () => {
    assert.match(signupForm, /captchaToken: captchaToken \?\? undefined/);
    assert.match(loginForm, /signInWithPassword\([\s\S]*captchaToken/);
    assert.match(loginForm, /resendConfirmationEmail\([\s\S]*captchaToken/);
    assert.match(loginForm, /requestPasswordReset\([\s\S]*captchaToken/);
    assert.match(authAction, /auth\.signUp\([\s\S]*captchaToken/);
    assert.match(authAction, /auth\.resend\([\s\S]*captchaToken/);
    assert.match(authAction, /resetPasswordForEmail\([\s\S]*captchaToken/);
  });

  it('does not use service-role email fallbacks while CAPTCHA is enabled', () => {
    assert.match(
      authAction,
      /!captchaEnabled && createServiceClient\(\) && process\.env\.RESEND_API_KEY/
    );
    assert.match(
      authAction,
      /!captchaEnabled &&[\s\S]*isRateLimitError\(error\.message\)[\s\S]*createServiceClient/
    );
  });
});
