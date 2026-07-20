import { createClient } from '@/lib/supabase/server';
import { ensureFoundationalRecords, type DataAccessResult } from '@/lib/data/profile';
import {
  isSupportedNotificationType,
  resolveNotificationDestination,
} from '@/lib/notifications/resolve';
import type {
  AppNotification,
  NotificationEntityType,
  NotificationsListResult,
} from '@/lib/notifications/types';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null as null };
  }
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

type RpcOk = { ok?: boolean; message?: string; [key: string]: unknown };

function rpcResult(
  data: unknown,
  error: { message: string } | null,
  fallback: string
): DataAccessResult<RpcOk> {
  if (error) {
    console.error(fallback, error.message);
    return { success: false, message: fallback };
  }
  const payload = (data ?? {}) as RpcOk;
  if (!payload.ok) {
    return {
      success: false,
      message: typeof payload.message === 'string' ? payload.message : fallback,
    };
  }
  return { success: true, data: payload };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function mapNotification(row: unknown): AppNotification | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const r = row as Record<string, unknown>;
  const id = asString(r.id);
  const recipientUserId = asString(r.recipient_user_id);
  const notificationTypeRaw = asString(r.notification_type);
  const body = asString(r.body);
  const entityType = asString(r.entity_type) as NotificationEntityType | null;
  const entityId = asString(r.entity_id);
  const destinationPath = asString(r.destination_path);
  const createdAt = asString(r.created_at);
  if (
    !id ||
    !recipientUserId ||
    !notificationTypeRaw ||
    !isSupportedNotificationType(notificationTypeRaw) ||
    !body ||
    !entityType ||
    !entityId ||
    !destinationPath ||
    !createdAt
  ) {
    return null;
  }
  return {
    id,
    recipientUserId,
    actorUserId: asString(r.actor_user_id),
    notificationType: notificationTypeRaw,
    body,
    entityType,
    entityId,
    destinationPath: resolveNotificationDestination(destinationPath),
    readAt: asString(r.read_at),
    createdAt,
    actorFirstName: asString(r.actor_first_name),
    actorPhotoUrl: asString(r.actor_photo_url),
  };
}

export async function listMyNotifications(
  limit = 40
): Promise<DataAccessResult<NotificationsListResult>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('list_my_notifications', {
    p_limit: limit,
  });
  const result = rpcResult(data, error, 'Could not load notifications.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const rows = Array.isArray(result.data.notifications) ? result.data.notifications : [];
  const notifications = rows
    .map(mapNotification)
    .filter((item): item is AppNotification => Boolean(item));
  const unreadCount =
    typeof result.data.unread_count === 'number'
      ? result.data.unread_count
      : notifications.filter((item) => !item.readAt).length;

  return { success: true, data: { notifications, unreadCount } };
}

export async function markNotificationRead(
  notificationId: string
): Promise<DataAccessResult<{ readAt: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });
  const result = rpcResult(data, error, 'Could not update this notification.');
  if (!result.success) return { success: false, message: result.message };
  const readAt = asString(result.data?.read_at);
  if (!readAt) return { success: false, message: 'Could not update this notification.' };
  return { success: true, data: { readAt } };
}

export async function markAllNotificationsRead(): Promise<
  DataAccessResult<{ updated: number }>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  const result = rpcResult(data, error, 'Could not update notifications.');
  if (!result.success) return { success: false, message: result.message };
  const updated = typeof result.data?.updated === 'number' ? result.data.updated : 0;
  return { success: true, data: { updated } };
}
