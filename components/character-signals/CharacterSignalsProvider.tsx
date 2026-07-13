'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import CharacterSignalDetailDrawer from '@/components/character-signals/CharacterSignalDetailDrawer';
import RecognitionFlowDrawer from '@/components/character-signals/RecognitionFlowDrawer';
import {
  INITIAL_RECOGNITION_HISTORY,
  INITIAL_USER_SIGNALS,
  RECOGNITION_RECIPIENTS,
  getSignalDefinition,
  type CharacterSignalId,
  type InteractionType,
  type RecognitionHistoryEntry,
  type RecognitionRecipient,
  type UserSignalInstance,
} from '@/lib/character-signals-mock';

type DetailDrawerState = {
  signalId: CharacterSignalId;
  confirmationCount: number;
} | null;

type StatusMessage = {
  text: string;
  detail?: string;
};

type CharacterSignalsContextValue = {
  signals: UserSignalInstance[];
  history: RecognitionHistoryEntry[];
  recipients: RecognitionRecipient[];
  hideFromProfile: (instanceId: string) => void;
  showOnProfile: (instanceId: string) => void;
  approveForProfile: (instanceId: string) => void;
  keepPrivate: (instanceId: string) => void;
  openSignalDetail: (signalId: CharacterSignalId, confirmationCount: number) => void;
  openRecognition: (recipientId?: string) => void;
  registerDetailTrigger: (key: string, element: HTMLButtonElement | null) => void;
  registerRecognitionTrigger: (element: HTMLButtonElement | null) => void;
  statusMessage: StatusMessage | null;
};

const CharacterSignalsContext = createContext<CharacterSignalsContextValue | null>(null);

export function useCharacterSignals() {
  const ctx = useContext(CharacterSignalsContext);
  if (!ctx) {
    throw new Error('useCharacterSignals must be used within CharacterSignalsProvider');
  }
  return ctx;
}

