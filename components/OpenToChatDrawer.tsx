'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ArrowLeft, Check, MessageCircle, Pencil, Send } from 'lucide-react';

import { OPEN_TO_CHAT_NOTE_MAX_LENGTH } from '@/lib/discovery-actions-types';

export type OpenToChatDrawerStep = 'educate' | 'note' | 'review' | 'success';

type OpenToChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Called when the request is sent. note is null when skipped/blank. */
  onSent?: (note: string | null) => void;
  /** Called when the user continues past first-use education */
  onEducationContinued?: () => void;
  profileName?: string;
  initialStep?: 'educate' | 'note';
  showFirstTimeBanner?: boolean;
  /** Info-icon review: Continue does not force a send path when already sent */
  educateOnly?: boolean;
  /** When true, educate Continue closes instead of opening the note step */
  alreadySent?: boolean;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

function trimNote(value: string): string {
  return value.replace(/^\s+|\s+$/g, '');
}

export default function OpenToChatDrawer({
  open,
  onClose,
  onSent,
  onEducationContinued,
  profileName = 'Jessica',
  initialStep = 'educate',
  showFirstTimeBanner = false,
  educateOnly = false,
  alreadySent = false,
}: OpenToChatDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const noteLabelId = useId();
  const counterId = useId();
  const limitAnnounceId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep] = useState<OpenToChatDrawerStep>(initialStep);
  const [noteDraft, setNoteDraft] = useState('');
  const [reviewedNote, setReviewedNote] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const resetForOpen = useCallback(() => {
    setStep(initialStep);
    setNoteDraft('');
    setReviewedNote(null);
    setLimitReached(false);
  }, [initialStep]);

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

    resetForOpen();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (initialStep === 'note') {
        textareaRef.current?.focus();
      } else {
        primaryActionRef.current?.focus();
      }
    }, 30);

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, onClose, resetForOpen, initialStep]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => {
      if (step === 'note') {
        textareaRef.current?.focus();
      } else {
        primaryActionRef.current?.focus();
      }
    }, 20);
    return () => window.clearTimeout(focusTimer);
  }, [open, step]);

  if (!open) return null;

  const characterCount = noteDraft.length;
  const nearLimit = characterCount >= OPEN_TO_CHAT_NOTE_MAX_LENGTH;

  const goToNote = () => setStep('note');

  const handleEducateContinue = () => {
    if (showFirstTimeBanner) {
      onEducationContinued?.();
    }
    if (educateOnly && alreadySent) {
      onClose();
      return;
    }
    goToNote();
  };

  const prepareReview = (raw: string) => {
    const trimmed = trimNote(raw);
    setReviewedNote(trimmed.length > 0 ? trimmed : null);
    setStep('review');
  };

  const handleReviewRequest = () => prepareReview(noteDraft);

  const handleSkipNote = () => {
    setNoteDraft('');
    setReviewedNote(null);
    setStep('review');
  };

  const handleEditNote = () => {
    if (reviewedNote) setNoteDraft(reviewedNote);
    setStep('note');
  };

  const handleSend = () => {
    // Prototype only — no messaging, notifications, or storage.
    onSent?.(reviewedNote);
    setStep('success');
  };

  const handleNoteChange = (value: string) => {
    const next = value.slice(0, OPEN_TO_CHAT_NOTE_MAX_LENGTH);
    setNoteDraft(next);
    const reached = next.length >= OPEN_TO_CHAT_NOTE_MAX_LENGTH;
    setLimitReached(reached);
  };

  const title =
    step === 'success'
      ? 'Open to Chat sent'
      : step === 'review'
        ? `Send Open to Chat to ${profileName}?`
        : step === 'note'
          ? 'Add a quick note?'
          : showFirstTimeBanner
            ? 'Your first Open to Chat'
            : `Open to Chat with ${profileName}`;

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
        style={{ animation: 'openToChatDrawerIn 0.32s ease-out both' }}
      >
        <style>{`
          @keyframes openToChatDrawerIn {
            from { opacity: 0.6; transform: translateY(28px); }
            to { opacity: 1; transform: translateY(0); }
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
                {title}
              </h2>
            </div>
            <button
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
          {step === 'educate' && (
            <>
              {showFirstTimeBanner ? (
                <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                  Here is how Open to Chat works. You will not need to review this explanation every
                  time.
                </p>
              ) : (
                <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                  Reviewing how Open to Chat works. You can close this anytime without sending a
                  request.
                </p>
              )}

              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-[#3D4654]">
                <li className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5">
                  This is a low-pressure request to talk.
                </li>
                <li className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5">
                  {profileName} chooses whether to open the conversation.
                </li>
                <li className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5">
                  Only one request may be sent to the same person.
                </li>
                <li className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5">
                  Requests are limited to keep contact intentional.
                </li>
                <li className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3.5">
                  No response is required. Repeated requests are not allowed.
                </li>
              </ul>

              <section className="mt-7 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#D62828]">
                  Low pressure
                </p>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#0B2D5C]">
                  Open to Chat is not the same as Interested.
                </p>
                <p
                  className="mt-2 text-[16px] leading-relaxed text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  “I am curious and would be open to getting to know you.”
                </p>
              </section>

              <p className="mt-6 text-center text-xs text-[#8A93A0]">
                Prototype only — no messaging, notifications, or request storage.
              </p>
            </>
          )}

          {step === 'note' && (
            <>
              <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                A short introduction can make your request feel more personal.
              </p>

              <label id={noteLabelId} htmlFor="open-to-chat-note" className="mt-6 block text-sm font-semibold text-[#0B2D5C]">
                Your note
              </label>
              <textarea
                ref={textareaRef}
                id="open-to-chat-note"
                rows={5}
                maxLength={OPEN_TO_CHAT_NOTE_MAX_LENGTH}
                value={noteDraft}
                onChange={(event) => handleNoteChange(event.target.value)}
                placeholder={`Hi ${profileName}, I enjoyed reading your profile and wanted to say hello.`}
                aria-labelledby={noteLabelId}
                aria-describedby={`${descriptionId} ${counterId} ${limitAnnounceId}`}
                className="mt-2 w-full resize-none rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#0B2D5C] outline-none transition placeholder:text-[#8A93A0] focus:border-[#0B2D5C]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-[#7A8494]">
                  Keep it respectful and avoid sharing personal contact information.
                </p>
                <p
                  id={counterId}
                  className={`shrink-0 text-xs font-semibold tabular-nums ${
                    nearLimit ? 'text-[#D62828]' : 'text-[#8A93A0]'
                  }`}
                  aria-live="polite"
                >
                  {characterCount} / {OPEN_TO_CHAT_NOTE_MAX_LENGTH}
                </p>
              </div>
              <div id={limitAnnounceId} className="sr-only" aria-live="assertive">
                {limitReached ? `Character limit of ${OPEN_TO_CHAT_NOTE_MAX_LENGTH} reached.` : ''}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#5A6575]">
                Optional. You can send Open to Chat without writing anything.
              </p>
            </>
          )}

          {step === 'review' && (
            <>
              <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                {profileName} can choose whether to open the conversation.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white px-5 py-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2D5C]">
                  <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Open to Chat request
                </div>

                {reviewedNote ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[#0B2D5C]">Your note</p>
                    <blockquote className="mt-2 whitespace-pre-wrap rounded-2xl border border-[#0B2D5C]/08 bg-[#FBF9F6] px-4 py-3.5 text-[15px] leading-relaxed text-[#3D4654]">
                      “{reviewedNote}”
                    </blockquote>
                  </div>
                ) : (
                  <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">No note added</p>
                )}
              </div>

              <p className="mt-6 text-center text-xs text-[#8A93A0]">
                Prototype only — no messaging, notifications, or request storage.
              </p>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white">
                <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <p id={descriptionId} className="mt-4 text-[15px] leading-relaxed text-[#3D4654]">
                {reviewedNote
                  ? 'Your note was included with the request.'
                  : 'Your request was sent without a note.'}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                {profileName} can choose whether to open the conversation.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-[#8A93A0]">
                Prototype only — no real message, notification, or chat was created.
              </p>
            </>
          )}
        </div>

        <div
          className="shrink-0 border-t border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-4 sm:px-6"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {step === 'educate' && (
            <>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={handleEducateContinue}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
              >
                Continue
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

          {step === 'note' && (
            <>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={handleReviewRequest}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Review Request
              </button>
              <button
                type="button"
                onClick={handleSkipNote}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Skip Note
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl px-8 py-3 text-sm font-semibold text-[#6B7585] transition hover:text-[#0B2D5C]"
              >
                Cancel
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={handleSend}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.22)] transition hover:bg-[#A61F1F]"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Send Request
              </button>
              <button
                type="button"
                onClick={handleEditNote}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Edit Note
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl px-8 py-3 text-sm font-semibold text-[#6B7585] transition hover:text-[#0B2D5C]"
              >
                Cancel
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              ref={primaryActionRef}
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#0A2540]"
            >
              Return to Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
