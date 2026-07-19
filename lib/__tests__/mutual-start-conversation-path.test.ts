import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { planStartMutualConversation } from '@/lib/conversations/start-mutual-conversation';
import type { MutualConnectionItem } from '@/lib/data/connections-hub';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

/** Same shape the Mutual tab receives from loadConnectionsHub(). */
function realMutualItem(overrides?: Partial<MutualConnectionItem>): MutualConnectionItem {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Bobby',
    age: 40,
    location: 'Birmingham, AL',
    alignmentLabel: 'Strong Alignment',
    confidence: 'Clear',
    hasImportantFactors: true,
    aboutPreview: 'Building thoughtfully.',
    characterSignals: [],
    portraitGradient: 'linear-gradient(160deg, #1B2F4A 0%, #3E566F 50%, #A8927D 100%)',
    photoUrl: null,
    connectionId: '22222222-2222-4222-8222-222222222222',
    source: 'mutual_interest',
    relativeTime: '2 hours ago',
    ...overrides,
  };
}

describe('real Mutual page Start Conversation path', () => {
  it('Mutual tab renders MutualConnectionCard from hub prototype', () => {
    const hub = read('components/connections/ConnectionsHubPrototype.tsx');
    const page = read('app/connections/page.tsx');
    assert.match(hub, /MutualConnectionCard/);
    assert.match(hub, /visibleMutual\.map/);
    assert.match(page, /loadConnectionsHubAction/);
    assert.match(page, /ConnectionsHubProvider/);
    assert.match(page, /viewerUserId=\{user\.id\}/);
  });

  it('MutualConnectionCard invokes startMutualConversation with connectionId and component name', () => {
    const cards = read('components/connections/ConnectionCards.tsx');
    assert.match(cards, /export function MutualConnectionCard/);
    assert.match(cards, /startMutualConversation\(/);
    assert.match(cards, /'MutualConnectionCard'/);
    assert.match(
      cards,
      /'connectionId' in profile \? profile\.connectionId : undefined,\s*'MutualConnectionCard'/
    );
    assert.doesNotMatch(cards, /Not yet messaging/);
    assert.doesNotMatch(
      cards,
      /Messaging will be available here once the communication system is connected/
    );
    assert.doesNotMatch(cards, /Messaging is coming later/i);
    assert.doesNotMatch(cards, /messaging will be available later/i);
    // Production stub hid the button after click; live path keeps Start/Open.
    assert.doesNotMatch(cards, /!ready \? \(/);
    assert.doesNotMatch(cards, /ready && !isSeed/);
  });

  it('hub provider plans ensure_conversation_for_connection for real UUID mutuals', () => {
    const provider = read('components/connections/ConnectionsHubProvider.tsx');
    assert.match(provider, /planStartMutualConversation/);
    assert.match(provider, /ensureConversationAction/);
    assert.match(provider, /logStartMutualConversationTrace/);
    assert.doesNotMatch(provider, /Messaging is coming later/);
    assert.doesNotMatch(provider, /setMutualConversationReady/);
    assert.doesNotMatch(
      provider,
      /announce\(`You're connected with \$\{profileName\}\.`, 'Messaging is coming later\.'\)/
    );
  });

  it('uses the same MutualConnectionItem connection UUID Lisa’s Mutual card carries', () => {
    const mutual = realMutualItem();
    const lisaUserId = '33333333-3333-4333-8333-333333333333';

    const plan = planStartMutualConversation({
      componentName: 'MutualConnectionCard',
      currentUserId: lisaUserId,
      peerUserId: mutual.id,
      peerFirstName: mutual.firstName,
      connectionId: mutual.connectionId,
      mutualConnectionId: mutual.connectionId,
      existingConversationId: null,
      isSeedPeer: false,
    });

    assert.equal(plan.action, 'ensure');
    if (plan.action !== 'ensure') return;
    assert.equal(plan.connectionId, '22222222-2222-4222-8222-222222222222');
    assert.equal(plan.rpc, 'ensure_conversation_for_connection');
    assert.equal(plan.handler, 'startMutualConversation');
    assert.doesNotMatch(plan.connectionId, /^local-/);
    assert.doesNotMatch(plan.connectionId, /^seed-/);
  });

  it('reuses an existing conversation instead of calling ensure again', () => {
    const mutual = realMutualItem();
    const plan = planStartMutualConversation({
      componentName: 'MutualConnectionCard',
      currentUserId: '33333333-3333-4333-8333-333333333333',
      peerUserId: mutual.id,
      peerFirstName: mutual.firstName,
      connectionId: mutual.connectionId,
      mutualConnectionId: mutual.connectionId,
      existingConversationId: '44444444-4444-4444-8444-444444444444',
      isSeedPeer: false,
    });

    assert.equal(plan.action, 'navigate_existing');
    if (plan.action !== 'navigate_existing') return;
    assert.equal(plan.conversationId, '44444444-4444-4444-8444-444444444444');
    assert.equal(plan.rpc, 'skipped_existing');
  });

  it('never plans the production stub path for local-* connection ids', () => {
    const mutual = realMutualItem({ connectionId: 'local-interest-abc' });
    const plan = planStartMutualConversation({
      componentName: 'MutualConnectionCard',
      currentUserId: '33333333-3333-4333-8333-333333333333',
      peerUserId: mutual.id,
      peerFirstName: mutual.firstName,
      connectionId: mutual.connectionId,
      mutualConnectionId: mutual.connectionId,
      existingConversationId: null,
      isSeedPeer: false,
    });

    assert.equal(plan.action, 'blocked');
    if (plan.action !== 'blocked') return;
    assert.equal(plan.rpc, 'skipped_no_connection_id');
    assert.doesNotMatch(plan.reason, /available later/i);
    assert.doesNotMatch(plan.reason, /coming later/i);
  });

  it('routes seed peers to seed conversation ids without ensure RPC', () => {
    const plan = planStartMutualConversation({
      componentName: 'MutualConnectionCard',
      currentUserId: '33333333-3333-4333-8333-333333333333',
      peerUserId: 'seed-amanda-cole',
      peerFirstName: 'Amanda',
      connectionId: 'seed-connection-amanda',
      mutualConnectionId: 'seed-connection-amanda',
      existingConversationId: null,
      isSeedPeer: true,
    });
    assert.equal(plan.action, 'navigate_seed');
    if (plan.action !== 'navigate_seed') return;
    assert.equal(plan.conversationId, 'seed-conversation-seed-amanda-cole');
    assert.equal(plan.rpc, 'skipped_seed');
  });
});
