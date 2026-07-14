'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import {
  getSignalsForInteractionType,
  type CharacterSignalId,
  type InteractionType,
  type RecognitionRecipient,
} from '@/lib/character-signals-mock';

type RecognitionFlowDrawerProps = {
  open: boolean;
  recipient: RecognitionRecipient | null;
  onClose: () => void;
  onSubmitted?: (payload: {
    recipientId: string;
    recipientName: string;
    signalId: CharacterSignalId;
    interactionType: InteractionType;
  }) => void;
  successReturnLabel?: string;
};

type Step = 'context' | 'select' | 'confirm' | 'success';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export default function RecognitionFlowDrawer({
  open,
  recipient,
  onClose,
  onSubmitted,
  successReturnLabel = 'Return to Connections',
}: RecognitionFlowDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('context');
  const [interactionType, setInteractionType] = useState<InteractionType>('in_app');
  const [selectedSignalId, setSelectedSignalId] = useState<CharacterSignalId | null>(null);

  useEffect(() => {
    if (!open || !recipient) return;
    setStep('context');
    setInteractionType(recipient.defaultInteractionType);
    setSelectedSignalId(null);
  }, [open, recipient]);

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
  }, [open, onClose, step]);

  if (!open || !recipient) return null;

  const availableSignals = getSignalsForInteractionType(interactionType);
  const selectedSignal = availableSignals.find((signal) => signal.id === selectedSignalId);
  const interactionLabel =
    interactionType === 'in_app' ? 'In-app conversation' : 'Met in person';

  const handleSubmit = () => {
    if (!selectedSignalId) return;
    onSubmitted?.({
      recipientId: recipient.id,
      recipientName: recipient.firstName,
      signalId: selectedSignalId,
      interactionType,
    });
    setStep('success');
  };

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
        className="relative z-[86] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-[#F8F6F2] shadow-[0_-18px_60px_rgba(11,45,92,0.22)] outline-none sm:max-h-[88vh] sm:rounded-[1.75rem]"
      >
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
          {step === 'context' && (
            <>
              <h2
                id={titleId}
                className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Recognize a positive quality
              </h2>
              <p id={descriptionId} className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                Choose one quality that stood out during your interaction with {recipient.firstName}.
              </p>

              <div className="mt-5 rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4">
                <p
                  className="text-lg text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  {recipient.firstName}
                </p>
                <p className="mt-1 text-sm text-[#5A6575]">{interactionLabel}</p>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-[#0B2D5C]">Interaction type</legend>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row" role="radiogroup">
                  {(
                    [
                      { id: 'in_app', label: 'In-app conversation' },
                      { id: 'in_person', label: 'Met in person' },
                    ] as const
                  ).map((option) => {
                    const selected = interactionType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setInteractionType(option.id);
                          setSelectedSignalId(null);
                        }}
                        className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                          selected
                            ? 'bg-[#0B2D5C] text-white'
                            : 'border border-[#0B2D5C]/15 bg-white text-[#0B2D5C] hover:bg-[#FBF9F6]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <p className="mt-5 text-xs leading-relaxed text-[#8A93A0]">
                One signal may be submitted per completed interaction. Recognition should be based
                on genuine interaction — not exchanged as a favor.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={() => setStep('select')}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'select' && (
            <>
              <h2
                id={titleId}
                className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Choose one Character Signal
              </h2>
              <p id={descriptionId} className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                Available for {interactionLabel.toLowerCase()} with {recipient.firstName}.
              </p>

              <div
                className="mt-5 flex flex-col gap-2"
                role="radiogroup"
                aria-label="Character Signals"
              >
                {availableSignals.map((signal) => {
                  const selected = selectedSignalId === signal.id;
                  return (
                    <button
                      key={signal.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedSignalId(signal.id)}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                        selected
                          ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white shadow-[0_8px_20px_rgba(11,45,92,0.16)]'
                          : 'border-[#0B2D5C]/10 bg-white/90 text-[#0B2D5C] hover:border-[#0B2D5C]/25'
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected ? 'bg-white/15 text-white' : 'bg-[#E8EEF6] text-[#0B2D5C]'
                        }`}
                      >
                        <CharacterSignalIcon signalId={signal.id} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{signal.title}</span>
                        <span
                          className={`mt-1 block text-xs leading-relaxed ${
                            selected ? 'text-white/80' : 'text-[#5A6575]'
                          }`}
                        >
                          {signal.shortDescription}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  ref={primaryRef}
                  type="button"
                  disabled={!selectedSignalId}
                  onClick={() => setStep('confirm')}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setStep('context')}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
                >
                  Go Back
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && selectedSignal && (
            <>
              <h2
                id={titleId}
                className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Recognize {recipient.firstName} for {selectedSignal.title}?
              </h2>
              <div id={descriptionId} className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#5A6575]">
                <p>
                  {recipient.firstName} will be notified privately. The signal will not automatically
                  appear on their profile.
                </p>
                <p>
                  Forge may wait for additional independent confirmations before the signal becomes
                  eligible for public display.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
                >
                  Submit Recognition
                </button>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-6 py-3.5 text-base font-semibold text-[#0B2D5C] transition hover:bg-[#F8F6F2]"
                >
                  Go Back
                </button>
              </div>
            </>
          )}

          {step === 'success' && selectedSignal && (
            <>
              <h2
                id={titleId}
                className="text-[1.45rem] leading-tight tracking-[-0.02em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Recognition submitted
              </h2>
              <div id={descriptionId} className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#5A6575]">
                <p>Thank you for recognizing a positive quality in {recipient.firstName}.</p>
                <p>
                  {recipient.firstName} controls whether eligible Character Signals appear publicly.
                </p>
                <p className="text-sm text-[#8A93A0]">
                  Prototype only — no real notification was sent.
                </p>
              </div>
              <button
                ref={primaryRef}
                type="button"
                onClick={onClose}
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#0A2540]"
              >
                {successReturnLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
