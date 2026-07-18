'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type WhatAreCharacterSignalsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const EXAMPLE_SIGNALS = [
  'Respectful Communicator',
  'Good Listener',
  'Clear Intentions',
  'Kind Conversation',
  'Respectful in Person',
  'Consistent Follow-Through',
  'Handled a Mismatch Respectfully',
] as const;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function WhatAreCharacterSignalsDrawer({
  open,
  onClose,
}: WhatAreCharacterSignalsDrawerProps) {
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
        className="relative z-[86] flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:max-h-[88vh] sm:rounded-[1.75rem]"
        style={{
          animation: 'whatAreSignalsDrawerIn 0.32s ease-out both',
        }}
      >
        <style>{`
          @keyframes whatAreSignalsDrawerIn {
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
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0B2D5C]/15 sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <h2
              id={titleId}
              className="min-w-0 flex-1 text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C] sm:text-[1.55rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              What Are Character Signals?
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-lg text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#F8F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              aria-label="Close Character Signals information"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <div id={descriptionId} className="space-y-4 text-[15px] leading-relaxed text-[#5A6575]">
            <p>
              Character Signals highlight positive qualities demonstrated through interactions with
              other Forge members. They are designed to reflect consistent, respectful behavior—not
              popularity.
            </p>
            <p>Signals may include qualities such as:</p>
            <ul className="space-y-2 pl-1">
              {EXAMPLE_SIGNALS.map((signal) => (
                <li key={signal} className="flex items-start gap-2.5 text-[15px] leading-snug text-[#3D4654]">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B2D5C]" aria-hidden="true" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
            <p>
              Character Signals are intended to provide additional context and help build trust. They
              do not guarantee compatibility, safety, or a specific relationship outcome.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-4 sm:px-6">
          <button
            ref={primaryRef}
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          >
            Return to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
