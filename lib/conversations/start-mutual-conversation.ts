import {
  isPersistedConnectionId,
} from '@/lib/conversations/resolve';

export type StartMutualConversationInput = {
  /** UI entry point, e.g. MutualConnectionCard */
  componentName: string;
  currentUserId: string | null;
  peerUserId: string;
  peerFirstName: string;
  /** connectionId passed from the Mutual card */
  connectionId?: string | null;
  /** Fallback from hub mutual list */
  mutualConnectionId?: string | null;
  existingConversationId?: string | null;
  isSeedPeer: boolean;
};

export type StartMutualConversationPlan =
  | {
      action: 'navigate_seed';
      conversationId: string;
      handler: 'startMutualConversation';
      rpc: 'skipped_seed';
    }
  | {
      action: 'navigate_existing';
      conversationId: string;
      handler: 'startMutualConversation';
      rpc: 'skipped_existing';
      connectionId: string | null;
    }
  | {
      action: 'ensure';
      connectionId: string;
      handler: 'startMutualConversation';
      rpc: 'ensure_conversation_for_connection';
    }
  | {
      action: 'blocked';
      reason: string;
      detail?: string;
      handler: 'startMutualConversation';
      rpc: 'skipped_no_connection_id';
      connectionId: string | null;
    };

export type StartMutualConversationTrace = {
  componentName: string;
  connection_id: string | null;
  current_user_id: string | null;
  peer_user_id: string;
  handler: string;
  rpc: string;
  plan_action: StartMutualConversationPlan['action'];
  conversation_id?: string | null;
  error?: string | null;
};

/** Temporary QA logging for Mutual Start Conversation — no message bodies or profile content. */
export function logStartMutualConversationTrace(trace: StartMutualConversationTrace): void {
  // eslint-disable-next-line no-console -- temporary two-user QA trace
  console.info('[forge:start-conversation]', {
    componentName: trace.componentName,
    connection_id: trace.connection_id,
    current_user_id: trace.current_user_id,
    peer_user_id: trace.peer_user_id,
    handler: trace.handler,
    rpc: trace.rpc,
    plan_action: trace.plan_action,
    conversation_id: trace.conversation_id ?? null,
    error: trace.error ?? null,
  });
}

/**
 * Pure planner for the authenticated Mutual Start Conversation path.
 * Used by ConnectionsHubProvider and regression tests for the real Mutual page.
 */
export function planStartMutualConversation(
  input: StartMutualConversationInput
): StartMutualConversationPlan {
  if (input.isSeedPeer) {
    return {
      action: 'navigate_seed',
      conversationId: `seed-conversation-${input.peerUserId}`,
      handler: 'startMutualConversation',
      rpc: 'skipped_seed',
    };
  }

  if (input.existingConversationId) {
    const candidate =
      input.connectionId ?? input.mutualConnectionId ?? null;
    return {
      action: 'navigate_existing',
      conversationId: input.existingConversationId,
      handler: 'startMutualConversation',
      rpc: 'skipped_existing',
      connectionId: isPersistedConnectionId(candidate) ? candidate : null,
    };
  }

  const candidate = input.connectionId ?? input.mutualConnectionId ?? null;
  const resolved = isPersistedConnectionId(candidate) ? candidate : null;

  if (!resolved) {
    return {
      action: 'blocked',
      reason: 'Could not open this conversation yet.',
      detail: 'Open Mutual Connections and try again.',
      handler: 'startMutualConversation',
      rpc: 'skipped_no_connection_id',
      connectionId: candidate,
    };
  }

  return {
    action: 'ensure',
    connectionId: resolved,
    handler: 'startMutualConversation',
    rpc: 'ensure_conversation_for_connection',
  };
}
