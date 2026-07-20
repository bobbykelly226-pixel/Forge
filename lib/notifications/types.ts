export const NOTIFICATION_TYPES = [
  'new_message',
  'mutual_connection',
  'open_to_chat_accepted',
  'interest_received',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_ENTITY_TYPES = [
  'message',
  'conversation',
  'connection',
  'open_to_chat_request',
  'interest',
] as const;

export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export type AppNotification = {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  notificationType: NotificationType;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
  destinationPath: string;
  readAt: string | null;
  createdAt: string;
  actorFirstName: string | null;
  actorPhotoUrl: string | null;
};

export type NotificationsListResult = {
  notifications: AppNotification[];
  unreadCount: number;
};

/** Verified destination prefixes allowed in the authenticated app. */
export const VERIFIED_NOTIFICATION_DESTINATION_PREFIXES = [
  '/connections',
  '/discovery/profile/',
] as const;
