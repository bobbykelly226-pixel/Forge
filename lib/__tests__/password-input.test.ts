import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('password visibility toggle', () => {
  it('provides an accessible PasswordInput with eye toggle and safe defaults', () => {
    const source = read('components/auth/PasswordInput.tsx');
    assert.match(source, /Show password/);
    assert.match(source, /Hide password/);
    assert.match(source, /type=\{visible \? 'text' : 'password'\}/);
    assert.match(source, /EyeOff/);
    assert.match(source, /Eye /);
    assert.match(source, /aria-pressed=\{visible\}/);
    assert.match(source, /autoComplete: 'current-password' \| 'new-password'/);
    assert.doesNotMatch(source, /console\.(log|debug|info).*password/i);
  });

  it('wires show-password into login, signup, and update-password screens', () => {
    const login = read('app/login/LoginForm.tsx');
    const signup = read('app/signup/SignupForm.tsx');
    const update = read('app/auth/update-password/UpdatePasswordForm.tsx');
    const authActions = read('app/actions/auth.ts');

    assert.match(login, /PasswordInput/);
    assert.match(login, /autoComplete="current-password"/);
    assert.match(login, /autoComplete="email"/);

    assert.match(signup, /PasswordInput/);
    assert.match(signup, /Confirm password/);
    assert.match(signup, /autoComplete="new-password"/);
    assert.match(signup, /Passwords do not match/);

    assert.match(update, /PasswordInput/);
    assert.match(update, /autoComplete="new-password"/);
    assert.match(update, /Confirm new password/);
    assert.match(authActions, /auth\/update-password/);
  });
});
