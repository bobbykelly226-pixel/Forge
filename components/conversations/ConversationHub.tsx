'use client';

import Link from 'next/link';

import { formatConversationTimestamp } from '@/lib/conversations/format';
import type { ConversationListItem } from '@/lib/conversations/types';
import { stablePortraitGradient } from '@/lib/discovery/presentation';

type ConversationHubProps = {
  initialItems: ConversationListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  seedMode?: boolean;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function ConversationRowAvatar({ item }: { item: ConversationListItem }) {
  const gradient = stablePortraitGradient(item.peerUserId);
  const initials = initialsFromName(item.peerFirstName);

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
      {item.peerPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- conversation list may use seed fixtures
        <img
          src={item.peerPhotoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundImage: gradient, backgroundSize: 'cover' }}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      {item.unread ? (
        <span
          className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[#FBF9F6] bg-[#D62828]"
          aria-label="Unread"
        />
      ) : null}
    </div>
  );
}

function ConversationHubSkeleton() {
  return (
    <ul className="divide-y divide-[#0B2D5C]/08" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-[#0B2D5C]/08" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[#0B2D5C]/08" />
            <div className="h-3 w-full max-w-xs animate-pulse rounded bg-[#0B2D5C]/06" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-[#0B2D5C]/06" />
        </li>
      ))}
    </ul>
  );
}

export default function ConversationHub({
  initialItems,
  loading = false,
  error = null,
  onRetry,
  seedMode = false,
}: ConversationHubProps) {
  if (loading) {
    return (
      <section className="mx-auto w-full max-w-2xl" aria-busy="true" aria-label="Loading conversations">
        <ConversationHubSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-10 text-center sm:px-5">
        <p className="text-[15px] leading-relaxed text-[#5A6575]">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  if (initialItems.length === 0) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-14 text-center sm:px-5">
        <p
          className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          When a conversation begins, it will appear here.
        </p>
        {seedMode ? (
          <p className="mt-3 text-sm text-[#8A93A0]">Seed demo — mutual connections can appear once injected.</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <ul className="divide-y divide-[#0B2D5C]/08">
        {initialItems.map((item) => {
          const preview = item.latestMessageBody?.trim() || 'No messages yet';
          const timestampSource = item.latestMessageAt ?? item.lastMessageAt ?? item.createdAt;

          return (
            <li key={item.conversationId}>
              <Link
                href={`/connections/c/${item.conversationId}`}
                className="flex items-center gap-4 px-4 py-4 transition hover:bg-[#0B2D5C]/[0.03] sm:px-5"
              >
                <ConversationRowAvatar item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={`truncate text-base tracking-[-0.01em] text-[#0B2D5C] ${
                        item.unread ? 'font-semibold' : 'font-medium'
                      }`}
                      style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                    >
                      {item.peerFirstName}
                    </p>
                    <time
                      dateTime={timestampSource}
                      className="shrink-0 text-xs text-[#8A93A0]"
                    >
                      {formatConversationTimestamp(timestampSource)}
                    </time>
                  </div>
                  <p
                    className={`mt-1 truncate text-sm leading-relaxed ${
                      item.unread ? 'font-medium text-[#3D4654]' : 'text-[#7A8494]'
                    }`}
                  >
                    {preview}
                  </p>
                  {item.status === 'ended' ? (
                    <p className="mt-1 text-xs font-medium text-[#8A93A0]">Connection ended</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
