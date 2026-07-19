import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { partnerSaidLabel, viewerSaidLabel } from '@/lib/compatibility/answer-labels';
import { buildConversationStarters } from '@/lib/conversations/starters';
import {
  buildSeedConversationList,
  buildSeedMessages,
  buildSeedThreadMeta,
  isSeedConversationId,
  seedPeerIdFromConversationId,
} from '@/lib/seed/conversations';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('conversation experience routes and wiring', () => {
  it('uses Connections Messages tab and dedicated thread route', () => {
    const tabs = read('components/connections/ConnectionsTabs.tsx');
    const page = read('app/connections/page.tsx');
    const thread = read('app/connections/c/[conversationId]/page.tsx');
    const nav = read('components/ForgeAppBottomNav.tsx');

    assert.match(tabs, /conversations/);
    assert.match(tabs, /Messages/);
    assert.match(page, /tab=conversations|initialTab|listMyConversationsAction/);
    assert.match(thread, /ConversationThread/);
    assert.match(nav, /\/connections\?tab=conversations/);
    assert.doesNotMatch(nav, /#messages/);
  });

  it('migration defines conversations, participants, messages, reports, and RPCs', () => {
    const migration = read(
      'supabase/migrations/20260719000000_conversation_experience_v1.sql'
    );
    assert.match(migration, /create table if not exists public\.conversations/);
    assert.match(migration, /create table if not exists public\.conversation_participants/);
    assert.match(migration, /create table if not exists public\.messages/);
    assert.match(migration, /create table if not exists public\.user_reports/);
    assert.match(migration, /ensure_conversation_for_connection/);
    assert.match(migration, /send_conversation_message/);
    assert.match(migration, /list_my_conversations/);
    assert.match(migration, /end_connection/);
    assert.match(migration, /block_user/);
    assert.match(migration, /report_user/);
    assert.match(migration, /Participants read conversations/);
    assert.match(migration, /Participants read messages/);
    assert.match(migration, /sender_id = auth\.uid\(\)/);
  });
});

describe('conversation starters', () => {
  it('grounds starters in shared interests and never fabricates them', () => {
    const starters = buildConversationStarters({
      peerFirstName: 'Amanda',
      thingsIEnjoy: ['Hiking', 'Cooking'],
      viewerThingsIEnjoy: ['Hiking', 'Chess'],
      career: null,
      sharedStrengthCopies: [],
    });
    assert.ok(starters.length >= 1);
    assert.match(starters[0]!.text, /Hiking/);
    assert.doesNotMatch(JSON.stringify(starters), /dealbreaker|pickup|🔥/i);
  });

  it('returns empty when data is insufficient', () => {
    const starters = buildConversationStarters({
      peerFirstName: 'Kristin',
      thingsIEnjoy: [],
      viewerThingsIEnjoy: [],
      career: null,
      sharedStrengthCopies: [],
    });
    assert.equal(starters.length, 0);
  });

  it('is deterministic for the same inputs', () => {
    const input = {
      peerFirstName: 'Nicole',
      thingsIEnjoy: ['Board games', 'Hiking'],
      viewerThingsIEnjoy: ['Board games'],
      career: 'Project manager',
      sharedStrengthCopies: ['Commitment intentions align'],
    };
    assert.deepEqual(buildConversationStarters(input), buildConversationStarters(input));
  });
});

describe('seed conversation isolation', () => {
  it('builds seed conversation fixtures without live uuid ids', () => {
    const list = buildSeedConversationList();
    assert.ok(list.length >= 3);
    for (const item of list) {
      assert.equal(item.isSeed, true);
      assert.ok(isSeedConversationId(item.conversationId));
      assert.ok(item.peerUserId.startsWith('seed-'));
      assert.doesNotMatch(item.peerFirstName, /seed-/);
    }
  });

  it('sorts seed conversations by recent activity', () => {
    const list = buildSeedConversationList();
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1]!;
      const curr = list[i]!;
      const prevTime = prev.lastMessageAt ?? prev.createdAt;
      const currTime = curr.lastMessageAt ?? curr.createdAt;
      assert.ok(prevTime >= currTime);
    }
  });

  it('includes unread, empty, and ended seed states', () => {
    const list = buildSeedConversationList();
    assert.ok(list.some((item) => item.unread));
    assert.ok(list.some((item) => !item.latestMessageBody && item.status === 'active'));
    assert.ok(list.some((item) => item.status === 'ended'));
  });

  it('maps seed conversation ids to peer profiles and messages', () => {
    const amandaId = 'seed-conversation-seed-amanda-cole';
    assert.equal(seedPeerIdFromConversationId(amandaId), 'seed-amanda-cole');
    const meta = buildSeedThreadMeta(amandaId);
    assert.ok(meta);
    assert.equal(meta!.peerFirstName, 'Amanda');
    const messages = buildSeedMessages(amandaId);
    assert.ok(messages.length > 0);
    assert.ok(messages.every((message) => message.conversationId === amandaId));
  });
});

describe('personalized attribution in conversation context', () => {
  it('uses You said and first-name said labels', () => {
    assert.equal(viewerSaidLabel(), 'You said');
    assert.equal(partnerSaidLabel('Amanda'), 'Amanda said');
    assert.equal(partnerSaidLabel('seed-amanda-cole'), 'This profile said');
    const thread = read('components/conversations/ConversationThread.tsx');
    assert.match(thread, /viewerSaidLabel/);
    assert.match(thread, /partnerSaidLabel/);
  });
});

describe('safety controls are present', () => {
  it('wires end, block, and report actions', () => {
    const menu = read('components/conversations/ConversationSafetyMenu.tsx');
    assert.match(menu, /End connection/);
    assert.match(menu, /Block/);
    assert.match(menu, /Report/);
    assert.match(menu, /endConnectionAction|blockUserAction|reportUserAction/);
  });
});
