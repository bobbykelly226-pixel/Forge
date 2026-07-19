'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ensureConversationAction } from '@/app/actions/conversations';

type DiscoveryProfileConversationCtaProps = {
  profileId: string;
  firstName: string;
  connectionId: string | null;
  existingConversationId?: string | null;
  isSeed?: boolean;
};

export default function DiscoveryProfileConversationCta({
  profileId,
  firstName,
  connectionId,
  existingConversationId = null,
  isSeed = false,
}: DiscoveryProfileConversationCtaProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openConversation = async () => {
    if (pending) return;
    setError(null);

    if (isSeed) {
      router.push(`/connections/c/seed-conversation-${profileId}`);
      return;
    }

    if (existingConversationId) {
      router.push(`/connections/c/${existingConversationId}`);
      return;
    }

    if (!connectionId) {
      router.push('/connections?tab=mutual');
      return;
    }

    setPending(true);
    const result = await ensureConversationAction(connectionId);
    setPending(false);

    if (!result.success || !result.data) {
      setError(result.success ? 'Could not open this conversation.' : result.message);
      return;
    }

    router.push(`/connections/c/${result.data.conversationId}`);
  };

  const label = existingConversationId ? 'Open Conversation' : 'Start Conversation';

  return (
    <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/80 px-5 py-5">
      <p className="text-sm leading-relaxed text-[#5A6575]">
        You and {firstName} are connected. Continue from Mutual Connections, or begin a
        conversation here.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void openConversation();
          }}
          className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] disabled:opacity-70"
        >
          {pending ? 'Opening…' : label}
        </button>
        <Link
          href="/connections?tab=mutual"
          className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6]"
        >
          View Mutual Connections
        </Link>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[#A61F1F]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
