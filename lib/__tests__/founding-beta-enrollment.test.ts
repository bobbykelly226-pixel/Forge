import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { betaWaitlistPath, betaAccessReasonFromAuthError } from '@/lib/auth/invitations';

const action = readFileSync('app/actions/beta-enrollment.ts', 'utf8');
const page = readFileSync('app/internal/beta-enrollment/page.tsx', 'utf8');
const workspace = readFileSync('components/operator/BetaEnrollmentWorkspace.tsx', 'utf8');
const waitlistPage = readFileSync('app/waitlist/page.tsx', 'utf8');
const waitlistAction = readFileSync('app/actions/waitlist.ts', 'utf8');
const signupAction = readFileSync('app/actions/auth.ts', 'utf8');

describe('Founding Beta enrollment administration', () => {
  it('never falls back to administrative account creation during public beta signup', () => {
    const signup = signupAction.slice(signupAction.indexOf('export async function signUpWithEmail'), signupAction.indexOf('export async function requestPasswordReset'));
    assert.doesNotMatch(signup, /auth\.admin\.(createUser|generateLink)/);
    assert.match(signup, /supabase\.auth\.signUp/);
  });
  it('protects every operator surface and mutation with allowlist plus MFA', () => {
    assert.match(page, /isForgeOperatorUser/);
    assert.match(page, /mfa\.status !== 'verified'/);
    assert.match(action, /authorizeOperator/);
    assert.match(action, /mfa\.status === 'verified'/);
  });

  it('creates only hashed stored tokens and returns the raw link once', () => {
    assert.match(action, /randomBytes\(32\)/);
    assert.match(action, /token_hash: hashBetaAccessSecret\(token\)/);
    assert.match(action, /invitationPath: `\/signup\?invite=\$\{token\}`/);
    assert.doesNotMatch(action, /\btoken:\s*token\b/);
  });

  it('provides cap, pause, direct invitation, link revocation, and waitlist controls', () => {
    assert.match(workspace, /Pause public link enrollment/);
    assert.match(workspace, /Save limit/);
    assert.match(workspace, /Direct email access/);
    assert.match(workspace, /Revoke/);
    assert.match(waitlistPage, /Join the waitlist/);
    assert.doesNotMatch(waitlistAction, /console\.log/);
    assert.match(waitlistAction, /join_beta_waitlist/);
    assert.doesNotMatch(waitlistAction, /resend|emails\.send/i);
    assert.match(waitlistAction, /contact_permission/);
  });

  it('routes unavailable access to the waitlist without redirecting transient failures', () => {
    for (const reason of ['full', 'paused', 'link_full', 'invalid'] as const) {
      assert.equal(betaWaitlistPath(reason), `/waitlist?reason=${reason}`);
    }
    for (const reason of ['retry', 'unavailable', 'reserved'] as const) assert.equal(betaWaitlistPath(reason), undefined);
  });

  it('handles capacity and revocation races reported by the authoritative Auth hook', () => {
    assert.equal(betaAccessReasonFromAuthError('Forge Founding Beta enrollment is currently full.'), 'full');
    assert.equal(betaAccessReasonFromAuthError('Forge Founding Beta enrollment is currently paused.'), 'paused');
    assert.equal(betaAccessReasonFromAuthError('This Founding Beta invitation is no longer available.'), 'link_full');
    assert.equal(betaAccessReasonFromAuthError('A valid Forge Founding Beta invitation is required to create an account.'), 'invalid');
    assert.equal(betaAccessReasonFromAuthError('Captcha verification failed'), undefined);
    assert.equal(betaAccessReasonFromAuthError('Email rate limit exceeded'), undefined);
  });

  it('uses the database count for limit changes and never overwrites accepted invitations', () => {
    assert.doesNotMatch(action, /formData\.get\('accepted_count'\)/);
    assert.match(action, /set_beta_member_limit/);
    assert.doesNotMatch(action, /\.upsert\(/);
    assert.match(workspace, /Email-verified members/);
    assert.match(workspace, /Awaiting email confirmation/);
  });
});
