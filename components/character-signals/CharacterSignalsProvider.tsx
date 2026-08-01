'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react';

import {
  giveCharacterSignalAction,
  respondToCharacterSignalAction,
  setCharacterSignalVisibilityAction,
} from '@/app/actions/character-signals';
import CharacterSignalDetailDrawer from '@/components/character-signals/CharacterSignalDetailDrawer';
import RecognitionFlowDrawer from '@/components/character-signals/RecognitionFlowDrawer';
import type { CharacterSignalId, InteractionType } from '@/lib/character-signals/catalog';
import type {
  CharacterSignalActionResult,
  CharacterSignalsDashboard,
  RecognitionHistoryEntry,
  RecognitionRecipient,
  UserSignalInstance,
} from '@/lib/character-signals/types';

type DetailDrawerState = {
  signalId: CharacterSignalId;
  confirmationCount: number;
} | null;

type StatusMessage = { text: string; detail?: string };

type CharacterSignalsContextValue = {
  signals: UserSignalInstance[];
  history: RecognitionHistoryEntry[];
  recipients: RecognitionRecipient[];
  isSaving: boolean;
  setVisibility: (signalId: CharacterSignalId, isPublic: boolean) => void;
  respondToRecognition: (
    instanceId: string,
    visibility: 'public' | 'private' | 'decline'
  ) => void;
  openSignalDetail: (signalId: CharacterSignalId, confirmationCount: number) => void;
  openRecognition: (recipientId?: string) => void;
  registerDetailTrigger: (key: string, element: HTMLButtonElement | null) => void;
  registerRecognitionTrigger: (element: HTMLButtonElement | null) => void;
  statusMessage: StatusMessage | null;
};

const CharacterSignalsContext = createContext<CharacterSignalsContextValue | null>(null);

export function useCharacterSignals() {
  const ctx = useContext(CharacterSignalsContext);
  if (!ctx) throw new Error('useCharacterSignals must be used within CharacterSignalsProvider');
  return ctx;
}

export function CharacterSignalsProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: CharacterSignalsDashboard;
}) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [detailDrawer, setDetailDrawer] = useState<DetailDrawerState>(null);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [recognitionRecipient, setRecognitionRecipient] = useState<RecognitionRecipient | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const detailTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const recognitionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeDetailKeyRef = useRef<string | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
  }, []);

  const announce = useCallback((text: string, detail?: string) => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    setStatusMessage({ text, detail });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 5200);
  }, []);

  const refreshAfter = useCallback((operation: () => Promise<CharacterSignalActionResult>) => {
    startTransition(async () => {
      try {
        const result = await operation();
        announce(result.message);
        if (result.success) router.refresh();
      } catch {
        announce('Forge could not save that choice. Please try again.');
      }
    });
  }, [announce, router]);

  const setVisibility = useCallback((signalId: CharacterSignalId, isPublic: boolean) => {
    refreshAfter(() => setCharacterSignalVisibilityAction({ signalId, isPublic }));
  }, [refreshAfter]);

  const respondToRecognition = useCallback((
    instanceId: string,
    visibility: 'public' | 'private' | 'decline'
  ) => {
    refreshAfter(() => respondToCharacterSignalAction({ signalId: instanceId, visibility }));
  }, [refreshAfter]);

  const registerDetailTrigger = useCallback((key: string, element: HTMLButtonElement | null) => {
    detailTriggers.current[key] = element;
  }, []);

  const registerRecognitionTrigger = useCallback((element: HTMLButtonElement | null) => {
    recognitionTriggerRef.current = element;
  }, []);

  const openSignalDetail = useCallback((signalId: CharacterSignalId, confirmationCount: number) => {
    activeDetailKeyRef.current = signalId;
    setDetailDrawer({ signalId, confirmationCount });
  }, []);

  const closeSignalDetail = useCallback(() => {
    const key = activeDetailKeyRef.current;
    setDetailDrawer(null);
    window.requestAnimationFrame(() => {
      if (key) detailTriggers.current[key]?.focus();
    });
  }, []);

  const openRecognition = useCallback((recipientId?: string) => {
    const recipient = initialData.recipients.find((entry) => entry.id === recipientId)
      ?? initialData.recipients[0]
      ?? null;
    if (!recipient) {
      announce('No eligible connection is ready for recognition yet.');
      return;
    }
    setRecognitionRecipient(recipient);
    setRecognitionOpen(true);
  }, [announce, initialData.recipients]);

  const closeRecognition = useCallback(() => {
    setRecognitionOpen(false);
    setRecognitionRecipient(null);
    window.requestAnimationFrame(() => recognitionTriggerRef.current?.focus());
  }, []);

  const handleRecognitionSubmitted = useCallback(async (payload: {
    recipientId: string;
    recipientName: string;
    signalId: CharacterSignalId;
    interactionType: InteractionType;
  }) => {
    const result = await giveCharacterSignalAction({
      receiverId: payload.recipientId,
      signalId: payload.signalId,
      interactionType: payload.interactionType,
    });
    if (result.success) {
      announce(`Recognition submitted for ${payload.recipientName}.`, result.message);
      router.refresh();
    }
    return result;
  }, [announce, router]);

  const value = useMemo<CharacterSignalsContextValue>(() => ({
    signals: initialData.signals,
    history: initialData.history,
    recipients: initialData.recipients,
    isSaving,
    setVisibility,
    respondToRecognition,
    openSignalDetail,
    openRecognition,
    registerDetailTrigger,
    registerRecognitionTrigger,
    statusMessage,
  }), [
    initialData,
    isSaving,
    setVisibility,
    respondToRecognition,
    openSignalDetail,
    openRecognition,
    registerDetailTrigger,
    registerRecognitionTrigger,
    statusMessage,
  ]);

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
            {statusMessage.detail && <p className="mt-1 text-xs text-white/80">{statusMessage.detail}</p>}
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
