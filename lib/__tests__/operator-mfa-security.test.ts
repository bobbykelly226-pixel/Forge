import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const config = read('supabase/config.toml');
const access = read('lib/operator/access.ts');
const mfa = read('lib/operator/mfa.ts');
const securityPage = read('app/internal/operator-security/page.tsx');
const workspace = read('components/operator/OperatorMfaWorkspace.tsx');
const moderationPage = read('app/internal/photo-moderation/page.tsx');
const moderationAction = read('app/actions/photo-moderation.ts');

describe('operator multi-factor authentication', () => {
  it('enables TOTP enrollment and verification in Supabase configuration', () => {
    assert.match(config, /\[auth\.mfa\.totp\][\s\S]*enroll_enabled = true/);
    assert.match(config, /\[auth\.mfa\.totp\][\s\S]*verify_enabled = true/);
  });

  it('keeps the setup route behind the existing server-only operator allowlist', () => {
    assert.match(access, /import 'server-only'/);
    assert.match(securityPage, /supabase\.auth\.getUser\(\)/);
    assert.match(securityPage, /isForgeOperatorUser\(user\)/);
    assert.match(securityPage, /notFound\(\)/);
    assert.doesNotMatch(securityPage, /NEXT_PUBLIC_FORGE_OPERATOR/);
  });

  it('uses the supported TOTP enrollment, challenge, and verification APIs', () => {
    assert.match(workspace, /mfa\.enroll\(\{[\s\S]*factorType: 'totp'/);
    assert.match(workspace, /mfa\.challenge\(\{ factorId \}\)/);
    assert.match(workspace, /mfa\.verify\(\{/);
    assert.match(workspace, /mfa\.listFactors\(\)/);
    assert.match(mfa, /getAuthenticatorAssuranceLevel\(\)/);
  });

  it('does not provide a factor-removal control to the operator', () => {
    assert.doesNotMatch(workspace, />\s*Unenroll\s*</);
    assert.doesNotMatch(workspace, />\s*Disable MFA\s*</);
  });

  it('requires six numeric digits and never submits the shared secret', () => {
    assert.match(workspace, /\^\\d\{6\}\$/);
    assert.match(workspace, /pattern="\[0-9\]\{6\}"/);
    assert.doesNotMatch(workspace, /name=".*secret/);
  });

  it('steps up enrolled operators before rendering or mutating moderation data', () => {
    assert.match(mfa, /getAuthenticatorAssuranceLevel\(\)/);
    assert.match(mfa, /data\.nextLevel === 'aal2'/);
    assert.match(moderationPage, /getOperatorMfaState\(supabase\)/);
    assert.match(moderationPage, /redirect\('\/internal\/operator-security\?redirectTo=\/internal\/photo-moderation'\)/);
    assert.match(moderationAction, /getOperatorMfaState\(supabase\)/);
    assert.match(moderationAction, /Enter your authenticator code before moderating photos/);
  });

  it('keeps the transitional fallback available only when no factor is enrolled', () => {
    assert.match(mfa, /return \{ status: 'not-enrolled' \}/);
    assert.match(mfa, /return \{ status: 'challenge-required' \}/);
    assert.match(mfa, /return \{ status: 'verified' \}/);
  });
});
