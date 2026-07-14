import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  calculateProfileCompletionPercent,
  getProfileCompletionSections,
} from '../profile-completion';
import {
  MAX_PROFILE_PHOTOS,
  MAX_PROFILE_PHOTOS_MESSAGE,
  additionalPublicPhotoUrls,
  canAddAnotherProfilePhoto,
  createUniqueProfilePhotoPath,
  orderedPublicPhotoUrls,
  resolveAuthoritativeProfilePhotoUrl,
  sortPhotosByDisplayOrder,
} from '../profile-photo';
import {
  HAS_CHILDREN_OPTIONS,
  SERVICE_BACKGROUND_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  PETS_OPTIONS,
  RELOCATION_OPTIONS,
  FAITH_IDENTITY_OPTIONS,
  FAITH_IMPORTANCE_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
} from '../profile/structured-options';
import type { Profile } from '../types/profile';

function minimalProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    full_name: 'Alex Example',
    age: 32,
    location: 'Denver, CO',
    location_city: 'Denver',
    location_region: 'CO',
    location_country: 'US',
    relationship_goal: 'marriage',
    faith_identity: 'catholic',
    faith_tradition: null,
    faith_other: null,
    faith_importance: 'very_important',
    has_children: 'no',
    children_count: null,
    children: 'open',
    open_to_partner_with_children: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    education: 'bachelors',
    pets: 'no_pets',
    relocation: 'possibly',
    career: 'Nurse',
    service_background: 'Healthcare background',
    service_backgrounds: ['healthcare'],
    short_bio: 'Hello',
    more_about: 'More',
    things_i_enjoy: ['Camping'],
    favorite_music_artists: ['Zach Bryan'],
    favorite_music_songs: ['Something'],
    profile_photo_url: 'https://example.com/p.jpg',
    unmapped_legacy_fields: {},
    status: 'active',
    is_discoverable: true,
    onboarding_completed_at: null,
    profile_completed_at: null,
    last_active_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Profile;
}

describe('mobile structured controls', () => {
  it('uses shared ChoiceChips catalogs for all structured fields — no separate mobile defs', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const choices = readFileSync(
      join(process.cwd(), 'components/profile/StructuredChoices.tsx'),
      'utf8'
    );

    assert.match(choices, /data-structured-control-type="single"/);
    assert.match(choices, /data-structured-control-type="multi"/);
    assert.match(choices, /type="radio"/);
    assert.match(choices, /type="checkbox"/);
    assert.match(choices, /grid grid-cols-1/);
    assert.match(choices, /min-h-11/);
    assert.doesNotMatch(choices, /md:hidden|lg:hidden|sm:hidden/);

    for (const name of [
      'has_children',
      'children_count',
      'children',
      'open_to_partner_with_children',
      'service_backgrounds',
      'smoking',
      'drinking',
      'education',
      'pets',
      'relocation',
      'faith_identity',
      'faith_importance',
      'relationship_goal',
    ]) {
      assert.match(workspace, new RegExp(`name="${name}"`));
    }

    assert.match(workspace, /HAS_CHILDREN_OPTIONS/);
    assert.match(workspace, /SERVICE_BACKGROUND_OPTIONS/);
    assert.match(workspace, /ChoiceChips/);
    assert.match(workspace, /MultiChoiceChips/);
    assert.doesNotMatch(workspace, /name="has_children"[\s\S]{0,80}type="text"/);
    assert.doesNotMatch(workspace, /name="service_backgrounds"[\s\S]{0,80}type="text"/);
    assert.match(workspace, /name="career"/);
  });

  it('exports the same option catalogs for mobile and desktop', () => {
    assert.ok(HAS_CHILDREN_OPTIONS.length >= 3);
    assert.ok(SERVICE_BACKGROUND_OPTIONS.length >= 3);
    assert.ok(SMOKING_OPTIONS.length >= 3);
    assert.ok(DRINKING_OPTIONS.length >= 3);
    assert.ok(EDUCATION_OPTIONS.length >= 3);
    assert.ok(PETS_OPTIONS.length >= 3);
    assert.ok(RELOCATION_OPTIONS.length >= 3);
    assert.ok(FAITH_IDENTITY_OPTIONS.length >= 3);
    assert.ok(FAITH_IMPORTANCE_OPTIONS.length >= 3);
    assert.ok(RELATIONSHIP_GOAL_OPTIONS.length >= 3);
  });

  it('keeps children conditional behavior and separate faith fields', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    assert.match(workspace, /hasChildren === 'yes'/);
    assert.match(workspace, /name="faith_identity"/);
    assert.match(workspace, /name="faith_importance"/);
    assert.match(workspace, /name="children"/);
    assert.match(workspace, /name="open_to_partner_with_children"/);
  });
});

