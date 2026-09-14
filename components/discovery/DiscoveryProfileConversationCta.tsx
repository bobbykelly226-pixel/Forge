'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ensureConversationAction } from '@/app/actions/conversations';
import { trackLaunchEvent } from '@/lib/analytics/launch-events';
import {
  logStartMutualConversationTrace,
  planStartMutualConversation,
} from '@/lib/conversations/start-mutual-conversation';
import { isPersistedConnectionId } from '@/lib/conversations/resolve';

type DiscoveryProfileConversationCtaProps = {
  profileId: string;
  firstName: string;
  connectionId: string | null;
  existingConversationId?: string | null;
  viewerUserId?: string | null;
  /** Seed fixtures only — never used for live mutual production profiles. */
  isSeed?: boolean;
};

/**
 * Profile-level Start / Open Conversation CTA.
 * Uses the same planner + ensure_conversation_for_connection path as MutualConnectionCard.
 */
export default function DiscoveryProfileConversationCta({
  profileId,
  firstName,
  connectionId,
  existingConversationId = null,
  viewerUserId = null,
  isSeed = false,
}: DiscoveryProfileConversationCtaProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistedConnectionId = isPersistedConnectionId(connectionId) ? connectionId : null;

  // Live mutuals without a real connection id must not offer Start Conversation.
  if (!isSeed && !persistedConnectionId && !existingConversationId) {
    return null;
  }

  const openConversation = async () => {
    if (pending) return;
    setError(null);

    const plan = planStartMutualConversation({
      componentName: 'DiscoveryProfileConversationCta',
      currentUserId: viewerUserId,
      peerUserId: profileId,
      peerFirstName: firstName,
      connectionId: persistedConnectionId,
      mutualConnectionId: persistedConnectionId,
      existingConversationId,
      isSeedPeer: isSeed,
    });

    logStartMutualConversationTrace({
      componentName: 'DiscoveryProfileConversationCta',
      connection_id:
        plan.action === 'ensure' ||
        plan.action === 'navigate_existing' ||
        plan.action === 'blocked'
          ? plan.connectionId
          : persistedConnectionId,
      current_user_id: viewerUserId,
      peer_user_id: profileId,
      handler: plan.handler,
      rpc: plan.rpc,
      plan_action: plan.action,
      conversation_id:
        plan.action === 'navigate_seed' || plan.action === 'navigate_existing'
          ? plan.conversationId
          : null,
    });

    if (plan.action === 'navigate_seed' || plan.action === 'navigate_existing') {
      router.push(`/connections/c/${plan.conversationId}`);
      return;
    }

    if (plan.action === 'blocked') {
      setError(plan.reason);
      return;
    }

    setPending(true);
    const result = await ensureConversationAction(plan.connectionId);
    setPending(false);

    if (!result.success || !result.data) {
      const message = result.success
        ? 'Could not open this conversation.'
        : result.message;
      logStartMutualConversationTrace({
        componentName: 'DiscoveryProfileConversationCta',
        connection_id: plan.connectionId,
        current_user_id: viewerUserId,
        peer_user_id: profileId,
        handler: plan.handler,
        rpc: plan.rpc,
        plan_action: plan.action,
        conversation_id: null,
        error: message,
      });
      setError(message);
      return;
    }

    if (result.data.created) {
      trackLaunchEvent('Conversation Started');
    }
    logStartMutualConversationTrace({
      componentName: 'DiscoveryProfileConversationCta',
      connection_id: plan.connectionId,
      current_user_id: viewerUserId,
      peer_user_id: profileId,
      handler: plan.handler,
      rpc: plan.rpc,
      plan_action: plan.action,
      conversation_id: result.data.conversationId,
    });

    router.push(`/connections/c/${result.data.conversationId}`);
  };

  const label = existingConversationId ? 'Open Conversation' : 'Start Conversation';

  return (
    <div className="rounded-lg border border-[#C9CBCE] bg-[#F7F7F7] p-4">
      <p className="text-sm leading-relaxed text-black">
        You and {firstName} both chose to connect.
      </p>
      <div className="mt-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void openConversation();
          }}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:opacity-70"
        >
          {pending ? 'Opening…' : label}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[#A61F1F]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
