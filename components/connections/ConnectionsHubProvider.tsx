'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  markOpenToChatEducationSeenAction,
  passOnProfileAction,
  removeSavedAction,
  respondOpenToChatAction,
  sendInterestAction,
  sendOpenToChatAction,
  withdrawInterestAction,
} from '@/app/actions/relationships';
import AcceptChatDrawer from '@/components/connections/AcceptChatDrawer';
import ActionConflictDrawer from '@/components/discovery/ActionConflictDrawer';
import OpenToChatDrawer from '@/components/OpenToChatDrawer';
import type {
  ConnectionsHubData,
  IncomingInterestItem,
  IncomingOpenToChatItem,
  MutualConnectionItem,
  SavedHubItem,
  SentHubItem,
} from '@/lib/data/connections-hub';
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
  openToChatNote: string | null;
};

type AcceptDrawerState = {
  profileId: string;
  requestId: string;
  profileName: string;
  mode: 'confirm' | 'success';
  note: string | null;
} | null;

type StatusMessage = {
  text: string;
  detail?: string;
};

type ConnectionsHubContextValue = {
  activeTab: ConnectionsTabId;
  setActiveTab: (tab: ConnectionsTabId) => void;
  tabCounts: ConnectionsHubData['tabCounts'];
  openToChat: IncomingOpenToChatItem[];
  interestReceived: IncomingInterestItem[];
  mutual: MutualConnectionItem[];
  saved: SavedHubItem[];
  sent: SentHubItem[];
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
  openToChatNote: null,
};

const ConnectionsHubContext = createContext<ConnectionsHubContextValue | null>(null);

export function useConnectionsHub() {
  const ctx = useContext(ConnectionsHubContext);
  if (!ctx) {
    throw new Error('useConnectionsHub must be used within ConnectionsHubProvider');
  }
  return ctx;
}

function buildInitialOtcStatus(
  items: IncomingOpenToChatItem[]
): Record<string, OpenToChatRequestStatus> {
  const map: Record<string, OpenToChatRequestStatus> = {};
  for (const item of items) {
    map[item.id] = item.status === 'deferred' ? 'saved_later' : 'pending';
  }
  return map;
}

function buildInitialSavedActions(sent: SentHubItem[]): Record<string, SavedProfileActionState> {
  const actions: Record<string, SavedProfileActionState> = {};
  for (const entry of sent) {
    if (entry.type === 'interested') {
      actions[entry.profileId] = {
        interested: true,
        openToChatSent: false,
        openToChatNote: null,
      };
    } else if (entry.type === 'open_to_chat') {
      actions[entry.profileId] = {
        interested: false,
        openToChatSent: true,
        openToChatNote: entry.note,
      };
    }
  }
  return actions;
}

function computeTabCounts(
  openToChat: IncomingOpenToChatItem[],
  interestReceived: IncomingInterestItem[],
  mutual: MutualConnectionItem[],
  saved: SavedHubItem[],
  sent: SentHubItem[],
  openToChatStatus: Record<string, OpenToChatRequestStatus>,
  interestStatus: Record<string, InterestReceivedStatus>,
  savedRemoved: Record<string, boolean>,
  sentWithdrawn: Record<string, boolean>
): ConnectionsHubData['tabCounts'] {
  const visibleOtc = openToChat.filter((item) => {
    const status = openToChatStatus[item.id] ?? (item.status === 'deferred' ? 'saved_later' : 'pending');
    return status !== 'declined';
  });
  const pendingOtc = visibleOtc.filter((item) => {
    const status = openToChatStatus[item.id] ?? (item.status === 'deferred' ? 'saved_later' : 'pending');
    return status === 'pending';
  });
  const visibleInterest = interestReceived.filter(
    (item) => (interestStatus[item.id] ?? 'pending') === 'pending'
  );
  const newlyMutual = interestReceived.filter(
    (item) => (interestStatus[item.id] ?? 'pending') === 'mutual'
  );
  const mutualIds = new Set(mutual.map((item) => item.id));
  const mutualCount = mutual.length + newlyMutual.filter((item) => !mutualIds.has(item.id)).length;
  const savedCount = saved.filter((item) => !savedRemoved[item.id]).length;
  const sentCount = sent.filter((item) => !sentWithdrawn[item.id]).length;

  return {
    forYou: pendingOtc.slice(0, 2).length + visibleInterest.length + mutualCount,
    openToChat: visibleOtc.length,
    mutual: mutualCount,
    saved: savedCount,
    sent: sentCount,
  };
}

