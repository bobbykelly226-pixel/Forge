import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  AUTH_ORIGIN_ALLOWLIST,
  buildCanonicalAuthUrl,
  getCanonicalAuthOrigin,
} from '@/lib/auth/origins';

const authAction = readFileSync('app/actions/auth.ts', 'utf8');
const signupForm = readFileSync('app/signup/SignupForm.tsx', 'utf8');
const loginForm = readFileSync('app/login/LoginForm.tsx', 'utf8');
const confirmRoute = readFileSync('app/auth/confirm/route.ts', 'utf8');

describe('canonical authentication origins', () => {
  it('uses Forge production as the fail-closed default', () => {
    assert.equal(
      getCanonicalAuthOrigin({ NODE_ENV: 'production' }),
      'https://forge.forgedinlife.com'
    );
    assert.equal(
      getCanonicalAuthOrigin({
        NODE_ENV: 'production',
        FORGE_AUTH_ORIGIN: 'https://attacker.example',
      }),
      'https://forge.forgedinlife.com'
    );
  });

  it('permits only exact server-owned development origins', () => {
    assert.deepEqual(AUTH_ORIGIN_ALLOWLIST, [
      'https://forge.forgedinlife.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    assert.equal(
      getCanonicalAuthOrigin({
        NODE_ENV: 'development',
        FORGE_AUTH_ORIGIN: 'http://127.0.0.1:3000',
      }),
      'http://127.0.0.1:3000'
    );
    assert.equal(
      getCanonicalAuthOrigin({
        NODE_ENV: 'production',
        FORGE_AUTH_ORIGIN: 'https://forge.forgedinlife.com.attacker.example',
      }),
      'https://forge.forgedinlife.com'
    );
  });

  it('builds authentication URLs on the selected canonical origin', () => {
    assert.equal(
      buildCanonicalAuthUrl('/auth/callback?next=/onboarding', {
        NODE_ENV: 'production',
      }),
      'https://forge.forgedinlife.com/auth/callback?next=/onboarding'
    );
    assert.throws(() => buildCanonicalAuthUrl('//attacker.example/callback'));
    assert.throws(() => buildCanonicalAuthUrl('/\\attacker.example/callback'));
    assert.throws(() => buildCanonicalAuthUrl('https://attacker.example/callback'));
  });

  it('does not accept browser or request origins at authentication boundaries', () => {
    assert.doesNotMatch(signupForm, /window\.location\.origin/);
    assert.doesNotMatch(loginForm, /window\.location\.origin/);
    assert.doesNotMatch(authAction, /input\.origin/);
    assert.doesNotMatch(authAction, /origin:\s*string/);
    assert.doesNotMatch(confirmRoute, /\{\s*searchParams,\s*origin\s*\}/);
    assert.match(authAction, /buildCanonicalAuthUrl/);
    assert.match(confirmRoute, /buildCanonicalAuthUrl/);
  });
});
