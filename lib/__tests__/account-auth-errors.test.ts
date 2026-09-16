import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { accountAuthErrorMessage } from '../account/auth-errors';

describe('account confirmation error messages', () => {
  it('only attributes invalid credentials to the password', () => {
    assert.equal(accountAuthErrorMessage({ code: 'invalid_credentials', status: 400 }), 'That password was not accepted.');
    for (const error of [{ code: 'captcha_failed', status: 400 }, { status: 503 }, { code: 'unexpected_failure' }, { status: 429 }]) {
      assert.doesNotMatch(accountAuthErrorMessage(error), /password was not accepted/);
    }
  });
  it('gives actionable security check and rate limit instructions', () => {
    assert.match(accountAuthErrorMessage({ code: 'captcha_failed' }), /Complete the new check/);
    assert.match(accountAuthErrorMessage({ status: 429 }), /wait a few minutes/);
  });
});
