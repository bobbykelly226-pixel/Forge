import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  PROFILE_SECTIONS,
  checklistItemToSectionId,
  summarizeProfileSection,
} from '../profile/sections';
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
    drinking: null,
    education: null,
    pets: 'no_pets',
    relocation: 'possibly',
    career: 'Nurse',
    service_background: 'Healthcare background',
    service_backgrounds: ['healthcare'],
    short_bio: 'Hello',
    more_about: null,
    things_i_enjoy: ['Camping'],
    favorite_music_artists: ['Zach Bryan'],
    favorite_music_songs: [],
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

describe('unified My Profile workspace', () => {
  it('defines editable profile sections without Voice/Video as editable', () => {
    const editable = PROFILE_SECTIONS.filter((section) => section.editable);
    assert.ok(editable.some((section) => section.id === 'relationship'));
    assert.ok(editable.some((section) => section.id === 'location'));
    assert.ok(editable.some((section) => section.id === 'faith'));
    assert.equal(
      PROFILE_SECTIONS.find((section) => section.id === 'voice')?.comingSoon,
      true
    );
    assert.equal(
      PROFILE_SECTIONS.find((section) => section.id === 'video')?.comingSoon,
      true
    );
  });

  it('summarizes current saved values for each section', () => {
    const profile = minimalProfile();
    assert.match(summarizeProfileSection('basics', profile), /Alex Example/);
    assert.equal(summarizeProfileSection('location', profile), 'Denver, CO');
    assert.equal(summarizeProfileSection('relationship', profile), 'Marriage');
    assert.equal(summarizeProfileSection('smoking', profile), 'Never');
    assert.match(summarizeProfileSection('about', profile), /Hello/);
    assert.equal(
      summarizeProfileSection('about', minimalProfile({ short_bio: null, more_about: 'Legacy more' })),
      'Legacy more'
    );
    assert.ok(!PROFILE_SECTIONS.some((section) => String(section.id) === 'more_about'));
  });

  it('maps checklist items to the correct editable sections', () => {
    const profile = minimalProfile({ short_bio: null, drinking: null });
    assert.equal(checklistItemToSectionId('photos', profile), 'photo');
    assert.equal(checklistItemToSectionId('about', profile), 'about');
    assert.equal(checklistItemToSectionId('alignment', profile), 'relationship');
    assert.equal(checklistItemToSectionId('enjoy', profile), 'enjoy');
    assert.equal(checklistItemToSectionId('music', profile), 'music');
    assert.equal(checklistItemToSectionId('factors', profile), 'factors');
    // details focuses first incomplete lifestyle/details section
    assert.equal(checklistItemToSectionId('details', profile), 'drinking');
  });

  it('keeps a single authoritative editor on /profile and redirects /profile/edit', () => {
    const hub = readFileSync(
      join(process.cwd(), 'components/profile/MyProfileHub.tsx'),
      'utf8'
    );
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const editPage = readFileSync(
      join(process.cwd(), 'app/profile/edit/page.tsx'),
      'utf8'
    );
    const profilePage = readFileSync(
      join(process.cwd(), 'app/profile/page.tsx'),
      'utf8'
    );

    assert.match(hub, /ProfileWorkspace/);
    assert.match(hub, /ForgeDesktopAppNav/);
    assert.match(workspace, /saveProfileSection/);
    assert.match(workspace, /openFromChecklist/);
    assert.doesNotMatch(workspace, /href="\/profile\/edit"/);
    assert.match(editPage, /redirect\('\/profile'\)/);
    assert.match(profilePage, /MyProfileHub/);
    assert.equal(
      (() => {
        try {
          readFileSync(join(process.cwd(), 'app/profile/edit/ProfileForm.tsx'), 'utf8');
          return true;
        } catch {
          return false;
        }
      })(),
      false,
      'legacy full-page ProfileForm must not remain as a second editor'
    );
  });

  it('simplifies preview footer to Manage My Profile without competing edit buttons', () => {
    const preview = readFileSync(
      join(process.cwd(), 'components/profile/SelfProfilePreviewCard.tsx'),
      'utf8'
    );
    assert.match(preview, /Manage My Profile/);
    assert.match(preview, /href="\/profile"/);
    assert.doesNotMatch(preview, /Edit Profile/);
    assert.doesNotMatch(preview, /Back to My Profile/);
    assert.doesNotMatch(preview, /href="\/profile\/edit"/);
    assert.match(preview, /mode="self-preview"/);
  });

  it('documents section save states without full-page navigation', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    assert.match(workspace, /'idle' \| 'editing' \| 'saving' \| 'saved' \| 'error'/);
    assert.match(workspace, /Save section/);
    assert.match(workspace, /Cancel/);
    assert.doesNotMatch(workspace, /router\.push\('\/profile\/edit'\)/);
  });
});