export function CharacterSignalsProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<UserSignalInstance[]>(INITIAL_USER_SIGNALS);
  const [history, setHistory] = useState<RecognitionHistoryEntry[]>(INITIAL_RECOGNITION_HISTORY);
  const [detailDrawer, setDetailDrawer] = useState<DetailDrawerState>(null);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [recognitionRecipient, setRecognitionRecipient] = useState<RecognitionRecipient | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const detailTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const recognitionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeDetailKeyRef = useRef<string | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  const announce = useCallback((text: string, detail?: string) => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    setStatusMessage({ text, detail });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 4200);
  }, []);

  const registerDetailTrigger = useCallback((key: string, element: HTMLButtonElement | null) => {
    detailTriggers.current[key] = element;
  }, []);

  const registerRecognitionTrigger = useCallback((element: HTMLButtonElement | null) => {
    recognitionTriggerRef.current = element;
  }, []);

  const hideFromProfile = useCallback(
    (instanceId: string) => {
      setSignals((prev) =>
        prev.map((signal) =>
          signal.id === instanceId ? { ...signal, status: 'hidden' } : signal
        )
      );
      const instance = signals.find((signal) => signal.id === instanceId);
      const title = instance
        ? getSignalDefinition(instance.signalId).title
        : 'Character Signal';
      announce(`${title} is now hidden from your profile.`);
    },
    [announce, signals]
  );

  const showOnProfile = useCallback(
    (instanceId: string) => {
      setSignals((prev) =>
        prev.map((signal) =>
          signal.id === instanceId ? { ...signal, status: 'public' } : signal
        )
      );
      const instance = signals.find((signal) => signal.id === instanceId);
      const title = instance
        ? getSignalDefinition(instance.signalId).title
        : 'Character Signal';
      announce(`${title} is now displayed on your profile.`);
    },
    [announce, signals]
  );

  const approveForProfile = useCallback(
    (instanceId: string) => {
      setSignals((prev) =>
        prev.map((signal) =>
          signal.id === instanceId ? { ...signal, status: 'public' } : signal
        )
      );
      const instance = signals.find((signal) => signal.id === instanceId);
      const title = instance
        ? getSignalDefinition(instance.signalId).title
        : 'Character Signal';
      announce(`${title} was added to your profile.`);
    },
    [announce, signals]
  );

  const keepPrivate = useCallback(
    (instanceId: string) => {
      setSignals((prev) =>
        prev.map((signal) =>
          signal.id === instanceId ? { ...signal, status: 'private' } : signal
        )
      );
      const instance = signals.find((signal) => signal.id === instanceId);
      const title = instance
        ? getSignalDefinition(instance.signalId).title
        : 'Character Signal';
      announce(`${title} will stay private.`);
    },
    [announce, signals]
  );

  const openSignalDetail = useCallback(
    (signalId: CharacterSignalId, confirmationCount: number) => {
      activeDetailKeyRef.current = signalId;
      setDetailDrawer({ signalId, confirmationCount });
    },
    []
  );

  const closeSignalDetail = useCallback(() => {
    const key = activeDetailKeyRef.current;
    setDetailDrawer(null);
    window.requestAnimationFrame(() => {
      if (key) detailTriggers.current[key]?.focus();
    });
  }, []);

  const openRecognition = useCallback((recipientId = 'jessica') => {
    const recipient =
      RECOGNITION_RECIPIENTS.find((entry) => entry.id === recipientId) ??
      RECOGNITION_RECIPIENTS[0] ??
      null;
    setRecognitionRecipient(recipient);
    setRecognitionOpen(true);
  }, []);

  const closeRecognition = useCallback(() => {
    setRecognitionOpen(false);
    setRecognitionRecipient(null);
    window.requestAnimationFrame(() => recognitionTriggerRef.current?.focus());
  }, []);

  const handleRecognitionSubmitted = useCallback(
    (payload: {
      recipientId: string;
      recipientName: string;
      signalId: CharacterSignalId;
      interactionType: InteractionType;
    }) => {
      const contextLabel =
        payload.interactionType === 'in_app'
          ? 'After an in-app conversation'
          : 'After meeting in person';
      setHistory((prev) => [
        {
          id: `hist-local-${Date.now()}`,
          kind: 'given',
          signalId: payload.signalId,
          contextLabel,
          relativeTime: 'Just now',
          recipientFirstName: payload.recipientName,
        },
        ...prev,
      ]);
      announce(
        `Recognition submitted for ${payload.recipientName}.`,
        'Prototype only — no notification was sent.'
      );
    },
    [announce]
  );

  const value = useMemo<CharacterSignalsContextValue>(
    () => ({
      signals,
      history,
      recipients: RECOGNITION_RECIPIENTS,
      hideFromProfile,
      showOnProfile,
      approveForProfile,
      keepPrivate,
      openSignalDetail,
      openRecognition,
      registerDetailTrigger,
      registerRecognitionTrigger,
      statusMessage,
    }),
    [
      signals,
      history,
      hideFromProfile,
      showOnProfile,
      approveForProfile,
      keepPrivate,
      openSignalDetail,
      openRecognition,
      registerDetailTrigger,
      registerRecognitionTrigger,
      statusMessage,
    ]
  );

  return (
    <CharacterSignalsContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-[5.75rem] z-[75] mx-auto max-w-lg lg:bottom-8 lg:left-auto lg:right-8 lg:max-w-sm"
      >
        {statusMessage && (
          <div className="rounded-2xl border border-[#0B2D5C]/10 bg-[#0B2D5C] px-4 py-3 text-center text-sm text-white shadow-[0_12px_32px_rgba(11,45,92,0.25)]">
            <p>{statusMessage.text}</p>
            {statusMessage.detail && (
              <p className="mt-1 text-xs text-white/80">{statusMessage.detail}</p>
            )}
          </div>
        )}
      </div>

      <CharacterSignalDetailDrawer
        open={detailDrawer !== null}
        signalId={detailDrawer?.signalId ?? null}
        confirmationCount={detailDrawer?.confirmationCount ?? 0}
        onClose={closeSignalDetail}
        returnLabel="Close"
      />

      <RecognitionFlowDrawer
        open={recognitionOpen}
        recipient={recognitionRecipient}
        onClose={closeRecognition}
        onSubmitted={handleRecognitionSubmitted}
        successReturnLabel="Return to Character Signals"
      />
    </CharacterSignalsContext.Provider>
  );
}
