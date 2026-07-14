import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFERRED_PROFILE_COMPLETION_SECTIONS,
  calculateProfileCompletionPercent,
  getProfileCompletionSections,
  type ProfileCompletionInput,
} from '../profile-completion';
import {
  DISCOVERABLE_PROFILE_COLUMNS,
  OPEN_TO_CHAT_NOTE_MAX_LENGTH,
  PRIVATE_OR_ADMIN_PROFILE_COLUMNS,
  canCreateUniquePair,
  countPrimaryPhotos,
  isOpenToChatNoteValid,
  isSelfAction,
  normalizePrimaryPhotos,
  orderConnectionParticipants,
} from '../data-model-rules';

describe('profile completion excludes Voice and Video', () => {
  it('does not include voice or video in counted sections', () => {
    const sections = getProfileCompletionSections({
      profile: null,
      photoCount: 0,
      hasRelationshipAlignment: false,
      hasImportantAlignmentFactors: false,
    });

    const ids = sections.map((section) => section.id);
    assert.equal(ids.includes('voice' as never), false);
    assert.equal(ids.includes('video' as never), false);
    assert.deepEqual([...DEFERRED_PROFILE_COMPLETION_SECTIONS], ['voice', 'video']);
  });

  it('does not reduce percent when voice/video are incomplete Coming Soon items', () => {
    const input: ProfileCompletionInput = {
      profile: {
        full_name: 'Alex',
        short_bio: 'About me',
        more_about: null,
        relationship_goal: 'Marriage',
        children: 'Wants children',
        has_children: 'No',
        faith_importance: 'Important',
        education: 'College',
        pets: 'Dogs',
        smoking: 'No',
        drinking: 'Occasionally',
        career: null,
        relocation: null,
        service_background: 'Volunteer',
        things_i_enjoy: ['Hiking'],
        favorite_music_artists: ['Artist'],
        favorite_music_songs: [],
        profile_photo_url: 'https://example.com/p.jpg',
      },
      photoCount: 1,
      hasRelationshipAlignment: true,
      hasImportantAlignmentFactors: true,
    };

    const sections = getProfileCompletionSections(input);
    const percent = calculateProfileCompletionPercent(sections);
    assert.equal(percent, 100);
  });
});

describe('Open to Chat note length', () => {
  it('allows null and notes up to 200 characters', () => {
    assert.equal(isOpenToChatNoteValid(null), true);
    assert.equal(isOpenToChatNoteValid(''), true);
    assert.equal(isOpenToChatNoteValid('a'.repeat(OPEN_TO_CHAT_NOTE_MAX_LENGTH)), true);
  });

  it('rejects notes over 200 characters', () => {
    assert.equal(isOpenToChatNoteValid('a'.repeat(201)), false);
    assert.equal(OPEN_TO_CHAT_NOTE_MAX_LENGTH, 200);
  });
});

describe('self-action prevention', () => {
  it('detects self actions', () => {
    assert.equal(isSelfAction('user-a', 'user-a'), true);
    assert.equal(isSelfAction('user-a', 'user-b'), false);
  });

  it('blocks unique-pair creation against self', () => {
    assert.equal(canCreateUniquePair([], 'user-a', 'user-a'), false);
  });
});

describe('duplicate relationship prevention', () => {
  it('allows the first save/pass/interest and blocks duplicates', () => {
    const existing = [{ actorId: 'user-a', targetId: 'user-b' }];
    assert.equal(canCreateUniquePair([], 'user-a', 'user-b'), true);
    assert.equal(canCreateUniquePair(existing, 'user-a', 'user-b'), false);
    assert.equal(canCreateUniquePair(existing, 'user-b', 'user-a'), true);
  });
});

describe('primary profile photo rule', () => {
  it('counts and normalizes to a single primary', () => {
    const photos = [
      { id: '1', is_primary: true },
      { id: '2', is_primary: true },
      { id: '3', is_primary: false },
    ];
    assert.equal(countPrimaryPhotos(photos), 2);
    const normalized = normalizePrimaryPhotos(photos);
    assert.equal(countPrimaryPhotos(normalized), 1);
    assert.equal(normalized[0]?.is_primary, true);
    assert.equal(normalized[1]?.is_primary, false);
  });
});

describe('connection participant ordering', () => {
  it('orders participants and rejects self-connections', () => {
    assert.equal(orderConnectionParticipants('aaa', 'aaa'), null);
    assert.deepEqual(orderConnectionParticipants('bbb', 'aaa'), {
      user_a_id: 'aaa',
      user_b_id: 'bbb',
    });
    assert.deepEqual(orderConnectionParticipants('aaa', 'bbb'), {
      user_a_id: 'aaa',
      user_b_id: 'bbb',
    });
  });
});

describe('discoverable profile privacy allow-list', () => {
  it('never includes private or admin fields in peer-visible columns', () => {
    for (const privateField of PRIVATE_OR_ADMIN_PROFILE_COLUMNS) {
      assert.equal(
        (DISCOVERABLE_PROFILE_COLUMNS as readonly string[]).includes(privateField),
        false,
        `${privateField} must not be peer-visible`
      );
    }
  });
});
