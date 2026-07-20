'use server';

import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/data/notifications';
import { listMyConversations } from '@/lib/data/conversations';

export async function listMyNotificationsAction(limit?: number) {
  return listMyNotifications(limit);
}

export async function markNotificationReadAction(notificationId: string) {
  return markNotificationRead(notificationId);
}

export async function markAllNotificationsReadAction() {
  return markAllNotificationsRead();
}

/** Lightweight indicators for Messages badge + Notifications bell. */
export async function getNavIndicatorsAction() {
  const [conversations, notifications] = await Promise.all([
    listMyConversations(),
    listMyNotifications(1),
  ]);

  const messagesUnread =
    conversations.success && conversations.data
      ? conversations.data.some((item) => item.unread)
      : false;

  const notificationsUnreadCount =
    notifications.success && notifications.data
      ? notifications.data.unreadCount
      : 0;

  return {
    success: true as const,
    data: {
      messagesUnread,
      notificationsUnreadCount,
    },
  };
}
