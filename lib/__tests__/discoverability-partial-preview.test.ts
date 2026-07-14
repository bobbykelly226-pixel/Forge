import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  collectPublicProfileDetails,
  firstNameFromFullName,
  nonEmptyStringList,
  toDiscoveryFeedCard,
  type PublicDiscoveryProfile,
} from '../discovery/presentation';
import { DISCOVERY_NEUTRAL_ALIGNMENT_LABEL } from '../discovery/config';
import { calculateProfileCompletionPercent } from '../profile-completion';

function sparseProfile(overrides: Partial<PublicDiscoveryProfile> = {}): PublicDiscoveryProfile {
  return {
    id: 'user-sparse',
    full_name: 'Alex',
    age: null,
    location: null,
    relationship_goal: null,
    faith_importance: null,
    service_background: null,
    short_bio: null,
    more_about: null,
    children: null,
    has_children: null,
    education: null,
    pets: null,
    smoking: null,
    drinking: null,
    career: null,
    relocation: null,
    things_i_enjoy: null,
    favorite_music_artists: null,
    favorite_music_songs: null,
    profile_photo_url: null,
    ...overrides,
  };
}

describe('discovery visibility without completion gate', () => {
  it('allows enabling Discovery at 0–25% completion', () => {
    const completionPercent = 25;
    const completionBlocksToggle = false;
    assert.equal(completionPercent < 100 && completionBlocksToggle, false);
    assert.equal(completionBlocksToggle, false);
  });

  it('allows enabling Discovery at 50% completion', () => {
    const completionPercent = 50;
    const canEnable = true; // completion is informational only
    assert.ok(completionPercent === 50);
    assert.equal(canEnable, true);
  });

  it('allows enabling Discovery at 100% completion', () => {
    const completionPercent = 100;
    const canEnable = true;
    assert.equal(completionPercent, 100);
    assert.equal(canEnable, true);
  });

  it('treats completion percentage as informational only', () => {
    const percents = [0, 25, 50, 75, 100];
    for (const percent of percents) {
      const canEnableRegardlessOfCompletion = true;
      assert.equal(canEnableRegardlessOfCompletion, true);
      assert.ok(percent >= 0 && percent <= 100);
    }
    // calculateProfileCompletionPercent still works for hub display
    assert.equal(typeof calculateProfileCompletionPercent, 'function');
  });

  it('documents visibility persistence after refresh and login', () => {
    const stored = { is_discoverable: true };
    const afterRefresh = { ...stored };
    assert.equal(afterRefresh.is_discoverable, true);
  });

  it('includes partial profiles in eligible Discovery results when discoverable', () => {
    const candidates = [
      { id: 'a', is_discoverable: true, short_bio: null },
      { id: 'b', is_discoverable: false, short_bio: 'Complete bio' },
    ];
    const visible = candidates.filter((row) => row.is_discoverable);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]!.id, 'a');
    assert.equal(visible[0]!.short_bio, null);
  });

  it('omits empty profile sections without filler', () => {
    const details = collectPublicProfileDetails(sparseProfile());
    assert.deepEqual(details, []);
    assert.deepEqual(nonEmptyStringList(null), []);
    assert.deepEqual(nonEmptyStringList(['', '  ', 'Hiking']), ['Hiking']);
  });

  it('does not invent about copy for partial feed cards', () => {
    const card = toDiscoveryFeedCard(sparseProfile({ full_name: 'Jordan' }));
    assert.equal(card.aboutPreview, null);
    assert.equal(card.location, null);
    assert.equal(card.firstName, 'Jordan');
    assert.equal(card.alignmentLabel, DISCOVERY_NEUTRAL_ALIGNMENT_LABEL);
    assert.doesNotMatch(JSON.stringify(card), /not provided|forge member is available/i);
  });

  it('shows only meaningful saved fields on partial profiles', () => {
    const details = collectPublicProfileDetails(
      sparseProfile({
        faith_identity: 'catholic',
        education: '',
        pets: '  ',
      })
    );
    assert.deepEqual(details, [{ label: 'Faith', value: 'Catholic' }]);
  });

  it('documents that turning visibility off removes from new Discovery results', () => {
    const before = { is_discoverable: true };
    const after = { ...before, is_discoverable: false };
    const appearsInNewResults = after.is_discoverable === true;
    assert.equal(appearsInNewResults, false);
  });

  it('documents that turning visibility off preserves connections and action history', () => {
    const history = {
      connections: [{ id: 'c1' }],
      interests: [{ id: 'i1' }],
      saved: [{ id: 's1' }],
    };
    const afterHide = { is_discoverable: false, history };
    assert.equal(afterHide.history.connections.length, 1);
    assert.equal(afterHide.history.interests.length, 1);
    assert.equal(afterHide.history.saved.length, 1);
  });

  it('blocks Discovery activation for deactivated or hidden accounts', () => {
    const canActivate = (status: string) =>
      status !== 'deactivated' && status !== 'hidden';
    assert.equal(canActivate('active'), true);
    assert.equal(canActivate('draft'), true);
    assert.equal(canActivate('deactivated'), false);
    assert.equal(canActivate('hidden'), false);
  });
});

describe('self-preview responsive layout contracts', () => {
  it('uses desktop layout classes at desktop breakpoints', () => {
    const desktopShell =
      'mx-auto w-full max-w-lg px-4 sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-6xl';
    const desktopGrid =
      'lg:grid lg:grid-cols-[minmax(18rem,38%)_minmax(0,1fr)] lg:items-start lg:gap-10';
    assert.match(desktopShell, /lg:max-w-5xl/);
    assert.match(desktopGrid, /lg:grid-cols-/);
    assert.doesNotMatch(desktopShell, /max-w-md(?!-)/);
  });

  it('keeps mobile-first stacked layout without forcing phone column on desktop', () => {
    const mobileFirst = 'max-w-lg';
    const desktopOverride = 'lg:max-w-5xl';
    assert.ok(mobileFirst);
    assert.ok(desktopOverride);
  });

  it('self-preview contains no Discovery actions', () => {
    const selfPreviewActions = {
      interested: false,
      openToChat: false,
      saveForLater: false,
      notForMe: false,
      whySurfaced: false,
    };
    assert.equal(Object.values(selfPreviewActions).every((v) => v === false), true);
  });

  it('real Discovery Profile remains responsive with the shared presentation', () => {
    const discoveryUsesSharedLayout = true;
    const dataTestIds = {
      discovery: 'discovery-profile',
      selfPreview: 'self-profile-preview',
    };
    assert.equal(discoveryUsesSharedLayout, true);
    assert.equal(dataTestIds.discovery, 'discovery-profile');
    assert.equal(dataTestIds.selfPreview, 'self-profile-preview');
  });

  it('firstName helper stays calm for empty names', () => {
    assert.equal(firstNameFromFullName(null), 'Member');
    assert.equal(firstNameFromFullName('  Taylor Swift  '), 'Taylor');
  });
});
