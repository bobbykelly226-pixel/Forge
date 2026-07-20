'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getNavIndicatorsAction,
  listMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/actions/notifications';
import NotificationsDrawer from '@/components/notifications/NotificationsDrawer';
import type { AppNotification } from '@/lib/notifications/types';

type NotificationsContextValue = {
  openNotifications: () => void;
  closeNotifications: () => void;
  notificationsUnreadCount: number;
  messagesUnread: boolean;
  refreshIndicators: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}

/** Optional hook when provider may be absent (e.g. tests). */
export function useNotificationsOptional() {
  return useContext(NotificationsContext);
}

type NotificationsProviderProps = {
  children: ReactNode;
  initialMessagesUnread?: boolean;
  initialNotificationsUnreadCount?: number;
};

export default function NotificationsProvider({
  children,
  initialMessagesUnread = false,
  initialNotificationsUnreadCount = 0,
}: NotificationsProviderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(
    initialNotificationsUnreadCount
  );
  const [messagesUnread, setMessagesUnread] = useState(initialMessagesUnread);

  const refreshIndicators = useCallback(() => {
    void (async () => {
      const result = await getNavIndicatorsAction();
      if (result.success && result.data) {
        setMessagesUnread(result.data.messagesUnread);
        setNotificationsUnreadCount(result.data.notificationsUnreadCount);
      }
    })();
  }, []);

  useEffect(() => {
    refreshIndicators();
  }, [refreshIndicators]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listMyNotificationsAction(40);
    setLoading(false);
    if (!result.success || !result.data) {
      setError(result.success ? 'Could not load notifications.' : result.message);
      setItems([]);
      return;
    }
    setItems(result.data.notifications);
    setNotificationsUnreadCount(result.data.unreadCount);
  }, []);

  const openNotifications = useCallback(() => {
    setOpen(true);
    void loadNotifications();
  }, [loadNotifications]);

  const closeNotifications = useCallback(() => {
    setOpen(false);
  }, []);

  const onOpenItem = useCallback((item: AppNotification) => {
    setOpen(false);
    if (item.readAt) return;
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row
      )
    );
    setNotificationsUnreadCount((count) => Math.max(0, count - 1));
    void markNotificationReadAction(item.id).then((result) => {
      if (!result.success) {
        refreshIndicators();
      }
    });
  }, [refreshIndicators]);

  const onMarkAllRead = useCallback(() => {
    setItems((prev) =>
      prev.map((row) => (row.readAt ? row : { ...row, readAt: new Date().toISOString() }))
    );
    setNotificationsUnreadCount(0);
    void markAllNotificationsReadAction().then((result) => {
      if (!result.success) {
        void loadNotifications();
      }
    });
  }, [loadNotifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      openNotifications,
      closeNotifications,
      notificationsUnreadCount,
      messagesUnread,
      refreshIndicators,
    }),
    [
      openNotifications,
      closeNotifications,
      notificationsUnreadCount,
      messagesUnread,
      refreshIndicators,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsDrawer
        open={open}
        loading={loading}
        error={error}
        items={items}
        unreadCount={notificationsUnreadCount}
        onClose={closeNotifications}
        onRetry={() => {
          void loadNotifications();
        }}
        onOpenItem={onOpenItem}
        onMarkAllRead={onMarkAllRead}
      />
    </NotificationsContext.Provider>
  );
}
