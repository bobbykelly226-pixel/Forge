import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { planStartMutualConversation } from '@/lib/conversations/start-mutual-conversation';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const LISA_USER_ID = '33333333-3333-4333-8333-333333333333';
const BOBBY_USER_ID = '11111111-1111-4111-8111-111111111111';
const CONNECTION_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '44444444-4444-4444-8444-444444444444';

describe('profile-level Start Conversation production path', () => {
  it('Discovery profile page resolves active mutual connection id for live peers', () => {
    const page = read('app/discovery/profile/[profileId]/page.tsx');
    assert.match(page, /getActiveConnectionIdWithPeer/);
    assert.match(page, /listMyConversationsAction/);
    assert.match(page, /findConversationForPeer/);
    assert.match(page, /mutualConnectionId=\{mutualConnectionId\}/);
    assert.match(page, /existingConversationId=\{existingConversationId\}/);
    assert.match(page, /viewerUserId=\{user\.id\}/);
  });

  it('profile view only treats persisted connection ids as live mutuals', () => {
    const view = read('components/discovery/DiscoveryProfileView.tsx');
    assert.match(view, /isPersistedConnectionId\(mutualConnectionId\)/);
    assert.match(view, /DiscoveryProfileConversationCta/);
    assert.match(view, /connectionId=\{liveMutualConnectionId\}/);
    assert.match(view, /viewerUserId=\{viewerUserId\}/);
    assert.doesNotMatch(view, /Conversation tools will appear/);
    assert.doesNotMatch(view, /available later/i);
    assert.doesNotMatch(view, /coming later/i);
    assert.doesNotMatch(view, /coming soon/i);
  });

  it('profile CTA uses the same planner + ensure path as MutualConnectionCard', () => {
    const cta = read('components/discovery/DiscoveryProfileConversationCta.tsx');
    const cards = read('components/connections/ConnectionCards.tsx');
    const provider = read('components/connections/ConnectionsHubProvider.tsx');

    assert.match(cta, /planStartMutualConversation/);
    assert.match(cta, /ensureConversationAction/);
    assert.match(cta, /logStartMutualConversationTrace/);
    assert.match(cta, /componentName: 'DiscoveryProfileConversationCta'/);
    assert.match(cta, /\/connections\/c\/\$\{/);
    assert.match(provider, /planStartMutualConversation/);
    assert.match(provider, /ensureConversationAction/);
    assert.match(cards, /'MutualConnectionCard'/);
    assert.doesNotMatch(cta, /Messaging is coming later/i);
    assert.doesNotMatch(cta, /available later/i);
    assert.doesNotMatch(cta, /coming soon/i);
    assert.doesNotMatch(cta, /router\.push\('\/connections\?tab=mutual'\)/);
  });

  it('resolves a real mutual connection UUID for profile Start Conversation', () => {
    const plan = planStartMutualConversation({
      componentName: 'DiscoveryProfileConversationCta',
      currentUserId: BOBBY_USER_ID,
      peerUserId: LISA_USER_ID,
      peerFirstName: 'Lisa',
      connectionId: CONNECTION_ID,
      mutualConnectionId: CONNECTION_ID,
      existingConversationId: null,
      isSeedPeer: false,
    });

    assert.equal(plan.action, 'ensure');
    if (plan.action !== 'ensure') return;
    assert.equal(plan.connectionId, CONNECTION_ID);
    assert.equal(plan.rpc, 'ensure_conversation_for_connection');
    assert.equal(plan.handler, 'startMutualConversation');
  });

  it('reuses an existing conversation instead of calling ensure again', () => {
    const plan = planStartMutualConversation({
      componentName: 'DiscoveryProfileConversationCta',
      currentUserId: BOBBY_USER_ID,
      peerUserId: LISA_USER_ID,
      peerFirstName: 'Lisa',
      connectionId: CONNECTION_ID,
      mutualConnectionId: CONNECTION_ID,
      existingConversationId: CONVERSATION_ID,
      isSeedPeer: false,
    });

    assert.equal(plan.action, 'navigate_existing');
    if (plan.action !== 'navigate_existing') return;
    assert.equal(plan.conversationId, CONVERSATION_ID);
    assert.equal(plan.rpc, 'skipped_existing');
  });

  it('opens the canonical thread route for profile and mutual entry points', () => {
    const cta = read('components/discovery/DiscoveryProfileConversationCta.tsx');
    const provider = read('components/connections/ConnectionsHubProvider.tsx');
    assert.match(cta, /router\.push\(`\/connections\/c\/\$\{/);
    assert.match(provider, /router\.push\(`\/connections\/c\/\$\{/);
  });

  it('hides Start Conversation when there is no persisted mutual connection', () => {
    const cta = read('components/discovery/DiscoveryProfileConversationCta.tsx');
    assert.match(
      cta,
      /if \(!isSeed && !persistedConnectionId && !existingConversationId\) \{\s*return null;/
    );

    const blocked = planStartMutualConversation({
      componentName: 'DiscoveryProfileConversationCta',
      currentUserId: BOBBY_USER_ID,
      peerUserId: LISA_USER_ID,
      peerFirstName: 'Lisa',
      connectionId: null,
      mutualConnectionId: null,
      existingConversationId: null,
      isSeedPeer: false,
    });
    assert.equal(blocked.action, 'blocked');
    if (blocked.action !== 'blocked') return;
    assert.doesNotMatch(blocked.reason, /available later/i);
    assert.doesNotMatch(blocked.reason, /coming later/i);
    assert.doesNotMatch(blocked.reason, /coming soon/i);
  });

  it('mobile and desktop profile CTAs share one DiscoveryProfileConversationCta component', () => {
    const view = read('components/discovery/DiscoveryProfileView.tsx');
    const cta = read('components/discovery/DiscoveryProfileConversationCta.tsx');
    // Single footer CTA; responsive layout only (flex-col / sm:flex-row), not separate handlers.
    assert.equal((view.match(/DiscoveryProfileConversationCta/g) ?? []).length, 2); // import + JSX
    assert.match(cta, /sm:flex-row/);
    assert.match(cta, /planStartMutualConversation/);
    assert.equal((cta.match(/ensureConversationAction/g) ?? []).length, 2); // import + call
  });

  it('Mutual card and profile CTA both call the same canonical start-conversation planner', () => {
    const mutualPlan = planStartMutualConversation({
      componentName: 'MutualConnectionCard',
      currentUserId: BOBBY_USER_ID,
      peerUserId: LISA_USER_ID,
      peerFirstName: 'Lisa',
      connectionId: CONNECTION_ID,
      mutualConnectionId: CONNECTION_ID,
      existingConversationId: null,
      isSeedPeer: false,
    });
    const profilePlan = planStartMutualConversation({
      componentName: 'DiscoveryProfileConversationCta',
      currentUserId: BOBBY_USER_ID,
      peerUserId: LISA_USER_ID,
      peerFirstName: 'Lisa',
      connectionId: CONNECTION_ID,
      mutualConnectionId: CONNECTION_ID,
      existingConversationId: null,
      isSeedPeer: false,
    });

    assert.equal(mutualPlan.action, 'ensure');
    assert.equal(profilePlan.action, 'ensure');
    if (mutualPlan.action !== 'ensure' || profilePlan.action !== 'ensure') return;
    assert.equal(mutualPlan.connectionId, profilePlan.connectionId);
    assert.equal(mutualPlan.rpc, profilePlan.rpc);
    assert.equal(mutualPlan.handler, profilePlan.handler);
  });

  it('authenticated messaging entry points have no placeholder stub copy', () => {
    const files = [
      'components/discovery/DiscoveryProfileConversationCta.tsx',
      'components/discovery/DiscoveryProfileView.tsx',
      'components/connections/ConnectionCards.tsx',
      'components/connections/ConnectionsHubProvider.tsx',
      'components/connections/AcceptChatDrawer.tsx',
      'components/OpenToChatDrawer.tsx',
    ];
    for (const file of files) {
      const source = read(file);
      assert.doesNotMatch(source, /Messaging is coming later/i, file);
      assert.doesNotMatch(source, /messaging will be available later/i, file);
      assert.doesNotMatch(
        source,
        /Messaging will be available here once the communication system is connected/,
        file
      );
      assert.doesNotMatch(source, /Conversation tools will appear/i, file);
      assert.doesNotMatch(source, /Conversation Ready/, file);
      assert.doesNotMatch(
        source,
        /Prototype only — no real message, notification, or chat was created/,
        file
      );
    }
  });
});
