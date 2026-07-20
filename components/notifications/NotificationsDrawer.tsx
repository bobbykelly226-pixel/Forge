'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef } from 'react';

import { formatNotificationTimestamp } from '@/lib/notifications/format';
import { resolveNotificationDestination } from '@/lib/notifications/resolve';
import type { AppNotification } from '@/lib/notifications/types';
import { stablePortraitGradient } from '@/lib/discovery/presentation';

type NotificationsDrawerProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  items: AppNotification[];
  unreadCount: number;
  onClose: () => void;
  onRetry: () => void;
  onOpenItem: (item: AppNotification) => void;
  onMarkAllRead: () => void;
};

function ActorAvatar({ item }: { item: AppNotification }) {
  const name = item.actorFirstName?.trim() || 'Member';
  const initials = name.slice(0, 1).toUpperCase();
  const gradient = item.actorUserId
    ? stablePortraitGradient(item.actorUserId)
    : 'linear-gradient(160deg, #1B2F4A 0%, #3E566F 50%, #A8927D 100%)';

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
      {item.actorPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- notification list photos
        <img src={item.actorPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundImage: gradient, backgroundSize: 'cover' }}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      {!item.readAt ? (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-[#FBF9F6] bg-[#D62828]"
          aria-label="Unread"
        />
      ) : null}
    </div>
  );
}

export default function NotificationsDrawer({
  open,
  loading,
  error,
  items,
  unreadCount,
  onClose,
  onRetry,
  onOpenItem,
  onMarkAllRead,
}: NotificationsDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => closeRef.current?.focus(), 30);
    const onDocKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onDocKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[#0B2D5C]/45 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative z-[91] flex h-[min(88vh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-[1.75rem]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#0B2D5C]/08 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Notifications
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-[#5A6575]">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'You’re all caught up.'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-lg text-[#0B2D5C] transition hover:bg-[#FBF9F6]"
            aria-label="Close notifications"
          >
            ×
          </button>
        </div>

        {unreadCount > 0 ? (
          <div className="shrink-0 border-b border-[#0B2D5C]/06 px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-sm font-semibold text-[#0B2D5C] underline-offset-2 transition hover:underline"
            >
              Mark all as read
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <ul className="divide-y divide-[#0B2D5C]/08" aria-busy="true" aria-label="Loading notifications">
              {Array.from({ length: 4 }).map((_, index) => (
                <li key={index} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-[#0B2D5C]/08" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#0B2D5C]/08" />
                    <div className="h-3 w-16 animate-pulse rounded bg-[#0B2D5C]/06" />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && error ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <p className="text-[15px] leading-relaxed text-[#5A6575]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540]"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <p
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                No notifications yet.
              </p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[#5A6575]">
                When someone connects with you or sends a message, it will appear here.
              </p>
            </div>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <ul className="divide-y divide-[#0B2D5C]/08">
              {items.map((item) => {
                const href = resolveNotificationDestination(item.destinationPath);
                const unread = !item.readAt;
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      onClick={() => onOpenItem(item)}
                      className={`flex items-start gap-3 px-5 py-4 transition hover:bg-[#0B2D5C]/[0.03] sm:px-6 ${
                        unread ? 'bg-[#EEF2F7]/55' : 'bg-transparent'
                      }`}
                    >
                      <ActorAvatar item={item} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[15px] leading-relaxed text-[#0B2D5C] ${
                            unread ? 'font-semibold' : 'font-medium'
                          }`}
                        >
                          {item.body}
                        </p>
                        <time
                          dateTime={item.createdAt}
                          className="mt-1 block text-xs text-[#8A93A0]"
                        >
                          {formatNotificationTimestamp(item.createdAt)}
                        </time>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
