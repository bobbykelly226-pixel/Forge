'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type ImportantAlignmentFactorsDrawerProps = {
  open: boolean;
  onClose: () => void;
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

export default function ImportantAlignmentFactorsDrawer({
  open,
  onClose,
  profileName = 'Jessica',
}: ImportantAlignmentFactorsDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  if (!open) {
    return null;
  }

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
          animation: 'importantFactorsDrawerIn 0.32s ease-out both',
        }}
      >
        <style>{`
          @keyframes importantFactorsDrawerIn {
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
                Review with care
              </p>
              <h2
                id={titleId}
                className="mt-2 text-[1.55rem] leading-tight tracking-[-0.02em] text-[#0B2D5C] sm:text-2xl"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Important Alignment Factors
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-lg text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#F8F6F2]"
              aria-label="Close important alignment factors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
            Forge identified one meaningful difference in your current answers.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#7A8494]">
            This is not a judgment or a prediction. It is simply something worth understanding
            before deciding whether to move forward.
          </p>

          {/* Factor summary */}
          <section
            className="mt-7 rounded-[1.5rem] border-2 border-[#D62828] bg-[#FBF6EE] p-5 shadow-[0_8px_28px_rgba(214,40,40,0.08)]"
            aria-labelledby="factor-summary-heading"
          >
            <div className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-sm font-bold text-white"
                aria-hidden="true"
              >
                !
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  id="factor-summary-heading"
                  className="text-lg font-semibold tracking-tight text-[#0B2D5C]"
                >
                  Children
                </h3>

                <dl className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                      {profileName}
                    </dt>
                    <dd className="mt-1 text-[15px] font-medium text-[#0B2D5C]">Wants children</dd>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                      You
                    </dt>
                    <dd className="mt-1 text-[15px] font-medium text-[#0B2D5C]">
                      Does not want children
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Why this matters */}
          <section className="mt-8" aria-labelledby="why-matters-heading">
            <h3
              id="why-matters-heading"
              className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Why this matters
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
              Questions about children can shape long-term plans, timing, family expectations, and
              the kind of future each person hopes to build.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
              Forge surfaces this difference early so neither person has to discover it after
              investing significant time or emotion.
            </p>
          </section>

          {/* What this does not mean */}
          <section className="mt-8" aria-labelledby="does-not-mean-heading">
            <h3
              id="does-not-mean-heading"
              className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              What this does not mean
            </h3>
            <div className="mt-4 rounded-[1.25rem] border border-[#0B2D5C]/08 bg-white/90 px-4 py-4">
              <p className="text-[15px] leading-relaxed text-[#5A6575]">
                This does not mean the relationship cannot succeed.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                People sometimes reconsider priorities, interpret questions differently, or need
                conversation before fully understanding each other&apos;s plans.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#3D4654]">
                Forge provides context. The decision remains yours.
              </p>
            </div>
          </section>

          {/* Suggested conversation */}
          <section className="mt-8" aria-labelledby="conversation-heading">
            <h3
              id="conversation-heading"
              className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              A conversation worth having
            </h3>
            <div className="mt-4 rounded-[1.25rem] border border-[#0B2D5C]/08 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,45,92,0.05)]">
              <p
                className="text-[16px] leading-relaxed text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                “How do you currently picture children fitting into your future, and how certain do
                you feel about that?”
              </p>
              <p className="mt-3 text-sm text-[#7A8494]">
                Use this as a starting point, not a script.
              </p>
            </div>
          </section>

          {/* Answer context */}
          <section className="mt-8 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5">
            <h3
              className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Answer context
            </h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-[#0B2D5C]/06 pb-3">
                <dt className="text-sm text-[#7A8494]">{profileName} answered this question</dt>
                <dd className="text-sm font-semibold text-[#0B2D5C]">Recently</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-[#0B2D5C]/06 pb-3">
                <dt className="text-sm text-[#7A8494]">You answered this question</dt>
                <dd className="text-sm font-semibold text-[#0B2D5C]">Recently</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8494]">
                  Confidence
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[#3D4654]">
                  Clear difference based on both current answers
                </dd>
              </div>
            </dl>
          </section>

          <p className="mt-8 text-center text-xs text-[#8A93A0]">
            Prototype only — placeholder answers, not live hard-limit detection.
          </p>
        </div>

        <div className="shrink-0 border-t border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Return to Profile
          </button>
          <div className="mt-3 text-center">
            <Link
              href="/onboarding"
              className="text-sm font-medium text-[#6B7585] transition hover:text-[#0B2D5C]"
            >
              Review my answer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
