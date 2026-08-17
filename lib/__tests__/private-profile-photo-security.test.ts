import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260816130000_private_profile_photos_and_moderation.sql'
  ),
  'utf8'
);

describe('private profile photo security migration', () => {
  it('makes the bucket private and removes anonymous public reads', () => {
    assert.match(migration, /set public = false/);
    assert.match(migration, /drop policy if exists "Profile photos are publicly readable"/);
    assert.match(migration, /to authenticated/);
  });

  it('requires approved moderation and Discovery eligibility for non-owner reads', () => {
    assert.match(migration, /function private\.can_read_profile_photo_object/);
    assert.doesNotMatch(migration, /function public\.can_read_profile_photo_object/);
    assert.match(migration, /moderation_status = 'approved'/);
    assert.match(migration, /get_eligible_discovery_profile\(ph\.user_id\)/);
    assert.match(migration, /split_part\(p_name, '\/', 1\) = auth\.uid\(\)::text/);
  });

  it('defaults and resets uploaded or replaced photos to pending', () => {
    assert.match(migration, /moderation_status set default 'pending'/);
    assert.match(migration, /new\.moderation_status := 'pending'/);
    assert.match(migration, /new\.storage_path is distinct from old\.storage_path/);
  });

  it('clears legacy public URLs when the bucket becomes private', () => {
    assert.match(migration, /set profile_photo_url = null/);
  });

  it('signs owner photos before rendering the My Profile workspace', () => {
    const profilePage = readFileSync(
      join(process.cwd(), 'app/profile/page.tsx'),
      'utf8'
    );
    assert.match(profilePage, /signProfilePhotoRows\(supabase, photos\)/);
    assert.match(profilePage, /photos:\s*signedPhotos/);
    assert.match(profilePage, /photos=\{signedPhotos\.map\(toManagedProfilePhoto\)\}/);
  });
});
