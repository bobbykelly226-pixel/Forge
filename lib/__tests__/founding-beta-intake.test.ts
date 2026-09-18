import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const publicAction = readFileSync('app/actions/founding-beta.ts', 'utf8');
const publicPage = readFileSync('app/founding-beta/page.tsx', 'utf8');
const publicForm = readFileSync('components/founding-beta/FoundingBetaRequestForm.tsx', 'utf8');
const reviewAction = readFileSync('app/actions/founding-beta-review.ts', 'utf8');
const reviewPage = readFileSync('app/internal/founding-beta/page.tsx', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20260917041924_founding_beta_requests.sql',
  'utf8'
);

describe('Founding Beta invitation intake', () => {
  it('keeps the public request separate from account creation', () => {
    assert.match(publicPage, /request your invitation/i);
    assert.match(publicForm, /does not create an account/i);
    assert.doesNotMatch(`${publicPage}\n${publicForm}`, /selected members|guarantee selection/i);
    assert.match(publicAction, /founding_beta_requests/);
    assert.doesNotMatch(publicAction, /auth\.signUp/);
  });

  it('requires adult, feedback, and community-standard confirmations', () => {
    assert.match(publicForm, /name="adult_confirmed" required/);
    assert.match(publicForm, /name="feedback_agreed" required/);
    assert.match(publicForm, /name="standards_agreed" required/);
    assert.match(publicAction, /!adultConfirmed \|\| !feedbackAgreed \|\| !standardsAgreed/);
    assert.match(migration, /check \(adult_confirmed and feedback_agreed and standards_agreed\)/);
  });

  it('keeps the request tables private and decisions audited', () => {
    assert.match(migration, /enable row level security/);
    assert.match(migration, /revoke all on table public\.founding_beta_requests from public, anon, authenticated/);
    assert.match(migration, /founding_beta_request_events/);
    assert.match(migration, /grant execute on function public\.approve_founding_beta_request[\s\S]*to service_role/);
  });

  it('requires operator authentication and MFA before review actions', () => {
    assert.match(reviewPage, /isForgeOperatorUser/);
    assert.match(reviewPage, /mfa\.status !== 'verified'/);
    assert.match(reviewAction, /isForgeOperatorUser/);
    assert.match(reviewAction, /mfa\.status !== 'verified'/);
  });

  it('creates a seven-day single-use invitation only after approval', () => {
    assert.match(migration, /now\(\) \+ interval '7 days'/);
    assert.match(migration, /on conflict \(email\) do update/);
    assert.match(migration, /where public\.beta_signup_invitations\.accepted_at is null/);
    assert.match(reviewAction, /Your Forge Founding Beta invitation/);
  });
});
