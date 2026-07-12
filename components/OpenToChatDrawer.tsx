'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type OpenToChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
  profileName?: string;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

const NEXT_STEPS = [
  `${'{name}'} receives one notification.`,
  `${'{name}'} can accept, ignore, or decline privately.`,
  'A conversation opens only if {name} accepts.',
] as const;

export default function OpenToChatDrawer({
  open,
  onClose,
  onSent,
  profileName = 'Jessica',
}: OpenToChatDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const [sent, setSent] = useState(false);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }

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
    if (!open) {
      return;
    }

    // Reset to confirmation view whenever the drawer opens.
    setSent(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 30);

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !sent) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      primaryActionRef.current?.focus();
    }, 30);

    return () => window.clearTimeout(focusTimer);
  }, [open, sent]);

  if (!open) {
    return null;
  }

  const handleSend = () => {
    // Prototype only — no messaging, notifications, or storage.
    setSent(true);
    onSent?.();
  };

  const steps = NEXT_STEPS.map((step) => step.replaceAll('{name}', profileName));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[#0B2D5C]/45 backdrop-blur-[2px] transition-opacity"
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
        className="relative z-[81] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:max-h-[88vh] sm:rounded-[1.75rem]"
        style={{
          animation: 'openToChatDrawerIn 0.32s ease-out both',
        }}
      >
        <style>{`
          @keyframes openToChatDrawerIn {
            from {
              opacity: 0.6;
              transform: translateY(28px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="flex shrink-0 flex-col border-b border-[#0B2D5C]/08 px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0B2D5C]/15 sm:hidden"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Low-pressure connection
              </p>
              <h2
                id={titleId}
                className="mt-2 text-[1.55rem] leading-tight tracking-[-0.02em] text-[#0B2D5C] sm:text-2xl"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {sent ? 'Open to Chat sent' : `Open to Chat with ${profileName}?`}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-lg text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#F8F6F2]"
              aria-label="Close Open to Chat"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {sent ? (
            <>
              <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                {profileName} will receive a private notification and can choose whether to open a
                conversation.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#7A8494]">
                You do not need to take any further action.
              </p>

              <div className="mt-7 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5">
                <p className="text-sm leading-relaxed text-[#5A6575]">
                  Prototype only — no real message, notification, or chat was created.
                </p>
              </div>
            </>
          ) : (
            <>
              <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                Let {profileName} know you would be open to a conversation and would like to learn
                more before deciding whether there may be a connection.
              </p>

              <section className="mt-7" aria-labelledby="what-happens-heading">
                <h3
                  id="what-happens-heading"
                  className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  What happens next
                </h3>
                <ol className="mt-4 space-y-3">
                  {steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-3 rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-[15px] leading-relaxed text-[#3D4654]">{step}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm leading-relaxed text-[#7A8494]">
                  Ignoring the request simply allows it to expire. No explanation is required.
                </p>
              </section>

              <section className="mt-7 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,45,92,0.05)]">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#D62828]">
                  Low pressure
                </p>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#0B2D5C]">
                  Open to Chat is not the same as Interested.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                  It simply means:
                </p>
                <p
                  className="mt-2 text-[16px] leading-relaxed text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  “I am curious and would be open to getting to know you.”
                </p>
              </section>

              <section className="mt-7 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5">
                <h3
                  className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  Open to Chat requests are limited
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
                  Forge limits how many requests may be sent each day to keep the experience
                  intentional and reduce repeated or unwanted contact.
                </p>
                <p className="mt-4 rounded-2xl bg-[#F8F6F2] px-4 py-3 text-sm font-semibold text-[#0B2D5C]">
                  2 of 3 Open to Chat requests remaining today
                </p>
                <p className="mt-2 text-xs text-[#8A93A0]">Placeholder only — not a live counter.</p>
              </section>

              <section className="mt-7">
                <h3
                  className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  One request per person
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                  You may send one Open to Chat request to this person.
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5A6575]">
                  If the request is ignored or declined, it cannot be repeatedly resent.
                </p>
              </section>

              <p className="mt-8 text-center text-xs text-[#8A93A0]">
                Prototype only — no messaging, notifications, or request storage.
              </p>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-4 sm:px-6">
          {sent ? (
            <button
              ref={primaryActionRef}
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
            >
              Return to Profile
            </button>
          ) : (
            <>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={handleSend}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.22)] transition hover:bg-[#A61F1F]"
              >
                Send Open to Chat
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
