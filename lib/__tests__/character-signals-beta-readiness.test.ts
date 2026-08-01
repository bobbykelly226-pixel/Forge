import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  CHARACTER_SIGNAL_DEFINITIONS,
  PUBLIC_DISPLAY_THRESHOLD,
} from '../character-signals/catalog';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Character Signals beta readiness', () => {
  it('locks the positive catalog and public threshold', () => {
    assert.equal(CHARACTER_SIGNAL_DEFINITIONS.length, 8);
    assert.equal(PUBLIC_DISPLAY_THRESHOLD, 3);
    assert.deepEqual(
      CHARACTER_SIGNAL_DEFINITIONS.map((signal) => signal.id),
      [
        'respectful_communicator',
        'great_listener',
        'clear_intentions',
        'kind_conversation',
        'genuine_and_present',
        'consistent_follow_through',
        'respectful_in_person',
        'handled_mismatch_respectfully',
      ]
    );
  });

  it('enforces meaningful interaction, anti-stuffing, blocking, RLS and private table grants', () => {
    const migration = read('supabase/migrations/20260731193000_character_signals_beta_readiness.sql');
    assert.match(migration, /message\.sender_id = p_giver_id/);
    assert.match(migration, /message\.sender_id = p_receiver_id/);
    assert.match(migration, /forge_users_blocked\(p_giver_id, p_receiver_id\)/);
    assert.match(migration, /unique index[^;]*[\s\S]*?giver_id, receiver_id/);
    assert.match(migration, /enable row level security/);
    assert.match(migration, /revoke all on table public\.character_signals from public, anon, authenticated/);
    assert.match(migration, /coalesce\(\(auth\.jwt\(\) ->> 'is_anonymous'\)::boolean, false\)/);
  });

  it('requires three accepted confirmations and recipient approval for public output', () => {
    const migration = read('supabase/migrations/20260731193000_character_signals_beta_readiness.sql');
    assert.match(migration, /v_count >= 3/);
    assert.match(migration, /pref\.is_public/);
    assert.match(migration, /having count\(\*\) >= 3/);
    assert.match(migration, /cs\.status = 'approved'/);
    assert.match(migration, /set status = 'declined'/);
  });

  it('loads live data and keeps the use-server module export-safe', () => {
    const page = read('app/character-signals/page.tsx');
    const actions = read('app/actions/character-signals.ts');
    const provider = read('components/character-signals/CharacterSignalsProvider.tsx');
    assert.match(page, /loadMyCharacterSignals/);
    assert.match(page, /redirect\('\/login\?redirectTo=\/character-signals'\)/);
    assert.doesNotMatch(provider, /INITIAL_USER_SIGNALS|RECOGNITION_RECIPIENTS/);
    const exported = [...actions.matchAll(/export (?:async )?function\s+(\w+)/g)];
    assert.ok(exported.length >= 3);
    assert.ok(exported.every((match) => actions.slice(match.index, match.index + 30).includes('async')));
  });

  it('uses real aggregate counts on live public profiles and separates support from safety', () => {
    const profile = read('app/discovery/profile/[profileId]/page.tsx');
    const sections = read('components/discovery/ProfileAlignmentSections.tsx');
    const contact = read('app/contact/page.tsx');
    assert.match(profile, /loadPublicCharacterSignals/);
    assert.match(sections, /characterSignals \?\?/);
    assert.match(contact, /Send Beta Feedback/);
    assert.match(contact, /Report or Block/);
  });

  it('lets eligible viewers recognize a positive quality from the viewed profile', () => {
    const page = read('app/discovery/profile/[profileId]/page.tsx');
    const view = read('components/discovery/DiscoveryProfileView.tsx');
    const presentation = read('components/discovery/PublicProfilePresentation.tsx');
    const sections = read('components/discovery/ProfileAlignmentSections.tsx');
    const signals = read('components/character-signals/PublicCharacterSignalsSection.tsx');
    const actions = read('app/actions/character-signals.ts');

    assert.match(page, /loadCharacterSignalRecognitionRecipient\(profileId\)/);
    assert.match(view, /recognitionRecipient=\{recognitionRecipient\}/);
    assert.match(presentation, /recognitionRecipient=\{recognitionRecipient\}/);
    assert.match(sections, /recognitionRecipient=\{recognitionRecipient\}/);
    assert.match(signals, /Recognize a Positive Quality/);
    assert.match(signals, /RecognitionFlowDrawer/);
    assert.match(signals, /giveCharacterSignalAction/);
    assert.match(actions, /revalidatePath\('\/discovery\/profile\/\[profileId\]', 'page'\)/);
  });
  it('integrates receiving and visibility management into My Profile', () => {
    const page = read('app/profile/page.tsx');
    const hub = read('components/profile/MyProfileHub.tsx');
    const profileSignals = read('components/profile/CharacterSignalsProfileSection.tsx');
    const actions = read('app/actions/character-signals.ts');

    assert.match(page, /loadMyCharacterSignals/);
    assert.match(page, /CharacterSignalsProvider initialData=\{characterSignalsDashboard\}/);
    assert.match(hub, /CharacterSignalsProfileSection/);
    assert.match(profileSignals, /NewRecognitionSection/);
    assert.match(profileSignals, /PrivateSignalsSection/);
    assert.match(profileSignals, /VisibleOnProfileSection/);
    assert.match(profileSignals, /View Recognition History/);
    assert.match(actions, /revalidatePath\('\/profile'\)/);
  });

});
