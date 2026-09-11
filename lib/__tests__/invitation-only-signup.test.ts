import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

import {
  betaAccessMessage,
  INVITATION_REQUIRED_MESSAGE,
  isActiveBetaSignupInvitation,
} from '@/lib/auth/invitations';

const migration = readFileSync(
  'supabase/migrations/20260814141901_invitation_only_signup.sql',
  'utf8'
);
const localConfig = readFileSync('supabase/config.toml', 'utf8');
const signupForm = readFileSync('app/signup/SignupForm.tsx', 'utf8');
const signupAction = readFileSync('app/actions/auth.ts', 'utf8');
const hybridMigration = readFileSync(
  'supabase/migrations/20260911013000_hybrid_founding_beta_access.sql',
  'utf8'
);

describe('invitation-only signup', () => {
  it('accepts only an unused, unrevoked, unexpired invitation', () => {
    const now = Date.parse('2026-08-13T12:00:00Z');
    assert.equal(
      isActiveBetaSignupInvitation(
        { accepted_at: null, revoked_at: null, expires_at: '2026-08-14T12:00:00Z' },
        now
      ),
      true
    );
    assert.equal(isActiveBetaSignupInvitation(null, now), false);
    assert.equal(
      isActiveBetaSignupInvitation(
        { accepted_at: '2026-08-13T11:00:00Z', revoked_at: null, expires_at: null },
        now
      ),
      false
    );
    assert.equal(
      isActiveBetaSignupInvitation(
        { accepted_at: null, revoked_at: '2026-08-13T11:00:00Z', expires_at: null },
        now
      ),
      false
    );
    assert.equal(
      isActiveBetaSignupInvitation(
        { accepted_at: null, revoked_at: null, expires_at: '2026-08-13T12:00:00Z' },
        now
      ),
      false
    );
    assert.equal(
      isActiveBetaSignupInvitation(
        { accepted_at: null, revoked_at: null, expires_at: 'not-a-date' },
        now
      ),
      false
    );
  });

  it('enforces the allowlist in the Auth hook rather than only in React', () => {
    assert.match(migration, /hook_enforce_beta_signup_invitation/);
    assert.match(migration, /to supabase_auth_admin/);
    assert.match(migration, /from public, anon, authenticated/);
    assert.match(migration, /accepted_at is null/);
    assert.match(migration, /revoked_at is null/);
    assert.match(migration, /expires_at is null or expires_at > now\(\)/);
    assert.match(localConfig, /\[auth\.hook\.before_user_created\][\s\S]*enabled = true/);
  });

  it('keeps server-action preflight and controlled Founding Beta copy wired', () => {
    assert.match(signupAction, /reserveBetaSignupAccess/);
    assert.match(signupAction, /forge_beta_reservation/);
    assert.match(signupForm, /Founding Beta invitation link/i);
    assert.match(signupForm, /Join the Founding Beta waitlist/i);
    assert.match(INVITATION_REQUIRED_MESSAGE, /Founding Beta invitation/i);
  });

  it('uses hashed links, proof-bound reservations, capacity, and a database-enforced hook', () => {
    assert.equal(betaAccessMessage('full'), betaAccessMessage('link_full'));
    assert.match(hybridMigration, /beta_enrollment_settings/);
    assert.match(hybridMigration, /member_limit integer not null default 50/);
    assert.match(hybridMigration, /beta_signup_links/);
    assert.match(hybridMigration, /token_hash text not null unique/);
    assert.match(hybridMigration, /beta_signup_reservations/);
    assert.match(hybridMigration, /interval '30 minutes'/);
    assert.match(hybridMigration, /extensions\.digest\(v_proof, 'sha256'\)/);
    assert.match(hybridMigration, /accepted_count >= v_settings\.member_limit/);
    assert.doesNotMatch(hybridMigration, /create table[^;]+\btoken\b/i);
  });

  it('does not invalidate a successful signup by generating a second confirmation link', () => {
    const freshSignupSection = signupAction.slice(
      signupAction.indexOf('const identities = data.user?.identities'),
      signupAction.indexOf('export async function requestPasswordReset')
    );

    assert.doesNotMatch(freshSignupSection, /deliverConfirmationWithResend/);
    assert.match(freshSignupSection, /Check your email to confirm your account/);
  });
});
