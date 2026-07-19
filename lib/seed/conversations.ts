/**
 * Client-safe seed conversation fixtures. Never written to Supabase.
 */

import type {
  ConversationListItem,
  ConversationMessage,
  ConversationThreadMeta,
} from '@/lib/conversations/types';
import { getSeedMutualConnectionProfiles, getSeedProfileById } from '@/lib/seed/catalog';
import { photos } from '@/lib/seed/catalog';

const SEED_VIEWER_ID = 'seed-demo-viewer';

function seedConversationId(profileId: string): string {
  return `seed-conversation-${profileId}`;
}

function seedConnectionId(profileId: string): string {
  return `seed-connection-${profileId}`;
}

function photoFor(profileId: string): string | null {
  const profile = getSeedProfileById(profileId);
  if (!profile) return null;
  return photos(profile.photoFiles)[0]?.public_url ?? null;
}

/** Fixture states for QA */
export type SeedConversationFixtureKind =
  | 'active_unread'
  | 'active_read'
  | 'empty_mutual'
  | 'ended'
  | 'insufficient_context';

const FIXTURE_KINDS: Record<string, SeedConversationFixtureKind> = {
  'seed-amanda-cole': 'active_unread',
  'seed-nicole-hayes': 'active_read',
  'seed-lauren-price': 'empty_mutual',
  'seed-kristin-walsh': 'insufficient_context',
  'seed-matthew-ruiz': 'ended',
};

export function isSeedConversationId(id: string): boolean {
  return id.startsWith('seed-conversation-');
}

export function seedPeerIdFromConversationId(conversationId: string): string | null {
  if (!isSeedConversationId(conversationId)) return null;
  return conversationId.replace(/^seed-conversation-/, '');
}

export function buildSeedConversationList(): ConversationListItem[] {
  const mutuals = getSeedMutualConnectionProfiles();
  const featuredIds = Object.keys(FIXTURE_KINDS);
  const selected = mutuals.filter((profile) => featuredIds.includes(profile.id));

  return selected
    .map((profile) => {
      const kind = FIXTURE_KINDS[profile.id] ?? 'active_read';
      const base: ConversationListItem = {
        conversationId: seedConversationId(profile.id),
        connectionId: seedConnectionId(profile.id),
        status: kind === 'ended' ? 'ended' : 'active',
        createdAt: '2026-07-10T15:00:00.000Z',
        lastMessageAt: null,
        peerUserId: profile.id,
        peerFirstName: profile.firstName,
        peerAge: profile.age,
        peerPhotoUrl: photoFor(profile.id),
        latestMessageBody: null,
        latestMessageAt: null,
        latestMessageSenderId: null,
        unread: false,
        isSeed: true,
      };

      if (kind === 'active_unread') {
        return {
          ...base,
          lastMessageAt: '2026-07-18T18:20:00.000Z',
          latestMessageAt: '2026-07-18T18:20:00.000Z',
          latestMessageBody: 'I’d enjoy hearing what a meaningful weekend looks like for you.',
          latestMessageSenderId: profile.id,
          unread: true,
        };
      }
      if (kind === 'active_read') {
        return {
          ...base,
          lastMessageAt: '2026-07-17T21:05:00.000Z',
          latestMessageAt: '2026-07-17T21:05:00.000Z',
          latestMessageBody: 'Thanks for sharing that — it helps me understand what matters to you.',
          latestMessageSenderId: SEED_VIEWER_ID,
          unread: false,
        };
      }
      return base;
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.createdAt;
      const bTime = b.lastMessageAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    });
}

export function buildSeedThreadMeta(
  conversationId: string
): ConversationThreadMeta | null {
  const peerId = seedPeerIdFromConversationId(conversationId);
  if (!peerId) return null;
  const profile = getSeedProfileById(peerId);
  if (!profile) return null;
  const kind = FIXTURE_KINDS[peerId] ?? 'active_read';
  return {
    conversationId,
    connectionId: seedConnectionId(peerId),
    status: kind === 'ended' ? 'ended' : 'active',
    createdAt: '2026-07-10T15:00:00.000Z',
    lastMessageAt: kind.startsWith('active') ? '2026-07-18T18:20:00.000Z' : null,
    peerUserId: peerId,
    peerFirstName: profile.firstName,
    peerFullName: `${profile.firstName} ${profile.lastName}`,
    peerAge: profile.age,
    peerPhotoUrl: photoFor(peerId),
    isBlocked: false,
    isSeed: true,
  };
}

export function buildSeedMessages(conversationId: string): ConversationMessage[] {
  const peerId = seedPeerIdFromConversationId(conversationId);
  if (!peerId) return [];
  const kind = FIXTURE_KINDS[peerId] ?? 'active_read';
  if (kind === 'empty_mutual' || kind === 'insufficient_context') return [];

  const common: ConversationMessage[] = [
    {
      id: `${conversationId}-m1`,
      conversationId,
      senderId: SEED_VIEWER_ID,
      body: 'It is good to connect here. I appreciated what you shared about how you approach relationships.',
      clientMessageId: null,
      createdAt: '2026-07-17T20:40:00.000Z',
      localStatus: 'sent',
    },
    {
      id: `${conversationId}-m2`,
      conversationId,
      senderId: peerId,
      body: 'Thank you — that means a lot. I try to be clear about what I value without rushing anything.',
      clientMessageId: null,
      createdAt: '2026-07-17T20:55:00.000Z',
      localStatus: 'sent',
    },
  ];

  if (kind === 'active_unread') {
    return [
      ...common,
      {
        id: `${conversationId}-m3`,
        conversationId,
        senderId: peerId,
        body: 'I’d enjoy hearing what a meaningful weekend looks like for you.',
        clientMessageId: null,
        createdAt: '2026-07-18T18:20:00.000Z',
        localStatus: 'sent',
      },
    ];
  }

  if (kind === 'ended') {
    return [
      ...common,
      {
        id: `${conversationId}-m3`,
        conversationId,
        senderId: SEED_VIEWER_ID,
        body: 'I hope this helped us understand each other a little better.',
        clientMessageId: null,
        createdAt: '2026-07-18T12:00:00.000Z',
        localStatus: 'sent',
      },
    ];
  }

  return [
    ...common,
    {
      id: `${conversationId}-m3`,
      conversationId,
      senderId: SEED_VIEWER_ID,
      body: 'Thanks for sharing that — it helps me understand what matters to you.',
      clientMessageId: null,
      createdAt: '2026-07-17T21:05:00.000Z',
      localStatus: 'sent',
    },
  ];
}

export function buildSeedMutualAcknowledgment(profileId: string): {
  firstName: string;
  photoUrl: string | null;
  alignmentSummary: string;
  alignmentLabel: string;
} | null {
  const profile = getSeedProfileById(profileId);
  if (!profile) return null;
  return {
    firstName: profile.firstName,
    photoUrl: photoFor(profileId),
    alignmentLabel: profile.alignmentLabel,
    alignmentSummary:
      profile.sharedStrengths[0] ??
      'Forge introduced you based on the answers you have both completed so far.',
  };
}
