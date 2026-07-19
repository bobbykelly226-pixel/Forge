import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { partnerSaidLabel, viewerSaidLabel } from '@/lib/compatibility/answer-labels';
import {
  normalizeComposerOutboundText,
  shouldSubmitComposerOnKeyDown,
} from '@/lib/conversations/composer';
import {
  connectionIdFromRpcData,
  findConversationForPeer,
  isPersistedConnectionId,
} from '@/lib/conversations/resolve';
import { buildConversationStarters } from '@/lib/conversations/starters';
import type { ConversationListItem } from '@/lib/conversations/types';
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
    const desktopNav = read('components/ForgeDesktopAppNav.tsx');

    assert.match(tabs, /conversations/);
    assert.match(tabs, /Messages/);
    assert.match(page, /tab=conversations|initialTab|listMyConversationsAction/);
    assert.match(thread, /ConversationThread/);
    assert.match(thread, /markConversationReadAction/);
    assert.match(nav, /\/connections\?tab=conversations/);
    assert.match(desktopNav, /\/connections\?tab=conversations/);
    assert.doesNotMatch(nav, /#messages/);
    assert.doesNotMatch(desktopNav, /#messages/);
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

describe('message composer polish', () => {
  it('enables native writing assistance on the message textarea', () => {
    const thread = read('components/conversations/ConversationThread.tsx');
    assert.match(thread, /<textarea[\s\S]*spellCheck=\{true\}/);
    assert.match(thread, /autoCorrect="on"/);
    assert.match(thread, /autoCapitalize="sentences"/);
    assert.match(thread, /inputMode="text"/);
    assert.match(thread, /shouldSubmitComposerOnKeyDown/);
    assert.match(thread, /normalizeComposerOutboundText/);
  });

  it('sends on Enter and keeps Shift+Enter as a newline', () => {
    assert.equal(
      shouldSubmitComposerOnKeyDown({ key: 'Enter', shiftKey: false }),
      true
    );
    assert.equal(
      shouldSubmitComposerOnKeyDown({ key: 'Enter', shiftKey: true }),
      false
    );
    assert.equal(
      shouldSubmitComposerOnKeyDown({ key: 'a', shiftKey: false }),
      false
    );
  });

  it('does not submit during IME / predictive composition', () => {
    assert.equal(
      shouldSubmitComposerOnKeyDown({
        key: 'Enter',
        shiftKey: false,
        isComposing: true,
      }),
      false
    );
    assert.equal(
      shouldSubmitComposerOnKeyDown({
        key: 'Enter',
        shiftKey: false,
        nativeEvent: { isComposing: true },
      }),
      false
    );
    assert.equal(
      shouldSubmitComposerOnKeyDown({
        key: 'Enter',
        shiftKey: false,
        nativeEvent: { keyCode: 229 },
      }),
      false
    );
  });

  it('trims whitespace-only messages and preserves non-empty content', () => {
    assert.equal(normalizeComposerOutboundText('   '), null);
    assert.equal(normalizeComposerOutboundText('\n\t'), null);
    assert.equal(normalizeComposerOutboundText(''), null);
    assert.equal(normalizeComposerOutboundText('  Hello Amanda  '), 'Hello Amanda');
    // Internal spacing and spelling are not rewritten by Forge.
    assert.equal(
      normalizeComposerOutboundText('I apreciate your note.'),
      'I apreciate your note.'
    );
  });
});

describe('navigation and mutual conversation integration', () => {
  it('Mutual cards show Start Conversation when no conversation exists', () => {
    const cards = read('components/connections/ConnectionCards.tsx');
    assert.match(cards, /existingConversation \? 'Open Conversation' : 'Start Conversation'/);
    assert.doesNotMatch(cards, /Conversation Ready/);
    assert.doesNotMatch(cards, /Messaging is coming later/i);
    assert.doesNotMatch(cards, /messaging will be available later/i);
  });

  it('either participant can start or open via ensure_conversation_for_connection', () => {
    const provider = read('components/connections/ConnectionsHubProvider.tsx');
    assert.match(provider, /ensureConversationAction/);
    assert.match(provider, /findConversationForPeer/);
    assert.match(provider, /isPersistedConnectionId/);
    assert.match(provider, /connectionIdFromRpcData/);
    assert.doesNotMatch(provider, /Messaging is coming later/);
    assert.doesNotMatch(provider, /local-\$\{requestId\}/);
    assert.doesNotMatch(provider, /local-interest-/);
  });

  it('existing conversation is reused and not duplicated in the hub client', () => {
    const existing: ConversationListItem = {
      conversationId: 'conv-1',
      connectionId: 'conn-1',
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      lastMessageAt: null,
      peerUserId: 'user-b',
      peerFirstName: 'Lisa',
      peerAge: 34,
      peerPhotoUrl: null,
      latestMessageBody: 'Hello',
      latestMessageAt: '2026-07-01T01:00:00.000Z',
      latestMessageSenderId: 'user-a',
      unread: true,
    };
    assert.equal(findConversationForPeer([existing], 'user-b')?.conversationId, 'conv-1');
    assert.equal(findConversationForPeer([existing], 'user-c'), null);
    assert.equal(isPersistedConnectionId('conn-1'), true);
    assert.equal(isPersistedConnectionId('local-abc'), false);
    assert.equal(isPersistedConnectionId('seed-connection-1'), false);
    assert.equal(
      connectionIdFromRpcData({ ok: true, connection_id: 'conn-99' }),
      'conn-99'
    );
    assert.equal(connectionIdFromRpcData({ ok: true, connection_id: 'local-x' }), null);
  });

  it('placeholder messaging copy is absent from the real Mutual / accept flow', () => {
    const accept = read('components/connections/AcceptChatDrawer.tsx');
    const provider = read('components/connections/ConnectionsHubProvider.tsx');
    const profileView = read('components/discovery/DiscoveryProfileView.tsx');
    const cta = read('components/discovery/DiscoveryProfileConversationCta.tsx');

    assert.doesNotMatch(accept, /Messaging is coming later/i);
    assert.doesNotMatch(accept, /coming soon/i);
    assert.match(accept, /Start Conversation/);
    assert.match(accept, /View Mutual Connections/);
    assert.doesNotMatch(provider, /Messaging is coming later/i);
    assert.doesNotMatch(profileView, /Conversation tools will appear/i);
    assert.match(cta, /ensureConversationAction/);
    assert.match(cta, /Start Conversation|Open Conversation/);
  });

  it('Messages nav opens the conversations hub route', () => {
    const bottom = read('components/ForgeAppBottomNav.tsx');
    const desktop = read('components/ForgeDesktopAppNav.tsx');
    assert.match(bottom, /id: 'messages'[\s\S]*href: '\/connections\?tab=conversations'/);
    assert.match(desktop, /id: 'messages'[\s\S]*href: '\/connections\?tab=conversations'/);
  });

  it('Conversation Hub displays received conversation fields including unread', () => {
    const hub = read('components/conversations/ConversationHub.tsx');
    assert.match(hub, /peerFirstName/);
    assert.match(hub, /peerPhotoUrl/);
    assert.match(hub, /latestMessageBody/);
    assert.match(hub, /formatConversationTimestamp/);
    assert.match(hub, /item\.unread/);
    assert.match(hub, /Connection ended/);
    assert.match(hub, /\/connections\/c\/\$\{item\.conversationId\}/);
  });

  it('opening the thread marks the conversation read', () => {
    const threadPage = read('app/connections/c/[conversationId]/page.tsx');
    assert.match(threadPage, /markConversationReadAction/);
  });

  it('seed injection does not replace real production conversations', () => {
    const page = read('app/connections/page.tsx');
    assert.match(page, /must never hide real production conversations/);
    assert.match(page, /seedConversations\.filter/);
    assert.doesNotMatch(
      page,
      /if \(seedConnectionsInjected\) \{\s*conversations = buildSeedConversationList\(\);\s*\}/
    );
  });
});

