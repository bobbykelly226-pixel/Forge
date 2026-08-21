import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const home = read('app/page.tsx');
const administratorHome = read('app/internal/page.tsx');
const photoWorkspace = read('components/operator/PhotoModerationWorkspace.tsx');
const reportWorkspace = read('components/operator/ReportReviewWorkspace.tsx');

describe('administrator entry and home', () => {
  it('offers an understated administrator login from the Forge homepage footer', () => {
    assert.match(home, /href="\/login\?redirectTo=\/internal"/);
    assert.match(home, />\s*Administrator Login\s*</);
  });

  it('requires the approved operator account and verified MFA before rendering tools', () => {
    assert.match(administratorHome, /supabase\.auth\.getUser\(\)/);
    assert.match(administratorHome, /isForgeOperatorUser\(user\)/);
    assert.match(administratorHome, /notFound\(\)/);
    assert.match(administratorHome, /mfa\.status !== 'verified'/);
    assert.match(administratorHome, /operator-security\?redirectTo=\/internal/);
  });

  it('links the three administrator destinations and provides a shared return path', () => {
    assert.match(administratorHome, /href: '\/internal\/photo-moderation'/);
    assert.match(administratorHome, /href: '\/internal\/report-review'/);
    assert.match(administratorHome, /href: '\/internal\/operator-security\?redirectTo=\/internal'/);
    assert.match(photoWorkspace, /href="\/internal"/);
    assert.match(reportWorkspace, /href="\/internal"/);
  });
});
