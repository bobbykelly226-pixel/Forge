import type { ConversationListItem } from '@/lib/conversations/types';

/** Return the existing conversation for a peer, if any. */
export function findConversationForPeer(
  conversations: ConversationListItem[],
  peerUserId: string
): ConversationListItem | null {
  return conversations.find((item) => item.peerUserId === peerUserId) ?? null;
}

/** Extract a UUID connection_id from relationship RPC payloads. */
export function connectionIdFromRpcData(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const value = (data as Record<string, unknown>).connection_id;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('local-')) return null;
  return trimmed;
}

/** True when a connection id is safe to pass to ensure_conversation_for_connection. */
export function isPersistedConnectionId(connectionId: string | null | undefined): boolean {
  if (!connectionId) return false;
  if (connectionId.startsWith('local-')) return false;
  if (connectionId.startsWith('seed-')) return false;
  return true;
}
