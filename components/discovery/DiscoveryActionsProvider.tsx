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

import ActionConflictDrawer from '@/components/discovery/ActionConflictDrawer';
import NotForMeDrawer from '@/components/discovery/NotForMeDrawer';
import OpenToChatDrawer from '@/components/OpenToChatDrawer';
import {
  createEmptyActionState,
  type DiscoveryActionConflict,
  type DiscoveryProfileActionState,
  type NotForMePrompt,
  type OpenToChatPrompt,
} from '@/lib/discovery-actions-types';

type StatusMessage = {
  text: string;
  detail?: string;
};

type DiscoveryActionsContextValue = {
  getState: (profileId: string) => DiscoveryProfileActionState;
  isPassed: (profileId: string) => boolean;
  statusMessage: StatusMessage | null;
  handleInterested: (profileId: string, profileName: string) => void;
  handleUndoInterested: (profileId: string, profileName: string) => void;
  handleInterestedInfo: (profileName: string) => void;
  handleOpenToChat: (profileId: string, profileName: string) => void;
  handleOpenToChatInfo: (profileId: string, profileName: string) => void;
  handleSaveForLater: (profileId: string, profileName: string) => void;
  handleNotForMe: (profileId: string, profileName: string) => void;
  registerOpenToChatTrigger: (profileId: string, element: HTMLButtonElement | null) => void;
};

const DiscoveryActionsContext = createContext<DiscoveryActionsContextValue | null>(null);

export function useDiscoveryActions() {
  const ctx = useContext(DiscoveryActionsContext);
  if (!ctx) {
    throw new Error('useDiscoveryActions must be used within DiscoveryActionsProvider');
  }
  return ctx;
}

