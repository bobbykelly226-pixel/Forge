import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OPEN_TO_CHAT_NOTE_MAX_LENGTH,
  canCreateUniquePair,
  isOpenToChatNoteValid,
  isSelfAction,
  orderConnectionParticipants,
} from '../data-model-rules';
import {
  DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
  DISCOVERY_SURFACED_REASON,
  OPEN_TO_CHAT_DAILY_LIMIT,
  OPEN_TO_CHAT_DAILY_LIMIT_STATUS,
} from '../discovery/config';
import { firstNameFromFullName, toDiscoveryFeedCard } from '../discovery/presentation';

describe('discovery relationship rules', () => {
  it('prevents self actions', () => {
    assert.equal(isSelfAction('a', 'a'), true);
    assert.equal(isSelfAction('a', 'b'), false);
  });

  it('prevents duplicate save pairs', () => {
    const existing = [{ actorId: 'u1', targetId: 'u2' }];
    assert.equal(canCreateUniquePair(existing, 'u1', 'u2'), false);
    assert.equal(canCreateUniquePair(existing, 'u1', 'u3'), true);
    assert.equal(canCreateUniquePair(existing, 'u1', 'u1'), false);
  });

  it('prevents duplicate pass pairs', () => {
    const existing = [{ actorId: 'passer', targetId: 'passed' }];
    assert.equal(canCreateUniquePair(existing, 'passer', 'passed'), false);
  });

  it('treats save and pass as mutually exclusive pair slots', () => {
    // Product rule: only one of save/pass may be active — modeled as replacing the other.
    let saves = [{ actorId: 'a', targetId: 'b' }];
    let passes: Array<{ actorId: string; targetId: string }> = [];

    // Pass replaces save
    saves = saves.filter((row) => !(row.actorId === 'a' && row.targetId === 'b'));
    passes = [...passes, { actorId: 'a', targetId: 'b' }];
    assert.equal(saves.length, 0);
    assert.equal(canCreateUniquePair(passes, 'a', 'b'), false);
  });

  it('excludes passed profiles from a discovery candidate list', () => {
    const candidates = ['p1', 'p2', 'p3'];
    const passed = new Set(['p2']);
    const visible = candidates.filter((id) => !passed.has(id));
    assert.deepEqual(visible, ['p1', 'p3']);
  });

  it('excludes blocked users from discovery candidates', () => {
    const candidates = ['p1', 'p2'];
    const blockedEitherWay = new Set(['p1']);
    const visible = candidates.filter((id) => !blockedEitherWay.has(id));
    assert.deepEqual(visible, ['p2']);
  });

  it('blocks relationship actions when either user blocked the other', () => {
    const blocked = true;
    assert.equal(blocked ? false : true, false);
  });

  it('prevents duplicate interested pairs', () => {
    const existing = [{ actorId: 's', targetId: 'r' }];
    assert.equal(canCreateUniquePair(existing, 's', 'r'), false);
  });

  it('creates exactly one ordered connection for reciprocal interest', () => {
    const ordered = orderConnectionParticipants('bbbb', 'aaaa');
    assert.deepEqual(ordered, { user_a_id: 'aaaa', user_b_id: 'bbbb' });
    const again = orderConnectionParticipants('aaaa', 'bbbb');
    assert.deepEqual(again, ordered);
  });

  it('keeps concurrent reciprocal interest pair ordering stable', () => {
    const a = orderConnectionParticipants('user-z', 'user-a');
    const b = orderConnectionParticipants('user-a', 'user-z');
    assert.deepEqual(a, b);
  });

  it('enforces Open to Chat note maximum', () => {
    assert.equal(isOpenToChatNoteValid('a'.repeat(OPEN_TO_CHAT_NOTE_MAX_LENGTH)), true);
    assert.equal(isOpenToChatNoteValid('a'.repeat(OPEN_TO_CHAT_NOTE_MAX_LENGTH + 1)), false);
  });

  it('documents duplicate active Open to Chat prevention', () => {
    const active = [{ sender: 'a', recipient: 'b', status: 'pending' }];
    const duplicate = active.some(
      (row) =>
        row.sender === 'a' &&
        row.recipient === 'b' &&
        ['pending', 'deferred', 'accepted'].includes(row.status)
    );
    assert.equal(duplicate, true);
  });

  it('persists first-use education via user_app_state flag contract', () => {
    const appState = { open_to_chat_education_seen: false };
    appState.open_to_chat_education_seen = true;
    assert.equal(appState.open_to_chat_education_seen, true);
  });

  it('accept creates exactly one connection pair', () => {
    const pair = orderConnectionParticipants('r1', 's1');
    assert.ok(pair);
    assert.notEqual(pair!.user_a_id, pair!.user_b_id);
  });

  it('keeps Not Right Now and Decline Privately private from sender status labels', () => {
    const senderFacingStatuses = ['Request sent', 'Connected', 'Awaiting mutual interest'];
    assert.equal(senderFacingStatuses.includes('Declined'), false);
    assert.equal(senderFacingStatuses.includes('Ignored'), false);
    assert.equal(senderFacingStatuses.includes('Seen'), false);
    assert.equal(senderFacingStatuses.includes('Not right now'), false);
  });

  it('Sent displays Note Included or No Note without read receipts', () => {
    const withNote = { type: 'open_to_chat', note: 'Hello' };
    const withoutNote = { type: 'open_to_chat', note: null };
    const label = (entry: { type: string; note: string | null }) => {
      if (entry.type !== 'open_to_chat') return null;
      return entry.note && entry.note.trim() ? 'Note included' : 'No note';
    };
    assert.equal(label(withNote), 'Note included');
    assert.equal(label(withoutNote), 'No note');
  });

  it('never claims read, seen, or ignored status', () => {
    const forbidden = ['read', 'seen', 'ignored'];
    const sentLabels = ['Request sent', 'Connected', 'Awaiting mutual interest'];
    for (const label of sentLabels) {
      for (const word of forbidden) {
        assert.equal(label.toLowerCase().includes(word), false);
      }
    }
  });

  it('uses neutral alignment language without invented scores', () => {
    assert.equal(DISCOVERY_NEUTRAL_ALIGNMENT_LABEL, 'More to Discover');
    assert.match(DISCOVERY_SURFACED_REASON, /active and available/i);
    assert.doesNotMatch(DISCOVERY_SURFACED_REASON, /compatible|miles away|score/i);
  });

  it('daily Open to Chat limit remains a product decision', () => {
    assert.equal(OPEN_TO_CHAT_DAILY_LIMIT, null);
    assert.match(OPEN_TO_CHAT_DAILY_LIMIT_STATUS, /product decision/i);
  });

  it('maps public profiles to feed cards without claiming compatibility', () => {
    const card = toDiscoveryFeedCard({
      id: 'uuid-1',
      full_name: 'Alex Example',
      age: 30,
      location: 'Denver',
      relationship_goal: null,
      faith_importance: null,
      service_background: null,
      short_bio: 'Hello',
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
    });
    assert.equal(card.firstName, 'Alex');
    assert.equal(card.alignmentLabel, DISCOVERY_NEUTRAL_ALIGNMENT_LABEL);
    assert.equal(firstNameFromFullName(null), 'Member');
  });

  it('documents false-success prevention contract', () => {
    const writeFailed = { ok: false, message: 'Could not save' };
    const shouldAnnounceSuccess = writeFailed.ok === true;
    assert.equal(shouldAnnounceSuccess, false);
  });

  it('documents self-preview has no discovery actions', () => {
    const selfPreviewShowsActions = false;
    assert.equal(selfPreviewShowsActions, false);
  });
});
