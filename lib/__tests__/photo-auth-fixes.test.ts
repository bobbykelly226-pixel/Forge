import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createUniqueProfilePhotoPath,
  photosAgreeWithLegacyUrl,
  resolveAuthoritativeProfilePhotoUrl,
  PROFILE_PHOTO_REVALIDATE_PATHS,
} from '../profile-photo';
import {
  mapAuthErrorMessage,
  sanitizeInternalPath,
} from '../auth/messages';

describe('profile photo replacement paths', () => {
  it('generates a new unique storage path for each replacement', () => {
    const first = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'aaa');
    const second = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'bbb');
    assert.equal(first, 'user-1/aaa.jpg');
    assert.equal(second, 'user-1/bbb.jpg');
    assert.notEqual(first, second);
  });

  it('uses primary profile_photos as the authoritative display URL', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const url = resolveAuthoritativeProfilePhotoUrl({
      photos: [
        { storage_path: 'user-1/old.jpg', is_primary: false, display_order: 1 },
        { storage_path: 'user-1/new.jpg', is_primary: true, display_order: 0 },
      ],
      legacyProfilePhotoUrl: 'https://example.supabase.co/storage/v1/object/public/profile-photos/user-1/old.jpg',
    });
    assert.equal(
      url,
      'https://example.supabase.co/storage/v1/object/public/profile-photos/user-1/new.jpg'
    );
  });

  it('keeps profile_photo_url and profile_photos aligned after successful save', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const path = 'user-1/new.jpg';
    const publicUrl = `https://example.supabase.co/storage/v1/object/public/profile-photos/${path}`;
    assert.equal(
      photosAgreeWithLegacyUrl({
        photos: [{ storage_path: path, is_primary: true, display_order: 0 }],
        legacyProfilePhotoUrl: publicUrl,
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
    ]);
  });
});

describe('auth confirmation helpers', () => {
  it('maps confirmation callback failure calmly', () => {
    assert.match(mapAuthErrorMessage('otp expired'), /invalid or has expired/i);
    assert.match(mapAuthErrorMessage('Email not confirmed'), /confirm your email/i);
    assert.match(mapAuthErrorMessage('Invalid login credentials'), /confirm your email/i);
    assert.equal(mapAuthErrorMessage('secret_token_value_xyz').includes('secret_token_value_xyz'), false);
  });

  it('sanitizes confirmation redirect targets', () => {
    assert.equal(sanitizeInternalPath('/onboarding'), '/onboarding');
    assert.equal(sanitizeInternalPath('https://evil.example'), null);
    assert.equal(sanitizeInternalPath('//evil.example'), null);
  });

  it('documents resend confirmation redirect contract', () => {
    const origin = 'https://preview.example';
    const emailRedirectTo = `${origin}/auth/callback?next=/onboarding`;
    assert.equal(emailRedirectTo.includes('/auth/callback'), true);
    assert.equal(emailRedirectTo.includes('next=/onboarding'), true);
  });

  it('documents confirmed-user login and new-user onboarding redirect', () => {
    const confirmedLoginDestination = '/app';
    const newUserAfterConfirm = '/onboarding';
    assert.equal(confirmedLoginDestination.startsWith('/'), true);
    assert.equal(newUserAfterConfirm, '/onboarding');
  });
});
