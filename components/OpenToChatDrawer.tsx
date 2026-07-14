'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Check, MessageCircle, Send } from 'lucide-react';

import { OPEN_TO_CHAT_NOTE_MAX_LENGTH } from '@/lib/discovery-actions-types';

export type OpenToChatDrawerStep = 'educate' | 'note' | 'success';

type OpenToChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Called when the request is sent. Return false to keep the note step (failed write). */
  onSent?: (note: string | null) => void | boolean | Promise<void | boolean>;
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
  const [sentNote, setSentNote] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const [sending, setSending] = useState(false);

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
  }, [open, onClose, initialStep]);

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

  const sendImmediately = async (raw: string) => {
    if (sending) return;
    const trimmed = trimNote(raw);
    const note = trimmed.length > 0 ? trimmed : null;
    setSending(true);
    try {
      const result = await onSent?.(note);
      if (result === false) {
        return;
      }
      setSentNote(note);
      setStep('success');
    } finally {
      setSending(false);
    }
  };

  const handleSendRequest = () => {
    void sendImmediately(noteDraft);
  };

  const handleContinueWithoutNote = () => {
    void sendImmediately('');
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
      : step === 'note'
        ? 'Add a quick note?'
        : 'Before you begin...';

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
            <div id={descriptionId} className="space-y-4 text-[15px] leading-relaxed text-[#3D4654]">
              <p>Open to Chat lets you introduce yourself with an optional note.</p>
              <p>The other person always decides whether to accept.</p>
              <p>You can only send one Open to Chat request to each person.</p>
            </div>
          )}

          {step === 'note' && (
            <>
              <p id={descriptionId} className="text-[15px] leading-relaxed text-[#3D4654]">
                A short introduction can make your request feel more personal.
              </p>

              <label
                id={noteLabelId}
                htmlFor="open-to-chat-note"
                className="mt-6 block text-sm font-semibold text-[#0B2D5C]"
              >
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
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-[#5A6575]">
                    A thoughtful introduction often leads to better conversations.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8A93A0]">
                    Avoid sharing personal contact information.
                  </p>
                </div>
                <p
                  id={counterId}
                  className={`shrink-0 pt-0.5 text-xs font-semibold tabular-nums ${
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

          {step === 'success' && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white">
                <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <p id={descriptionId} className="mt-4 text-[15px] leading-relaxed text-[#3D4654]">
                {sentNote
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
                onClick={handleSendRequest}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_28px_rgba(214,40,40,0.22)] transition hover:bg-[#A61F1F]"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Send Request
              </button>
              <button
                type="button"
                onClick={handleContinueWithoutNote}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Continue Without a Note
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