describe('profile completion at 100%', () => {
  it('shows completion UI below 100% and hides both at exactly 100%', () => {
    const incomplete = getProfileCompletionSections({
      profile: minimalProfile({ short_bio: null, things_i_enjoy: [] }),
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    });
    const incompletePercent = calculateProfileCompletionPercent(incomplete);
    assert.ok(incompletePercent < 100);

    const complete = getProfileCompletionSections({
      profile: minimalProfile(),
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    });
    const completePercent = calculateProfileCompletionPercent(complete);
    assert.equal(completePercent, 100);

    const hub = readFileSync(
      join(process.cwd(), 'components/profile/MyProfileHub.tsx'),
      'utf8'
    );
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    assert.match(hub, /showCompletionUi = completionPercent < 100/);
    assert.match(hub, /profile-completion-summary/);
    assert.match(workspace, /showCompletionUi = completionPercent < 100/);
    assert.match(workspace, /profile-completion-checklist/);
    assert.doesNotMatch(hub, /100% complete banner|fully complete/i);
    assert.doesNotMatch(workspace, /100% complete banner|fully complete/i);
  });

  it('restores completion UI when percent falls below 100', () => {
    const complete = getProfileCompletionSections({
      profile: minimalProfile(),
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    });
    assert.equal(calculateProfileCompletionPercent(complete), 100);

    const dropped = getProfileCompletionSections({
      profile: minimalProfile({ short_bio: null }),
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    });
    assert.ok(calculateProfileCompletionPercent(dropped) < 100);
  });

  it('documents that completion never gates Discovery', () => {
    const hub = readFileSync(
      join(process.cwd(), 'components/profile/MyProfileHub.tsx'),
      'utf8'
    );
    assert.match(hub, /never required for Discovery/);
    assert.match(hub, /DiscoveryVisibilityToggle/);
  });
});

describe('multiple profile photos', () => {
  it('enforces a centralized maximum of 6 photos', () => {
    assert.equal(MAX_PROFILE_PHOTOS, 6);
    assert.equal(canAddAnotherProfilePhoto(5), true);
    assert.equal(canAddAnotherProfilePhoto(6), false);
    assert.match(MAX_PROFILE_PHOTOS_MESSAGE, /up to 6/i);
  });

  it('uses unique user-scoped storage paths', () => {
    const a = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'aaa');
    const b = createUniqueProfilePhotoPath('user-1', 'image/jpeg', 'bbb');
    assert.equal(a.startsWith('user-1/'), true);
    assert.notEqual(a, b);
  });

  it('keeps public display order aligned with saved display_order', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const photos = [
      { storage_path: 'u/b.jpg', is_primary: false, display_order: 1 },
      { storage_path: 'u/a.jpg', is_primary: true, display_order: 0 },
      { storage_path: 'u/c.jpg', is_primary: false, display_order: 2 },
    ];
    const ordered = sortPhotosByDisplayOrder(photos);
    assert.deepEqual(
      ordered.map((photo) => photo.storage_path),
      ['u/a.jpg', 'u/b.jpg', 'u/c.jpg']
    );
    const urls = orderedPublicPhotoUrls({ photos });
    assert.deepEqual(urls, [
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/a.jpg',
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/b.jpg',
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/c.jpg',
    ]);
    const additional = additionalPublicPhotoUrls(photos);
    assert.deepEqual(additional, [
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/b.jpg',
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/c.jpg',
    ]);
    assert.equal(
      resolveAuthoritativeProfilePhotoUrl({ photos }),
      'https://example.supabase.co/storage/v1/object/public/profile-photos/u/a.jpg'
    );
  });

  it('wires multi-photo manager and public additional photos', () => {
    const manager = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoManager.tsx'),
      'utf8'
    );
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const presentation = readFileSync(
      join(process.cwd(), 'components/discovery/PublicProfilePresentation.tsx'),
      'utf8'
    );
    const actions = readFileSync(join(process.cwd(), 'app/actions/profile.ts'), 'utf8');

    assert.match(manager, /profile-photo-manager/);
    assert.match(manager, /Set as primary/);
    assert.match(manager, /Move photo earlier/);
    assert.match(manager, /Move photo later/);
    assert.match(manager, /Add photo/);
    assert.match(manager, /Remove/);
    assert.match(workspace, /ProfilePhotoManager/);
    assert.match(presentation, /additional-photos/);
    assert.match(actions, /export async function addProfilePhoto/);
    assert.match(actions, /export async function deleteProfilePhoto/);
    assert.match(actions, /export async function setPrimaryProfilePhoto/);
    assert.match(actions, /export async function reorderProfilePhotos/);
    assert.match(actions, /MAX_PROFILE_PHOTOS/);
    assert.match(actions, /startsWith\(`\$\{user\.id\}\/`\)/);
  });

  it('promotes the next ordered photo when deleting primary', () => {
    const photos = [
      { id: 'a', is_primary: true, display_order: 0 },
      { id: 'b', is_primary: false, display_order: 1 },
      { id: 'c', is_primary: false, display_order: 2 },
    ];
    const remaining = photos.filter((photo) => photo.id !== 'a');
    const promote = [...remaining].sort((a, b) => a.display_order - b.display_order)[0];
    assert.equal(promote?.id, 'b');
  });
});
