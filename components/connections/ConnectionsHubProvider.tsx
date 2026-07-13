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

import AcceptChatDrawer from '@/components/connections/AcceptChatDrawer';
import ActionConflictDrawer from '@/components/discovery/ActionConflictDrawer';
import OpenToChatDrawer from '@/components/OpenToChatDrawer';
import type {
  DiscoveryActionConflict,
  OpenToChatPrompt,
} from '@/lib/discovery-actions-types';

export type OpenToChatRequestStatus = 'pending' | 'saved_later' | 'accepted' | 'declined';
export type InterestReceivedStatus = 'pending' | 'mutual' | 'declined';

export type ConnectionsTabId = 'forYou' | 'openToChat' | 'mutual' | 'saved' | 'sent';

export type SavedProfileActionState = {
  interested: boolean;
  openToChatSent: boolean;
};

type AcceptDrawerState = {
  profileId: string;
  profileName: string;
  mode: 'confirm' | 'success';
} | null;

type StatusMessage = {
  text: string;
  detail?: string;
};

type ConnectionsHubContextValue = {
  activeTab: ConnectionsTabId;
  setActiveTab: (tab: ConnectionsTabId) => void;
  getOpenToChatStatus: (profileId: string) => OpenToChatRequestStatus;
  getInterestStatus: (profileId: string) => InterestReceivedStatus;
  isMutualConversationReady: (profileId: string) => boolean;
  isSavedRemoved: (profileId: string) => boolean;
  isSentWithdrawn: (entryId: string) => boolean;
  getSavedActionState: (profileId: string) => SavedProfileActionState;
  acceptOpenToChat: (profileId: string, profileName: string) => void;
  confirmAcceptOpenToChat: () => void;
  closeAcceptDrawer: () => void;
  saveOpenToChatForLater: (profileId: string, profileName: string) => void;
  declineOpenToChat: (profileId: string, profileName: string) => void;
  expressMutualInterest: (profileId: string, profileName: string) => void;
  declineInterest: (profileId: string, profileName: string) => void;
  startMutualConversation: (profileId: string, profileName: string) => void;
  removeSavedProfile: (profileId: string, profileName: string) => void;
  withdrawSentActivity: (entryId: string, profileName: string) => void;
  handleSavedInterested: (profileId: string, profileName: string) => void;
  handleUndoSavedInterested: (profileId: string, profileName: string) => void;
  handleSavedOpenToChat: (profileId: string, profileName: string) => void;
  registerSavedOpenToChatTrigger: (profileId: string, element: HTMLButtonElement | null) => void;
  statusMessage: StatusMessage | null;
  acceptDrawer: AcceptDrawerState;
  acceptTriggerRef: React.MutableRefObject<HTMLButtonElement | null>;
};

const EMPTY_SAVED_ACTION: SavedProfileActionState = {
  interested: false,
  openToChatSent: false,
};

const ConnectionsHubContext = createContext<ConnectionsHubContextValue | null>(null);

export function useConnectionsHub() {
  const ctx = useContext(ConnectionsHubContext);
  if (!ctx) {
    throw new Error('useConnectionsHub must be used within ConnectionsHubProvider');
  }
  return ctx;
}

