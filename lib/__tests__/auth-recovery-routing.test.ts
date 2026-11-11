import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callbackDestination, callbackFailureOutcome } from '../auth/confirmation';
import { finishPasswordReset } from '../auth/password-reset';

test('recovery type wins over missing or conflicting destination', () => {
  for (const next of [null, '/onboarding', '/profile', '//evil.example']) {
    assert.equal(callbackDestination(next, 'recovery'), '/auth/update-password');
    assert.equal(callbackFailureOutcome('otp_expired', next, 'recovery'), 'recovery_link_error');
  }
  assert.equal(callbackFailureOutcome('access_denied', '/auth/update-password'), 'recovery_link_error');
  assert.equal(callbackDestination('/profile', 'signup'), '/profile');
  assert.equal(callbackFailureOutcome('otp_expired', '/onboarding', 'signup'), 'invalid_or_expired');
});

test('callback destinations reject external and backslash paths', () => {
  for (const next of ['https://evil.example', '//evil.example', '/\\evil.example']) {
    assert.equal(callbackDestination(next, 'signup'), '/onboarding');
  }
});

test('password reset revokes global sessions only after a successful update', async () => {
  const calls: string[] = [];
  const auth = {
    updateUser: async () => { calls.push('update'); return { error: null }; },
    signOut: async ({ scope }: { scope: string }) => { calls.push(scope); return { error: null }; },
  } as unknown as Parameters<typeof finishPasswordReset>[0];
  assert.equal((await finishPasswordReset(auth, 'test-only-password')).signedOut, true);
  assert.deepEqual(calls, ['update', 'global']);
  auth.updateUser = async () => ({ error: { message: 'weak password' } }) as never;
  calls.length = 0;
  assert.equal((await finishPasswordReset(auth, 'weak')).passwordUpdated, false);
  assert.deepEqual(calls, []);
});

test('failed revocation can retry without changing the password again', async () => {
  let updates = 0;
  let attempts = 0;
  const auth = {
    updateUser: async () => { updates++; return { error: null }; },
    signOut: async () => { attempts++; return { error: attempts === 1 ? { message: 'offline' } : null }; },
  } as unknown as Parameters<typeof finishPasswordReset>[0];
  const first = await finishPasswordReset(auth, 'test-only-password');
  assert.equal(first.passwordUpdated, true);
  assert.equal(first.signedOut, false);
  const retry = await finishPasswordReset(auth, 'test-only-password', first.passwordUpdated);
  assert.equal(retry.signedOut, true);
  assert.equal(updates, 1);
});

// Execute the actual callback effect with provider/browser boundaries mocked.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as confirmation from '../auth/confirmation';

test('actual callback handles hash recovery, expired links, code failures and confirmation', async () => {
  for (const scenario of [
    { query: '', hash: '#access_token=test&refresh_token=test&type=recovery', expected: '/auth/update-password' },
    { query: 'next=/auth/update-password', hash: '#error_code=otp_expired', expected: '/auth/result?outcome=recovery_link_error' },
    { query: 'type=recovery&token_hash=test', hash: '', expected: '/auth/update-password' },
    { query: 'type=recovery&code=test', hash: '', failCode: true, expected: '/auth/result?outcome=recovery_link_error' },
    { query: 'type=signup&token_hash=test&next=/profile', hash: '', expected: '/profile' },
    { query: '', hash: '#error_code=otp_expired', expected: '/auth/result?outcome=invalid_or_expired' },
  ]) {
    let effect: (() => void) | undefined;
    let destination: string | undefined;
    const testModule = { exports: {} as { Test: () => unknown } };
    const success = async (...args: unknown[]) => ({ success: true, redirectTo: args.at(-1) });
    const deps: Record<string, unknown> = {
      '@/lib/auth/confirmation': confirmation,
      '@/app/actions/auth-callback': {
        completeAuthWithCode: scenario.failCode ? async () => ({ success: false, outcome: 'confirmed_needs_signin' }) : success,
        completeAuthWithTokenHash: success,
        completeAuthFromExistingSession: success,
        ensureAuthFoundation: async () => ({ ok: true }),
      },
      '@/lib/supabase/client': { createClient: () => ({ auth: {
        setSession: async () => ({ error: null }),
        getSession: async () => ({}),
        getUser: async () => ({ data: { user: { id: 'test-user' } } }),
      } }) },
      'next/navigation': { useSearchParams: () => new URLSearchParams(scenario.query) },
      react: { useEffect: (fn: () => void) => { effect = fn; }, useRef: () => ({ current: false }), useState: () => ['', () => {}] },
      'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
    };
    const source = readFileSync('app/auth/callback/page.tsx', 'utf8') + '\nexport { AuthCallbackInner as Test };';
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    runInNewContext(code, { module: testModule, exports: testModule.exports, require: (id: string) => {
      if (!(id in deps)) throw new Error(`Unexpected dependency ${id}`);
      return deps[id];
    }, URLSearchParams, window: { location: { hash: scenario.hash, pathname: '/auth/callback', search: '', replace: (path: string) => { destination = path; } }, history: { replaceState: () => {} } } });
    testModule.exports.Test();
    effect!();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(destination, scenario.expected, JSON.stringify(scenario));
  }
});
