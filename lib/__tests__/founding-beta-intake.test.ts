import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const publicPage = readFileSync('app/founding-beta/page.tsx', 'utf8');
const action = readFileSync('app/actions/beta-enrollment.ts', 'utf8');
const reviewPage = readFileSync('app/internal/founding-beta/page.tsx', 'utf8');

describe('direct Founding Beta intake', () => {
  it('leads directly to signup and retains a capacity waitlist', () => {
    assert.match(publicPage, /href="\/signup"/);
    assert.match(publicPage, /BetaWaitlistForm/);
    assert.doesNotMatch(publicPage, /FoundingBetaRequestForm|Request your invitation/);
  });
  it('protects account visibility and capacity updates with operator authentication and MFA', () => {
    assert.match(reviewPage, /isForgeOperatorUser/);
    assert.match(reviewPage, /mfa\.status !== 'verified'/);
    assert.match(action, /isForgeOperatorUser/);
    assert.match(action, /status !== 'verified'/);
  });
  it('retires invitation and request email actions', () => {
    for (const path of ['app/actions/founding-beta.ts', 'app/actions/founding-beta-review.ts']) {
      const content = readFileSync(path, 'utf8');
      assert.doesNotMatch(content, /emails\.send|\.rpc\(/);
      assert.match(content, /https:\/\/forge\.forgedinlife\.com\/signup/);
    }
  });
});
