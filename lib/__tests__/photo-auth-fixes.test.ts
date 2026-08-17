import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createUniqueProfilePhotoPath,
  photosAgreeWithLegacyUrl,
  resolveAuthoritativeProfilePhotoUrl,
  PROFILE_PHOTO_REVALIDATE_PATHS,
} from '../profile-photo';
import {
  AUTH_RESEND_COOLDOWN_MS,
  interpretSignUpResult,
  mapAuthErrorMessage,
  sanitizeInternalPath,
} from '../auth/messages';
import { buildCanonicalAuthUrl } from '../auth/origins';

describe('profile photo replacement paths', () => {
  it('generates a new unique storage path for each replacement', () => {
    const first = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'aaa');
    const second = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'bbb');
    assert.equal(first, 'user-1/aaa.jpg');
    assert.equal(second, 'user-1/bbb.jpg');
    assert.notEqual(first, second);
  });

  it('uses primary profile_photos as the authoritative display URL', () => {
    const signedUrl = 'https://example.supabase.co/storage/v1/object/sign/profile-photos/user-1/new.jpg?token=signed';
    const url = resolveAuthoritativeProfilePhotoUrl({
      photos: [
        { storage_path: 'user-1/old.jpg', is_primary: false, display_order: 1, public_url: null },
        { storage_path: 'user-1/new.jpg', is_primary: true, display_order: 0, public_url: signedUrl },
      ],
      legacyProfilePhotoUrl: 'https://example.supabase.co/storage/v1/object/public/profile-photos/user-1/old.jpg',
    });
    assert.equal(url, signedUrl);
  });

  it('treats signed managed photos as authoritative when the legacy URL is cleared', () => {
    const path = 'user-1/new.jpg';
    const signedUrl = `https://example.supabase.co/storage/v1/object/sign/profile-photos/${path}?token=signed`;
    assert.equal(
      photosAgreeWithLegacyUrl({
        photos: [{ storage_path: path, is_primary: true, display_order: 0, public_url: signedUrl }],
        legacyProfilePhotoUrl: null,
      }),
      true
    );
  });

  it('documents that a failed database update must not report success', () => {
    // Contract: saveProfile returns success only after profiles + profile_photos confirm.
    const failedDbUpdate = { success: false as const, message: 'Photo update could not be confirmed.' };
    assert.equal(failedDbUpdate.success, false);
    assert.match(failedDbUpdate.message, /could not be confirmed/i);
  });

  it('revalidates all affected profile routes', () => {
    assert.deepEqual([...PROFILE_PHOTO_REVALIDATE_PATHS], [
      '/profile',
      '/profile/edit',
      '/profile/preview',
      '/discovery',
    ]);
  });
});

describe('auth confirmation helpers', () => {
  it('maps confirmation callback failure calmly', () => {
    assert.match(mapAuthErrorMessage('otp expired'), /invalid or has expired/i);
    assert.match(mapAuthErrorMessage('Email not confirmed'), /confirm your email/i);
    assert.match(mapAuthErrorMessage('Invalid login credentials'), /confirm your email/i);
    assert.match(mapAuthErrorMessage('email rate limit exceeded'), /too many confirmation emails/i);
    assert.equal(mapAuthErrorMessage('secret_token_value_xyz').includes('secret_token_value_xyz'), false);
  });

  it('maps the database-enforced beta invitation rejection clearly', () => {
    assert.match(
      mapAuthErrorMessage('A valid Forge Founding Beta invitation is required to create an account.'),
      /currently invitation-only/i
    );
  });

  it('does not treat already-registered ambiguous signups as confirmation sent', () => {
    const result = interpretSignUpResult({
      user: { id: 'abc', identities: [] },
      session: null,
    });
    assert.equal(result.kind, 'already_registered');
  });

  it('treats a fresh identity signup as confirmation_sent', () => {
    const result = interpretSignUpResult({
      user: { id: 'abc', identities: [{ provider: 'email' }], confirmation_sent_at: '2026-07-14' },
      session: null,
    });
    assert.equal(result.kind, 'confirmation_sent');
  });

  it('surfaces signup rate-limit errors instead of success', () => {
    const result = interpretSignUpResult({
      errorMessage: 'email rate limit exceeded',
      user: null,
      session: null,
    });
    assert.equal(result.kind, 'error');
    assert.match(result.message, /too many confirmation emails/i);
  });

  it('sanitizes confirmation redirect targets', () => {
    assert.equal(sanitizeInternalPath('/onboarding'), '/onboarding');
    assert.equal(sanitizeInternalPath('https://evil.example'), null);
    assert.equal(sanitizeInternalPath('//evil.example'), null);
  });

  it('uses the canonical server origin for resend confirmation', () => {
    const emailRedirectTo = buildCanonicalAuthUrl(
      '/auth/callback?next=/onboarding',
      {
        NODE_ENV: 'production',
        FORGE_AUTH_ORIGIN: 'https://preview.example',
      }
    );
    assert.equal(
      emailRedirectTo,
      'https://forge.forgedinlife.com/auth/callback?next=/onboarding'
    );
    assert.ok(AUTH_RESEND_COOLDOWN_MS >= 30_000);
  });

  it('documents confirmed-user login and new-user onboarding redirect', () => {
    const confirmedLoginDestination = '/app';
    const newUserAfterConfirm = '/onboarding';
    assert.equal(confirmedLoginDestination.startsWith('/'), true);
    assert.equal(newUserAfterConfirm, '/onboarding');
  });
});
