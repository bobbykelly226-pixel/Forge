import {
  VERIFIED_NOTIFICATION_DESTINATION_PREFIXES,
  type NotificationType,
} from '@/lib/notifications/types';

/** Returns a verified in-app path, or a safe Connections fallback. */
export function resolveNotificationDestination(destinationPath: string | null | undefined): string {
  const raw = (destinationPath ?? '').trim();
  if (!raw.startsWith('/')) {
    return '/connections';
  }
  const allowed = VERIFIED_NOTIFICATION_DESTINATION_PREFIXES.some(
    (prefix) => raw === prefix || raw.startsWith(prefix)
  );
  if (!allowed) {
    return '/connections';
  }
  // Block invented nested routes outside known patterns.
  if (raw.startsWith('/connections')) {
    if (
      raw === '/connections' ||
      raw.startsWith('/connections?') ||
      raw.startsWith('/connections/c/')
    ) {
      return raw;
    }
    return '/connections';
  }
  if (raw.startsWith('/discovery/profile/')) {
    const id = raw.slice('/discovery/profile/'.length).split(/[?#]/)[0] ?? '';
    if (id.length > 0 && !id.includes('/')) {
      return `/discovery/profile/${id}`;
    }
    return '/discovery';
  }
  return '/connections';
}

export function isSupportedNotificationType(value: string): value is NotificationType {
  return (
    value === 'new_message' ||
    value === 'mutual_connection' ||
    value === 'open_to_chat_accepted' ||
    value === 'interest_received'
  );
}

/** Copy builders used by tests and docs; DB stores the rendered body at insert. */
export function buildNotificationBody(
  type: NotificationType,
  actorFirstName: string
): string {
  const name = actorFirstName.trim() || 'Someone';
  switch (type) {
    case 'new_message':
      return `${name} sent you a message.`;
    case 'mutual_connection':
      return `You and ${name} are now connected.`;
    case 'open_to_chat_accepted':
      return `${name} accepted your invitation to chat.`;
    case 'interest_received':
      return `${name} is interested in connecting.`;
  }
}
