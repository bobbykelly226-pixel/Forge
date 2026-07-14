'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import type { DiscoveryActionConflict } from '@/lib/discovery-actions-types';

type ActionConflictDrawerProps = {
  open: boolean;
  conflict: DiscoveryActionConflict | null;
  onClose: () => void;
  onConfirm: () => void;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function ActionConflictDrawer({
  open,
  conflict,
  onClose,
  onConfirm,
}: ActionConflictDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 30);

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, onClose]);

  if (!open || !conflict) return null;

  const isInterestedToChat = conflict.type === 'interested-to-chat';
  const title = isInterestedToChat ? 'Switch to Open to Chat?' : 'Express Interest instead?';
  const description = isInterestedToChat
    ? `You've already expressed interest. Open to Chat is a lower-pressure request to learn more first.`
    : 'This will replace your Open to Chat request with a stronger signal.';
  const confirmLabel = isInterestedToChat ? 'Switch' : 'Express Interest';
  const cancelLabel = isInterestedToChat ? 'Keep Interested' : 'Keep Request Sent';

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6"
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
        onKeyDown={handleKeyDown}
        className="relative z-[86] w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:rounded-[1.75rem]"
      >
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <h2
            id={titleId}
            className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {title}
          </h2>
          <p id={descriptionId} className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
            {description}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              ref={primaryRef}
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#EEF2F7]"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
