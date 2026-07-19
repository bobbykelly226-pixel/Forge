'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type AcceptChatDrawerProps = {
  open: boolean;
  profileName: string;
  mode: 'confirm' | 'success';
  note?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onStartConversation?: () => void;
  onViewMutual?: () => void;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function AcceptChatDrawer({
  open,
  profileName,
  mode,
  note = null,
  onClose,
  onConfirm,
  onStartConversation,
  onViewMutual,
}: AcceptChatDrawerProps) {
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

  if (!open) return null;

  const isSuccess = mode === 'success';
  const hasNote = Boolean(note && note.trim().length > 0);

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
        className="relative z-[86] w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:rounded-[1.75rem]"
      >
        <div className="max-h-[88vh] overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          <h2
            id={titleId}
            className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {isSuccess ? "You're connected" : `Open a conversation with ${profileName}?`}
          </h2>
          <div id={descriptionId} className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#5A6575]">
            {isSuccess ? (
              <>
                <p>You and {profileName} are connected.</p>
                <p className="text-sm text-[#5A6575]">
                  You can start a conversation now, or find this connection under Mutual.
                </p>
              </>
            ) : (
              <>
                {hasNote && (
                  <div className="rounded-2xl border border-[#0B2D5C]/08 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-[#0B2D5C]">{profileName}&apos;s note</p>
                    <blockquote className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#3D4654]">
                      “{note}”
                    </blockquote>
                  </div>
                )}
                <p>Accepting allows both of you to begin a conversation.</p>
              </>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {isSuccess ? (
              <>
                {onStartConversation ? (
                  <button
                    ref={primaryRef}
                    type="button"
                    onClick={onStartConversation}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
                  >
                    Start Conversation
                  </button>
                ) : null}
                <button
                  ref={onStartConversation ? undefined : primaryRef}
                  type="button"
                  onClick={onViewMutual ?? onClose}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-base font-semibold transition ${
                    onStartConversation
                      ? 'border border-[#0B2D5C]/20 bg-white text-[#0B2D5C] hover:bg-[#F8F6F2]'
                      : 'bg-[#0B2D5C] text-white hover:bg-[#0A2540]'
                  }`}
                >
                  View Mutual Connections
                </button>
              </>
            ) : (
              <>
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
                >
                  Accept &amp; Connect
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
                >
                  Go Back
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