export function DiscoveryActionsProvider({ children }: { children: ReactNode }) {
  const [byProfileId, setByProfileId] = useState<Record<string, DiscoveryProfileActionState>>({});
  const [sessionOpenToChatEducated, setSessionOpenToChatEducated] = useState(false);
  const [conflict, setConflict] = useState<DiscoveryActionConflict | null>(null);
  const [notForMePrompt, setNotForMePrompt] = useState<NotForMePrompt | null>(null);
  const [openToChatPrompt, setOpenToChatPrompt] = useState<OpenToChatPrompt | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const openToChatTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const statusTimerRef = useRef<number | null>(null);

  const getState = useCallback(
    (profileId: string): DiscoveryProfileActionState =>
      byProfileId[profileId] ?? createEmptyActionState(),
    [byProfileId]
  );

  const isPassed = useCallback(
    (profileId: string) => getState(profileId).passed,
    [getState]
  );

  const patchState = useCallback(
    (profileId: string, patch: Partial<DiscoveryProfileActionState>) => {
      setByProfileId((prev) => ({
        ...prev,
        [profileId]: { ...(prev[profileId] ?? createEmptyActionState()), ...patch },
      }));
    },
    []
  );

  const announce = useCallback((text: string, detail?: string) => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    setStatusMessage({ text, detail });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 4200);
  }, []);

  const registerOpenToChatTrigger = useCallback(
    (profileId: string, element: HTMLButtonElement | null) => {
      openToChatTriggers.current[profileId] = element;
    },
    []
  );

  const returnFocusToOpenToChat = useCallback((profileId: string) => {
    window.requestAnimationFrame(() => {
      openToChatTriggers.current[profileId]?.focus();
    });
  }, []);

  const launchOpenToChat = useCallback(
    (profileId: string, profileName: string, forceEducate = false) => {
      const state = getState(profileId);
      if (state.openToChatSent) return;

      const showEducation = forceEducate || !sessionOpenToChatEducated;
      setOpenToChatPrompt({
        profileId,
        profileName,
        mode: forceEducate ? 'educate' : showEducation ? 'educate' : 'confirm',
        showFirstTimeBanner: showEducation && !sessionOpenToChatEducated,
      });
    },
    [getState, sessionOpenToChatEducated]
  );

  const applyInterested = useCallback(
    (profileId: string, profileName: string) => {
      patchState(profileId, { interested: true, openToChatSent: false });
      announce(
        `You've expressed interest in ${profileName}.`,
        `If ${profileName} is also interested, Forge will let you both know.`
      );
    },
    [announce, patchState]
  );

  const applyOpenToChatSent = useCallback(
    (profileId: string, profileName: string) => {
      patchState(profileId, { openToChatSent: true, interested: false });
      setSessionOpenToChatEducated(true);
      announce(`Open to Chat sent to ${profileName}.`);
    },
    [announce, patchState]
  );

  const handleInterested = useCallback(
    (profileId: string, profileName: string) => {
      const state = getState(profileId);
      if (state.interested) return;

      if (state.openToChatSent) {
        setConflict({ type: 'chat-to-interested', profileId, profileName });
        return;
      }

      applyInterested(profileId, profileName);
    },
    [applyInterested, getState]
  );

  const handleUndoInterested = useCallback(
    (profileId: string, profileName: string) => {
      patchState(profileId, { interested: false });
      announce(`Interest in ${profileName} was removed.`);
    },
    [announce, patchState]
  );

  const handleInterestedInfo = useCallback(
    (profileName: string) => {
      announce(
        'Interested means you would be open to connecting if the interest is mutual.',
        `If ${profileName} is also interested, Forge will let you both know. No message is sent.`
      );
    },
    [announce]
  );

  const handleOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      const state = getState(profileId);
      if (state.openToChatSent) return;

      if (state.interested) {
        setConflict({ type: 'interested-to-chat', profileId, profileName });
        return;
      }

      launchOpenToChat(profileId, profileName);
    },
    [getState, launchOpenToChat]
  );

  const handleOpenToChatInfo = useCallback(
    (profileId: string, profileName: string) => {
      launchOpenToChat(profileId, profileName, true);
    },
    [launchOpenToChat]
  );

  const handleSaveForLater = useCallback(
    (profileId: string, profileName: string) => {
      const state = getState(profileId);
      if (state.saved) {
        patchState(profileId, { saved: false });
        announce(`${profileName} was removed from Saved.`);
        return;
      }

      patchState(profileId, { saved: true });
      announce(
        `${profileName} was saved for later.`,
        'Only you can see saved profiles.'
      );
    },
    [announce, getState, patchState]
  );

  const handleNotForMe = useCallback((profileId: string, profileName: string) => {
    setNotForMePrompt({ profileId, profileName });
  }, []);

  const confirmNotForMe = useCallback(() => {
    if (!notForMePrompt) return;
    const { profileId, profileName } = notForMePrompt;
    patchState(profileId, {
      interested: false,
      openToChatSent: false,
      saved: false,
      passed: true,
    });
    setNotForMePrompt(null);
    announce('Introduction passed.');
  }, [announce, notForMePrompt, patchState]);

  const confirmConflict = useCallback(() => {
    if (!conflict) return;

    if (conflict.type === 'interested-to-chat') {
      patchState(conflict.profileId, { interested: false });
      setConflict(null);
      launchOpenToChat(conflict.profileId, conflict.profileName);
      return;
    }

    applyInterested(conflict.profileId, conflict.profileName);
    setConflict(null);
  }, [applyInterested, conflict, launchOpenToChat, patchState]);

  const closeOpenToChatDrawer = useCallback(() => {
    const profileId = openToChatPrompt?.profileId;
    setOpenToChatPrompt(null);
    if (profileId) returnFocusToOpenToChat(profileId);
  }, [openToChatPrompt, returnFocusToOpenToChat]);

  const handleOpenToChatSent = useCallback(() => {
    if (!openToChatPrompt) return;
    applyOpenToChatSent(openToChatPrompt.profileId, openToChatPrompt.profileName);
  }, [applyOpenToChatSent, openToChatPrompt]);

  const value = useMemo<DiscoveryActionsContextValue>(
    () => ({
      getState,
      isPassed,
      statusMessage,
      handleInterested,
      handleUndoInterested,
      handleInterestedInfo,
      handleOpenToChat,
      handleOpenToChatInfo,
      handleSaveForLater,
      handleNotForMe,
      registerOpenToChatTrigger,
    }),
    [
      getState,
      isPassed,
      statusMessage,
      handleInterested,
      handleUndoInterested,
      handleInterestedInfo,
      handleOpenToChat,
      handleOpenToChatInfo,
      handleSaveForLater,
      handleNotForMe,
      registerOpenToChatTrigger,
    ]
  );

  return (
    <DiscoveryActionsContext.Provider value={value}>
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

      <ActionConflictDrawer
        open={conflict !== null}
        conflict={conflict}
        onClose={() => setConflict(null)}
        onConfirm={confirmConflict}
      />

      <NotForMeDrawer
        open={notForMePrompt !== null}
        prompt={notForMePrompt}
        onClose={() => setNotForMePrompt(null)}
        onConfirm={confirmNotForMe}
      />

      <OpenToChatDrawer
        open={openToChatPrompt !== null}
        onClose={closeOpenToChatDrawer}
        onSent={handleOpenToChatSent}
        profileName={openToChatPrompt?.profileName ?? 'them'}
        mode={openToChatPrompt?.mode ?? 'educate'}
        showFirstTimeBanner={openToChatPrompt?.showFirstTimeBanner ?? false}
      />
    </DiscoveryActionsContext.Provider>
  );
}
