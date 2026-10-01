import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { betaAccountStatus, isBetaFull } from '@/lib/auth/beta-enrollment';

describe('direct beta enrollment', () => {
  it('switches to waitlist exactly at the account limit, including a reduced limit', () => {
    assert.equal(isBetaFull({ accountLimit: 50, accountCount: 49 }), false);
    assert.equal(isBetaFull({ accountLimit: 50, accountCount: 50 }), true);
    assert.equal(isBetaFull({ accountLimit: 10, accountCount: 18 }), true);
  });
  it('distinguishes missing accounts from unconfirmed and confirmed accounts', () => {
    assert.equal(betaAccountStatus(), 'No account yet');
    assert.equal(betaAccountStatus({ confirmed_at: null }), 'Needs email confirmation');
    assert.equal(betaAccountStatus({ confirmed_at: '2026-10-01T00:00:00Z' }), 'Email confirmed');
  });
});