export function ConnectionsHubProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ConnectionsTabId>('forYou');
  const [openToChatStatus, setOpenToChatStatus] = useState<
    Record<string, OpenToChatRequestStatus>
  >({});
  const [interestStatus, setInterestStatus] = useState<Record<string, InterestReceivedStatus>>(
    {}
  );
  const [mutualConversationReady, setMutualConversationReady] = useState<Record<string, boolean>>(
    {}
  );
  const [savedRemoved, setSavedRemoved] = useState<Record<string, boolean>>({});
  const [sentWithdrawn, setSentWithdrawn] = useState<Record<string, boolean>>({});
  const [savedActions, setSavedActions] = useState<Record<string, SavedProfileActionState>>({});
  const [sessionOpenToChatEducated, setSessionOpenToChatEducated] = useState(false);
  const [conflict, setConflict] = useState<DiscoveryActionConflict | null>(null);
  const [openToChatPrompt, setOpenToChatPrompt] = useState<OpenToChatPrompt | null>(null);
  const [acceptDrawer, setAcceptDrawer] = useState<AcceptDrawerState>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const acceptTriggerRef = useRef<HTMLButtonElement | null>(null);
  const savedOpenToChatTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const statusTimerRef = useRef<number | null>(null);

  const announce = useCallback((text: string, detail?: string) => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    setStatusMessage({ text, detail });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 4200);
  }, []);

  const getOpenToChatStatus = useCallback(
    (profileId: string) => openToChatStatus[profileId] ?? 'pending',
    [openToChatStatus]
  );

  const getInterestStatus = useCallback(
    (profileId: string) => interestStatus[profileId] ?? 'pending',
    [interestStatus]
  );

  const isMutualConversationReady = useCallback(
    (profileId: string) => mutualConversationReady[profileId] ?? false,
    [mutualConversationReady]
  );

  const isSavedRemoved = useCallback(
    (profileId: string) => savedRemoved[profileId] ?? false,
    [savedRemoved]
  );

  const isSentWithdrawn = useCallback(
    (entryId: string) => sentWithdrawn[entryId] ?? false,
    [sentWithdrawn]
  );

  const getSavedActionState = useCallback(
    (profileId: string) => savedActions[profileId] ?? EMPTY_SAVED_ACTION,
    [savedActions]
  );

  const patchSavedAction = useCallback(
    (profileId: string, patch: Partial<SavedProfileActionState>) => {
      setSavedActions((prev) => ({
        ...prev,
        [profileId]: { ...(prev[profileId] ?? EMPTY_SAVED_ACTION), ...patch },
      }));
    },
    []
  );

  const registerSavedOpenToChatTrigger = useCallback(
    (profileId: string, element: HTMLButtonElement | null) => {
      savedOpenToChatTriggers.current[profileId] = element;
    },
    []
  );

  const returnFocusToSavedOpenToChat = useCallback((profileId: string) => {
    window.requestAnimationFrame(() => {
      savedOpenToChatTriggers.current[profileId]?.focus();
    });
  }, []);

  const acceptOpenToChat = useCallback((profileId: string, profileName: string) => {
    setAcceptDrawer({ profileId, profileName, mode: 'confirm' });
  }, []);

  const confirmAcceptOpenToChat = useCallback(() => {
    if (!acceptDrawer) return;
    setOpenToChatStatus((prev) => ({ ...prev, [acceptDrawer.profileId]: 'accepted' }));
    setAcceptDrawer({
      profileId: acceptDrawer.profileId,
      profileName: acceptDrawer.profileName,
      mode: 'success',
    });
    announce(`Conversation opened with ${acceptDrawer.profileName}.`);
  }, [acceptDrawer, announce]);

  const closeAcceptDrawer = useCallback(() => {
    setAcceptDrawer(null);
    window.requestAnimationFrame(() => acceptTriggerRef.current?.focus());
  }, []);

  const saveOpenToChatForLater = useCallback(
    (profileId: string, profileName: string) => {
      setOpenToChatStatus((prev) => ({ ...prev, [profileId]: 'saved_later' }));
      announce(`${profileName}'s request saved for later.`);
    },
    [announce]
  );

  const declineOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      setOpenToChatStatus((prev) => ({ ...prev, [profileId]: 'declined' }));
      announce(`Request from ${profileName} removed.`);
    },
    [announce]
  );

  const expressMutualInterest = useCallback(
    (profileId: string, profileName: string) => {
      setInterestStatus((prev) => ({ ...prev, [profileId]: 'mutual' }));
      announce(`You and ${profileName} have both expressed interest.`);
    },
    [announce]
  );

  const declineInterest = useCallback(
    (profileId: string, profileName: string) => {
      setInterestStatus((prev) => ({ ...prev, [profileId]: 'declined' }));
      announce(`Introduction from ${profileName} passed.`);
    },
    [announce]
  );

  const startMutualConversation = useCallback(
    (profileId: string, profileName: string) => {
      setMutualConversationReady((prev) => ({ ...prev, [profileId]: true }));
      announce(`Conversation ready with ${profileName}. Messaging is not connected yet.`);
    },
    [announce]
  );

  const removeSavedProfile = useCallback(
    (profileId: string, profileName: string) => {
      setSavedRemoved((prev) => ({ ...prev, [profileId]: true }));
      setSavedActions((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
      announce(`${profileName} was removed from Saved.`);
    },
    [announce]
  );

  const withdrawSentActivity = useCallback(
    (entryId: string, profileName: string) => {
      setSentWithdrawn((prev) => ({ ...prev, [entryId]: true }));
      announce(`Activity with ${profileName} was withdrawn.`);
    },
    [announce]
  );

  const applySavedInterested = useCallback(
    (profileId: string, profileName: string) => {
      patchSavedAction(profileId, { interested: true, openToChatSent: false });
      announce(
        `You've expressed interest in ${profileName}.`,
        `If ${profileName} is also interested, Forge will let you both know.`
      );
    },
    [announce, patchSavedAction]
  );

  const launchSavedOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      const state = getSavedActionState(profileId);
      if (state.openToChatSent) return;

      const showEducation = !sessionOpenToChatEducated;
      setOpenToChatPrompt({
        profileId,
        profileName,
        mode: showEducation ? 'educate' : 'confirm',
        showFirstTimeBanner: showEducation,
      });
    },
    [getSavedActionState, sessionOpenToChatEducated]
  );

  const handleSavedInterested = useCallback(
    (profileId: string, profileName: string) => {
      const state = getSavedActionState(profileId);
      if (state.interested) return;

      if (state.openToChatSent) {
        setConflict({ type: 'chat-to-interested', profileId, profileName });
        return;
      }

      applySavedInterested(profileId, profileName);
    },
    [applySavedInterested, getSavedActionState]
  );

  const handleUndoSavedInterested = useCallback(
    (profileId: string, profileName: string) => {
      patchSavedAction(profileId, { interested: false });
      announce(`Interest in ${profileName} was removed.`);
    },
    [announce, patchSavedAction]
  );

  const handleSavedOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      const state = getSavedActionState(profileId);
      if (state.openToChatSent) return;

      if (state.interested) {
        setConflict({ type: 'interested-to-chat', profileId, profileName });
        return;
      }

      launchSavedOpenToChat(profileId, profileName);
    },
    [getSavedActionState, launchSavedOpenToChat]
  );

  const confirmConflict = useCallback(() => {
    if (!conflict) return;

    if (conflict.type === 'interested-to-chat') {
      patchSavedAction(conflict.profileId, { interested: false });
      setConflict(null);
      launchSavedOpenToChat(conflict.profileId, conflict.profileName);
      return;
    }

    applySavedInterested(conflict.profileId, conflict.profileName);
    setConflict(null);
  }, [applySavedInterested, conflict, launchSavedOpenToChat, patchSavedAction]);

  const closeOpenToChatDrawer = useCallback(() => {
    const profileId = openToChatPrompt?.profileId;
    setOpenToChatPrompt(null);
    if (profileId) returnFocusToSavedOpenToChat(profileId);
  }, [openToChatPrompt, returnFocusToSavedOpenToChat]);

  const handleOpenToChatSent = useCallback(() => {
    if (!openToChatPrompt) return;
    patchSavedAction(openToChatPrompt.profileId, {
      openToChatSent: true,
      interested: false,
    });
    setSessionOpenToChatEducated(true);
    announce(`Open to Chat sent to ${openToChatPrompt.profileName}.`);
  }, [announce, openToChatPrompt, patchSavedAction]);

  const value = useMemo<ConnectionsHubContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      getOpenToChatStatus,
      getInterestStatus,
      isMutualConversationReady,
      isSavedRemoved,
      isSentWithdrawn,
      getSavedActionState,
      acceptOpenToChat,
      confirmAcceptOpenToChat,
      closeAcceptDrawer,
      saveOpenToChatForLater,
      declineOpenToChat,
      expressMutualInterest,
      declineInterest,
      startMutualConversation,
      removeSavedProfile,
      withdrawSentActivity,
      handleSavedInterested,
      handleUndoSavedInterested,
      handleSavedOpenToChat,
      registerSavedOpenToChatTrigger,
      statusMessage,
      acceptDrawer,
      acceptTriggerRef,
    }),
    [
      activeTab,
      getOpenToChatStatus,
      getInterestStatus,
      isMutualConversationReady,
      isSavedRemoved,
      isSentWithdrawn,
      getSavedActionState,
      acceptOpenToChat,
      confirmAcceptOpenToChat,
      closeAcceptDrawer,
      saveOpenToChatForLater,
      declineOpenToChat,
      expressMutualInterest,
      declineInterest,
      startMutualConversation,
      removeSavedProfile,
      withdrawSentActivity,
      handleSavedInterested,
      handleUndoSavedInterested,
      handleSavedOpenToChat,
      registerSavedOpenToChatTrigger,
      statusMessage,
      acceptDrawer,
    ]
  );

  return (
    <ConnectionsHubContext.Provider value={value}>
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

      <AcceptChatDrawer
        open={acceptDrawer !== null}
        profileName={acceptDrawer?.profileName ?? ''}
        mode={acceptDrawer?.mode ?? 'confirm'}
        onClose={closeAcceptDrawer}
        onConfirm={confirmAcceptOpenToChat}
      />

      <ActionConflictDrawer
        open={conflict !== null}
        conflict={conflict}
        onClose={() => setConflict(null)}
        onConfirm={confirmConflict}
      />

      <OpenToChatDrawer
        open={openToChatPrompt !== null}
        onClose={closeOpenToChatDrawer}
        onSent={handleOpenToChatSent}
        profileName={openToChatPrompt?.profileName ?? 'them'}
        mode={openToChatPrompt?.mode ?? 'educate'}
        showFirstTimeBanner={openToChatPrompt?.showFirstTimeBanner ?? false}
      />
    </ConnectionsHubContext.Provider>
  );
}
