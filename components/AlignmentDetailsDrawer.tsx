'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export type AlignmentDetailItem = {
  title: string;
  copy: string;
};

export type AlignmentDetailsContent = {
  alignmentLabel: string;
  intro?: string;
  guidanceNote?: string;
  strongAlignment?: AlignmentDetailItem[];
  growingAlignment?: AlignmentDetailItem[];
  moreInformation?: AlignmentDetailItem[];
  importantFactorPreview?: {
    title: string;
    copy: string;
    note?: string;
  } | null;
  incompleteCopy?: string;
  hideOnboardingLink?: boolean;
};

type AlignmentDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  profileName?: string;
  /** When provided, replaces hardcoded prototype content. */
  content?: AlignmentDetailsContent;
};

const DEFAULT_STRONG_ALIGNMENT: AlignmentDetailItem[] = [
  {
    title: 'Relationship Intent',
    copy: 'You are both looking for a serious relationship with long-term potential.',
  },
  {
    title: 'Family Goals',
    copy: 'Your current answers suggest similar hopes for family and the future.',
  },
  {
    title: 'Lifestyle Priorities',
    copy: 'You appear to value a grounded, active, and relationship-centered life.',
  },
];

const DEFAULT_GROWING_ALIGNMENT: AlignmentDetailItem[] = [
  {
    title: 'Faith',
    copy: 'Your answers suggest some shared perspective, but more information would improve confidence.',
  },
  {
    title: 'Communication Style',
    copy: 'There are signs of alignment, though one or more profiles need additional answers.',
  },
];

const DEFAULT_MORE_INFORMATION: AlignmentDetailItem[] = [
  {
    title: 'Conflict and Repair',
    copy: 'Forge does not yet have enough information to understand how you each approach disagreement and reconciliation.',
  },
  {
    title: 'Financial Philosophy',
    copy: 'Additional answers could help clarify priorities around spending, saving, work, and long-term planning.',
  },
];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function AlignmentDetailsDrawer({
  open,
  onClose,
  profileName: _profileName = 'Jessica',
  content,
}: AlignmentDetailsDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const alignmentLabel = content?.alignmentLabel ?? 'Promising Alignment';
  const intro =
    content?.intro ??
    'Forge surfaced this profile because several meaningful areas of your lives appear to align.';
  const guidanceNote =
    content?.guidanceNote ??
    'This is guidance, not a prediction. Real compatibility grows through conversation, time, and shared experience.';
  const strongAlignment = content?.strongAlignment ?? DEFAULT_STRONG_ALIGNMENT;
  const growingAlignment = content?.growingAlignment ?? DEFAULT_GROWING_ALIGNMENT;
  const moreInformation = content?.moreInformation ?? DEFAULT_MORE_INFORMATION;
  const importantFactorPreview =
    content === undefined
      ? {
          title: 'Children',
          copy: 'One profile currently indicates wanting children, while the other indicates not wanting children.',
          note: 'This does not determine whether a relationship can succeed. It is an important difference worth understanding before moving forward.',
        }
      : (content.importantFactorPreview ?? null);
  const incompleteCopy = content?.incompleteCopy;
  const hideOnboardingLink = content?.hideOnboardingLink ?? false;

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
          animation: 'alignmentDrawerIn 0.32s ease-out both',
        }}
      >
        <style>{`
          @keyframes alignmentDrawerIn {
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
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Relationship Alignment
              </p>
              <h2
                id={titleId}
                className="mt-2 text-[1.55rem] leading-tight tracking-[-0.02em] text-[#0B2D5C] sm:text-2xl"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Why Forge Introduced You
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 bg-white text-lg text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#F8F6F2]"
              aria-label="Close alignment details"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
            {intro}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#7A8494]">{guidanceNote}</p>

          <section className="mt-7 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5 shadow-[0_8px_28px_rgba(11,45,92,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Relationship Alignment
            </p>
            <h3
              className="mt-2 text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {alignmentLabel}
            </h3>
            {incompleteCopy ? (
              <p className="mt-4 text-sm leading-relaxed text-[#5A6575]">{incompleteCopy}</p>
            ) : null}
          </section>

          {strongAlignment.length > 0 ? (
            <section className="mt-8" aria-labelledby="strong-alignment-heading">
              <h3
                id="strong-alignment-heading"
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Why you align
              </h3>
              <ul className="mt-4 space-y-4">
                {strongAlignment.map((item) => (
                  <li
                    key={`${item.title}-${item.copy}`}
                    className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-[11px] font-bold text-white"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <div>
                        <p className="font-semibold text-[#0B2D5C]">{item.title}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">{item.copy}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {growingAlignment.length > 0 ? (
            <section className="mt-8" aria-labelledby="growing-alignment-heading">
              <h3
                id="growing-alignment-heading"
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Worth discussing
              </h3>
              <ul className="mt-4 space-y-4">
                {growingAlignment.map((item) => (
                  <li
                    key={`${item.title}-${item.copy}`}
                    className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/70 px-4 py-4"
                  >
                    <p className="font-semibold text-[#0B2D5C]">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">{item.copy}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {moreInformation.length > 0 ? (
            <section className="mt-8" aria-labelledby="more-info-heading">
              <h3
                id="more-info-heading"
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Not enough information
              </h3>
              <ul className="mt-4 space-y-4">
                {moreInformation.map((item) => (
                  <li
                    key={`${item.title}-${item.copy}`}
                    className="rounded-[1.25rem] border border-dashed border-[#0B2D5C]/15 bg-[#F8F6F2] px-4 py-4"
                  >
                    <p className="font-semibold text-[#0B2D5C]">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">{item.copy}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {importantFactorPreview ? (
            <section className="mt-8" aria-labelledby="important-factor-heading">
              <h3
                id="important-factor-heading"
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Important Alignment Factor
              </h3>
              <div className="mt-4 rounded-[1.5rem] border-2 border-[#D62828] bg-[#FBF6EE] p-5 shadow-[0_8px_28px_rgba(214,40,40,0.08)]">
                <div className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    !
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#0B2D5C]">
                      {importantFactorPreview.title}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#3D4654]">
                      {importantFactorPreview.copy}
                    </p>
                    {importantFactorPreview.note ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
                        {importantFactorPreview.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {!hideOnboardingLink ? (
            <section className="mt-8 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5">
              <h3
                className="text-lg tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                How Forge uses this
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#5A6575]">
                Relationship Alignment is qualitative guidance based on completed answers. It is not
                a score, grade, or prediction.
              </p>
              <Link
                href="/onboarding"
                className="mt-5 inline-flex text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]"
              >
                Improve my compatibility profile →
              </Link>
            </section>
          ) : (
            <p className="mt-8 text-sm leading-relaxed text-[#7A8494]">
              Relationship Alignment is qualitative guidance based on completed answers. It is not a
              score, grade, or prediction.
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