export function ConnectionsHubProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: ConnectionsHubData;
}) {
  const [activeTab, setActiveTab] = useState<ConnectionsTabId>('forYou');
  const [openToChat, setOpenToChat] = useState(initialData.openToChat);
  const [interestReceived, setInterestReceived] = useState(initialData.interestReceived);
  const [mutual, setMutual] = useState(initialData.mutual);
  const [saved, setSaved] = useState(initialData.saved);
  const [sent, setSent] = useState(initialData.sent);
  const [educationSeen, setEducationSeen] = useState(initialData.educationSeen);
  const [openToChatStatus, setOpenToChatStatus] = useState(() =>
    buildInitialOtcStatus(initialData.openToChat)
  );
  const [interestStatus, setInterestStatus] = useState<Record<string, InterestReceivedStatus>>({});
  const [mutualConversationReady, setMutualConversationReady] = useState<Record<string, boolean>>(
    {}
  );
  const [savedRemoved, setSavedRemoved] = useState<Record<string, boolean>>({});
  const [sentWithdrawn, setSentWithdrawn] = useState<Record<string, boolean>>({});
  const [savedActions, setSavedActions] = useState(() =>
    buildInitialSavedActions(initialData.sent)
  );
  const [conflict, setConflict] = useState<DiscoveryActionConflict | null>(null);
  const [openToChatPrompt, setOpenToChatPrompt] = useState<OpenToChatPrompt | null>(null);
  const [acceptDrawer, setAcceptDrawer] = useState<AcceptDrawerState>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [pending, setPending] = useState(false);
  const acceptTriggerRef = useRef<HTMLButtonElement | null>(null);
  const savedOpenToChatTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setOpenToChat(initialData.openToChat);
    setInterestReceived(initialData.interestReceived);
    setMutual(initialData.mutual);
    setSaved(initialData.saved);
    setSent(initialData.sent);
    setEducationSeen(initialData.educationSeen);
    setOpenToChatStatus(buildInitialOtcStatus(initialData.openToChat));
    setInterestStatus({});
    setSavedRemoved({});
    setSentWithdrawn({});
    setSavedActions(buildInitialSavedActions(initialData.sent));
  }, [initialData]);

  const announce = useCallback((text: string, detail?: string) => {
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    setStatusMessage({ text, detail });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
      statusTimerRef.current = null;
    }, 4200);
  }, []);

  const getOpenToChatStatus = useCallback(
    (profileId: string) => {
      if (openToChatStatus[profileId]) return openToChatStatus[profileId];
      const item = openToChat.find((entry) => entry.id === profileId);
      if (item?.status === 'deferred') return 'saved_later';
      return 'pending';
    },
    [openToChat, openToChatStatus]
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

  const findOpenToChatRequest = useCallback(
    (profileId: string) => openToChat.find((item) => item.id === profileId) ?? null,
    [openToChat]
  );

  const acceptOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      const request = findOpenToChatRequest(profileId);
      if (!request) {
        announce('This request is no longer available.');
        return;
      }
      setAcceptDrawer({
        profileId,
        requestId: request.requestId,
        profileName,
        mode: 'confirm',
        note: request.note,
      });
    },
    [announce, findOpenToChatRequest]
  );

  const confirmAcceptOpenToChat = useCallback(async () => {
    if (!acceptDrawer || acceptDrawer.mode !== 'confirm' || pending) return;
    const { profileId, requestId, profileName, note } = acceptDrawer;

    setPending(true);
    const result = await respondOpenToChatAction(requestId, 'accept');
    setPending(false);

    if (!result.success) {
      announce(result.message);
      return;
    }

    setOpenToChatStatus((prev) => ({ ...prev, [profileId]: 'accepted' }));

    const request = findOpenToChatRequest(profileId);
    if (request) {
      setMutual((prev) => {
        if (prev.some((item) => item.id === profileId)) return prev;
        return [
          {
            ...request,
            connectionId: `local-${requestId}`,
            source: 'open_to_chat' as const,
            relativeTime: 'Just now',
          },
          ...prev,
        ];
      });
    }

    setAcceptDrawer({
      profileId,
      requestId,
      profileName,
      mode: 'success',
      note,
    });
    announce(`You're connected with ${profileName}.`, 'Messaging is coming later.');
  }, [acceptDrawer, announce, findOpenToChatRequest, pending]);

  const closeAcceptDrawer = useCallback(() => {
    setAcceptDrawer(null);
    window.requestAnimationFrame(() => acceptTriggerRef.current?.focus());
  }, []);

  const saveOpenToChatForLater = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      const request = findOpenToChatRequest(profileId);
      if (!request) {
        announce('This request is no longer available.');
        return;
      }

      const previousStatus = getOpenToChatStatus(profileId);
      setPending(true);
      setOpenToChatStatus((prev) => ({ ...prev, [profileId]: 'saved_later' }));
      setOpenToChat((prev) =>
        prev.map((item) =>
          item.id === profileId ? { ...item, status: 'deferred' as const } : item
        )
      );

      const result = await respondOpenToChatAction(request.requestId, 'defer');
      setPending(false);

      if (!result.success) {
        setOpenToChatStatus((prev) => ({ ...prev, [profileId]: previousStatus }));
        setOpenToChat((prev) =>
          prev.map((item) =>
            item.id === profileId
              ? { ...item, status: previousStatus === 'saved_later' ? 'deferred' : 'pending' }
              : item
          )
        );
        announce(result.message);
        return;
      }

      announce(`${profileName}'s request saved for later.`);
    },
    [announce, findOpenToChatRequest, getOpenToChatStatus, pending]
  );

  const declineOpenToChat = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      const request = findOpenToChatRequest(profileId);
      if (!request) {
        announce('This request is no longer available.');
        return;
      }

      const previousStatus = getOpenToChatStatus(profileId);
      const previousItems = openToChat;
      setPending(true);
      setOpenToChatStatus((prev) => ({ ...prev, [profileId]: 'declined' }));

      const result = await respondOpenToChatAction(request.requestId, 'decline');
      setPending(false);

      if (!result.success) {
        setOpenToChatStatus((prev) => ({ ...prev, [profileId]: previousStatus }));
        setOpenToChat(previousItems);
        announce(result.message);
        return;
      }

      setOpenToChat((prev) => prev.filter((item) => item.id !== profileId));
      announce(`Request from ${profileName} removed.`);
    },
    [announce, findOpenToChatRequest, getOpenToChatStatus, openToChat, pending]
  );

  const expressMutualInterest = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      const previous = getInterestStatus(profileId);
      setPending(true);
      setInterestStatus((prev) => ({ ...prev, [profileId]: 'mutual' }));

      const result = await sendInterestAction(profileId);
      setPending(false);

      if (!result.success) {
        setInterestStatus((prev) => ({ ...prev, [profileId]: previous }));
        announce(result.message);
        return;
      }

      const interestItem = interestReceived.find((item) => item.id === profileId);
      if (interestItem && result.data.mutual) {
        setMutual((prev) => {
          if (prev.some((item) => item.id === profileId)) return prev;
          return [
            {
              ...interestItem,
              connectionId: `local-interest-${interestItem.interestId}`,
              source: 'mutual_interest' as const,
              relativeTime: 'Just now',
            },
            ...prev,
          ];
        });
        setInterestReceived((prev) => prev.filter((item) => item.id !== profileId));
      }

      announce(
        `You and ${profileName} have both expressed interest.`,
        result.data.mutual ? 'You are now connected.' : undefined
      );
    },
    [announce, getInterestStatus, interestReceived, pending]
  );

  const declineInterest = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      const previous = getInterestStatus(profileId);
      const previousItems = interestReceived;
      setPending(true);
      setInterestStatus((prev) => ({ ...prev, [profileId]: 'declined' }));

      const result = await passOnProfileAction(profileId);
      setPending(false);

      if (!result.success) {
        setInterestStatus((prev) => ({ ...prev, [profileId]: previous }));
        setInterestReceived(previousItems);
        announce(result.message);
        return;
      }

      setInterestReceived((prev) => prev.filter((item) => item.id !== profileId));
      announce(`Introduction from ${profileName} passed.`);
    },
    [announce, getInterestStatus, interestReceived, pending]
  );

  const startMutualConversation = useCallback(
    (profileId: string, profileName: string) => {
      setMutualConversationReady((prev) => ({ ...prev, [profileId]: true }));
      announce(`You're connected with ${profileName}.`, 'Messaging is coming later.');
    },
    [announce]
  );

  const removeSavedProfile = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      setPending(true);
      setSavedRemoved((prev) => ({ ...prev, [profileId]: true }));

      const result = await removeSavedAction(profileId);
      setPending(false);

      if (!result.success) {
        setSavedRemoved((prev) => {
          const next = { ...prev };
          delete next[profileId];
          return next;
        });
        announce(result.message);
        return;
      }

      setSaved((prev) => prev.filter((item) => item.id !== profileId));
      setSavedActions((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
      announce(`${profileName} was removed from Saved.`);
    },
    [announce, pending]
  );

  const withdrawSentActivity = useCallback(
    async (entryId: string, profileName: string) => {
      if (pending) return;
      const entry = sent.find((item) => item.id === entryId);
      if (!entry || !entry.canWithdraw || entry.type !== 'interested') {
        announce('This activity can no longer be withdrawn.');
        return;
      }

      setPending(true);
      setSentWithdrawn((prev) => ({ ...prev, [entryId]: true }));

      const result = await withdrawInterestAction(entry.profileId);
      setPending(false);

      if (!result.success) {
        setSentWithdrawn((prev) => {
          const next = { ...prev };
          delete next[entryId];
          return next;
        });
        announce(result.message);
        return;
      }

      setSent((prev) => prev.filter((item) => item.id !== entryId));
      patchSavedAction(entry.profileId, { interested: false });
      announce(`Activity with ${profileName} was withdrawn.`);
    },
    [announce, patchSavedAction, pending, sent]
  );

  const applySavedInterested = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      const previous = getSavedActionState(profileId);
      setPending(true);
      patchSavedAction(profileId, {
        interested: true,
        openToChatSent: false,
        openToChatNote: null,
      });

      const result = await sendInterestAction(profileId);
      setPending(false);

      if (!result.success) {
        patchSavedAction(profileId, previous);
        announce(result.message);
        return;
      }

      announce(
        `You've expressed interest in ${profileName}.`,
        result.data.mutual
          ? 'You both expressed interest — you are now connected.'
          : `If ${profileName} is also interested, Forge will let you both know.`
      );
    },
    [announce, getSavedActionState, patchSavedAction, pending]
  );

  const launchSavedOpenToChat = useCallback(
    (profileId: string, profileName: string) => {
      const state = getSavedActionState(profileId);
      if (state.openToChatSent) return;

      const showEducation = !educationSeen;
      setOpenToChatPrompt({
        profileId,
        profileName,
        initialStep: showEducation ? 'educate' : 'note',
        showFirstTimeBanner: showEducation,
        educateOnly: false,
      });
    },
    [educationSeen, getSavedActionState]
  );

  const handleSavedInterested = useCallback(
    (profileId: string, profileName: string) => {
      const state = getSavedActionState(profileId);
      if (state.interested || pending) return;

      if (state.openToChatSent) {
        setConflict({ type: 'chat-to-interested', profileId, profileName });
        return;
      }

      void applySavedInterested(profileId, profileName);
    },
    [applySavedInterested, getSavedActionState, pending]
  );

  const handleUndoSavedInterested = useCallback(
    async (profileId: string, profileName: string) => {
      if (pending) return;
      setPending(true);
      patchSavedAction(profileId, { interested: false });

      const result = await withdrawInterestAction(profileId);
      setPending(false);

      if (!result.success) {
        patchSavedAction(profileId, { interested: true });
        announce(result.message);
        return;
      }

      announce(`Interest in ${profileName} was removed.`);
    },
    [announce, patchSavedAction, pending]
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

    void applySavedInterested(conflict.profileId, conflict.profileName);
    setConflict(null);
  }, [applySavedInterested, conflict, launchSavedOpenToChat, patchSavedAction]);

  const closeOpenToChatDrawer = useCallback(() => {
    const profileId = openToChatPrompt?.profileId;
    setOpenToChatPrompt(null);
    if (profileId) returnFocusToSavedOpenToChat(profileId);
  }, [openToChatPrompt, returnFocusToSavedOpenToChat]);

  const handleOpenToChatSent = useCallback(
    async (note: string | null): Promise<boolean> => {
      if (!openToChatPrompt || pending) return false;
      setPending(true);
      const result = await sendOpenToChatAction(openToChatPrompt.profileId, note);
      setPending(false);

      if (!result.success) {
        announce(result.message);
        return false;
      }

      patchSavedAction(openToChatPrompt.profileId, {
        openToChatSent: true,
        interested: false,
        openToChatNote: note,
      });
      setEducationSeen(true);
      announce(
        `Open to Chat sent to ${openToChatPrompt.profileName}.`,
        note ? 'Your note was included with the request.' : 'Your request was sent without a note.'
      );
      return true;
    },
    [announce, openToChatPrompt, patchSavedAction, pending]
  );

  const handleEducationContinued = useCallback(() => {
    setEducationSeen(true);
    void markOpenToChatEducationSeenAction();
  }, []);

  const tabCounts = useMemo(
    () =>
      computeTabCounts(
        openToChat,
        interestReceived,
        mutual,
        saved,
        sent,
        openToChatStatus,
        interestStatus,
        savedRemoved,
        sentWithdrawn
      ),
    [
      openToChat,
      interestReceived,
      mutual,
      saved,
      sent,
      openToChatStatus,
      interestStatus,
      savedRemoved,
      sentWithdrawn,
    ]
  );

  const value = useMemo<ConnectionsHubContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      tabCounts,
      openToChat,
      interestReceived,
      mutual,
      saved,
      sent,
      getOpenToChatStatus,
      getInterestStatus,
      isMutualConversationReady,
      isSavedRemoved,
      isSentWithdrawn,
      getSavedActionState,
      acceptOpenToChat,
      confirmAcceptOpenToChat: () => {
        void confirmAcceptOpenToChat();
      },
      closeAcceptDrawer,
      saveOpenToChatForLater: (profileId, profileName) => {
        void saveOpenToChatForLater(profileId, profileName);
      },
      declineOpenToChat: (profileId, profileName) => {
        void declineOpenToChat(profileId, profileName);
      },
      expressMutualInterest: (profileId, profileName) => {
        void expressMutualInterest(profileId, profileName);
      },
      declineInterest: (profileId, profileName) => {
        void declineInterest(profileId, profileName);
      },
      startMutualConversation,
      removeSavedProfile: (profileId, profileName) => {
        void removeSavedProfile(profileId, profileName);
      },
      withdrawSentActivity: (entryId, profileName) => {
        void withdrawSentActivity(entryId, profileName);
      },
      handleSavedInterested,
      handleUndoSavedInterested: (profileId, profileName) => {
        void handleUndoSavedInterested(profileId, profileName);
      },
      handleSavedOpenToChat,
      registerSavedOpenToChatTrigger,
      statusMessage,
      acceptDrawer,
      acceptTriggerRef,
    }),
    [
      activeTab,
      tabCounts,
      openToChat,
      interestReceived,
      mutual,
      saved,
      sent,
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

  const promptState = openToChatPrompt
    ? getSavedActionState(openToChatPrompt.profileId)
    : null;

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
        note={acceptDrawer?.note ?? null}
        onClose={closeAcceptDrawer}
        onConfirm={() => {
          void confirmAcceptOpenToChat();
        }}
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
        onEducationContinued={handleEducationContinued}
        profileName={openToChatPrompt?.profileName ?? 'them'}
        initialStep={openToChatPrompt?.initialStep ?? 'educate'}
        showFirstTimeBanner={openToChatPrompt?.showFirstTimeBanner ?? false}
        educateOnly={openToChatPrompt?.educateOnly ?? false}
        alreadySent={promptState?.openToChatSent ?? false}
      />
    </ConnectionsHubContext.Provider>
  );
}
