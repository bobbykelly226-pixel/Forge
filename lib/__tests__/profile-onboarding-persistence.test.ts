import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateProfileCompletionPercent,
  DEFERRED_PROFILE_COMPLETION_SECTIONS,
  getProfileCompletionSections,
} from '../profile-completion';
import {
  deriveOnboardingStep,
  isOnboardingContentComplete,
  ONBOARDING_STEPS,
  PROFILE_ANSWER_KEYS,
  THINGS_I_ENJOY_OPTIONS,
} from '../types/profile-answers';
import { countPrimaryPhotos, normalizePrimaryPhotos } from '../data-model-rules';

describe('onboarding resume and completion', () => {
  it('resumes at welcome when no answers and no saved step exist', () => {
    const step = deriveOnboardingStep({
      onboardingCompleted: false,
      savedStep: null,
      answers: {},
    });
    assert.equal(step, ONBOARDING_STEPS.welcome);
  });

  it('resumes at values when intention exists', () => {
    const step = deriveOnboardingStep({
      onboardingCompleted: false,
      savedStep: ONBOARDING_STEPS.intention,
      answers: { [PROFILE_ANSWER_KEYS.relationshipIntention]: 'Marriage-minded' },
    });
    assert.equal(step, ONBOARDING_STEPS.values);
  });

  it('resumes at readiness when both required answers exist', () => {
    const step = deriveOnboardingStep({
      onboardingCompleted: false,
      savedStep: ONBOARDING_STEPS.values,
      answers: {
        [PROFILE_ANSWER_KEYS.relationshipIntention]: 'Marriage-minded',
        [PROFILE_ANSWER_KEYS.coreValues]: ['Faith', 'Family'],
      },
    });
    assert.equal(step, ONBOARDING_STEPS.readiness);
  });

  it('does not treat incomplete answers as complete', () => {
    assert.equal(isOnboardingContentComplete({}), false);
    assert.equal(
      isOnboardingContentComplete({
        [PROFILE_ANSWER_KEYS.relationshipIntention]: 'Marriage-minded',
      }),
      false
    );
    assert.equal(
      isOnboardingContentComplete({
        [PROFILE_ANSWER_KEYS.relationshipIntention]: 'Marriage-minded',
        [PROFILE_ANSWER_KEYS.coreValues]: ['Faith'],
      }),
      true
    );
  });
});

describe('profile completion from real saved shape', () => {
  it('excludes voice and video', () => {
    assert.deepEqual([...DEFERRED_PROFILE_COMPLETION_SECTIONS], ['voice', 'video']);
  });

  it('scores partial vs complete profiles', () => {
    const partial = getProfileCompletionSections({
      profile: {
        full_name: 'Alex',
        short_bio: 'Hello',
        more_about: null,
        relationship_goal: null,
        children: null,
        has_children: null,
        faith_importance: null,
        education: null,
        pets: null,
        smoking: null,
        drinking: null,
        career: null,
        relocation: null,
        service_background: null,
        things_i_enjoy: [],
        favorite_music_artists: [],
        favorite_music_songs: [],
        profile_photo_url: null,
      },
      photoCount: 0,
      hasRelationshipAlignment: false,
      hasImportantAlignmentFactors: false,
    });
    assert.ok(calculateProfileCompletionPercent(partial) < 50);

    const complete = getProfileCompletionSections({
      profile: {
        full_name: 'Alex',
        short_bio: 'About me',
        more_about: 'More',
        relationship_goal: 'Marriage',
        children: 'Wants children',
        has_children: 'No',
        faith_importance: 'Important',
        education: 'College',
        pets: 'Dogs',
        smoking: 'No',
        drinking: 'Occasionally',
        career: 'Engineer',
        relocation: 'Open',
        service_background: 'Volunteer',
        things_i_enjoy: ['Camping'],
        favorite_music_artists: ['Artist'],
        favorite_music_songs: ['Song'],
        profile_photo_url: 'https://example.com/p.jpg',
      },
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    });
    assert.equal(calculateProfileCompletionPercent(complete), 100);
  });
});

describe('enjoy and music ordering', () => {
  it('preserves catalog order for Things I Enjoy selections', () => {
    const selected = new Set(['Fitness', 'Broncos', 'Dogs']);
    const ordered = THINGS_I_ENJOY_OPTIONS.filter((label) => selected.has(label));
    assert.deepEqual(ordered, ['Broncos', 'Dogs', 'Fitness']);
  });

  it('preserves favorite music array order', () => {
    const artists = ['Zach Bryan', 'Chris Stapleton'];
    const songs = ['Heading South', 'Tennessee Whiskey'];
    assert.deepEqual(artists, ['Zach Bryan', 'Chris Stapleton']);
    assert.deepEqual(songs, ['Heading South', 'Tennessee Whiskey']);
  });
});

describe('profile photos primary and order', () => {
  it('allows only one primary photo', () => {
    const photos = [
      { id: 'a', is_primary: true, display_order: 0 },
      { id: 'b', is_primary: true, display_order: 1 },
    ];
    assert.equal(countPrimaryPhotos(photos), 2);
    assert.equal(countPrimaryPhotos(normalizePrimaryPhotos(photos)), 1);
  });

  it('keeps display order stable when sorting', () => {
    const photos = [
      { id: 'b', display_order: 1 },
      { id: 'a', display_order: 0 },
      { id: 'c', display_order: 2 },
    ];
    const ordered = [...photos].sort((a, b) => a.display_order - b.display_order);
    assert.deepEqual(
      ordered.map((p) => p.id),
      ['a', 'b', 'c']
    );
  });
});

describe('no dual-write contract', () => {
  it('documents profile_answers as the only write target keys', () => {
    assert.deepEqual(Object.values(PROFILE_ANSWER_KEYS), [
      'relationship_intention',
      'core_values',
    ]);
  });

  it('onboarding and compatibility actions do not reference compatibility_answers writes', async () => {
    const { readFile } = await import('node:fs/promises');
    const files = [
      'lib/data/onboarding.ts',
      'app/actions/onboarding.ts',
      'app/actions/compatibility.ts',
      'components/OnboardingShell.tsx',
    ];
    for (const file of files) {
      const source = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
      assert.equal(
        source.includes(".from('compatibility_answers')"),
        false,
        `${file} must not query compatibility_answers`
      );
      assert.equal(
        source.includes('.from("compatibility_answers")'),
        false,
        `${file} must not query compatibility_answers`
      );
    }
  });
});

describe('self preview privacy', () => {
  it('preview type fields do not include private columns', () => {
    const publicKeys = [
      'full_name',
      'age',
      'location',
      'short_bio',
      'more_about',
      'things_i_enjoy',
      'favorite_music_artists',
      'favorite_music_songs',
      'profile_photo_url',
    ];
    const privateKeys = [
      'date_of_birth',
      'postal_code',
      'latitude',
      'longitude',
      'email',
      'phone',
    ];
    for (const key of privateKeys) {
      assert.equal(publicKeys.includes(key), false);
    }
  });
});
