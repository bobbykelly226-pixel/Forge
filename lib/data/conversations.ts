import { createClient } from '@/lib/supabase/server';
import { ensureFoundationalRecords, type DataAccessResult } from '@/lib/data/profile';
import { MESSAGE_MAX_LENGTH, MESSAGE_PAGE_SIZE } from '@/lib/conversations/constants';
import type {
  ConversationListItem,
  ConversationMessage,
  ConversationThreadMeta,
  ReportPayload,
} from '@/lib/conversations/types';
import { firstNameFromFullName } from '@/lib/discovery/presentation';

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function mapListItem(raw: unknown): ConversationListItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const conversationId = asString(row.conversation_id);
  const connectionId = asString(row.connection_id);
  const peerUserId = asString(row.peer_user_id);
  if (!conversationId || !connectionId || !peerUserId) return null;

  const peerFirstName =
    asString(row.peer_first_name) ??
    firstNameFromFullName(asString(row.peer_full_name)) ??
    'Member';

  return {
    conversationId,
    connectionId,
    status: row.status === 'ended' ? 'ended' : 'active',
    createdAt: asString(row.created_at) ?? new Date(0).toISOString(),
    lastMessageAt: asString(row.last_message_at),
    peerUserId,
    peerFirstName,
    peerAge: typeof row.peer_age === 'number' ? row.peer_age : null,
    peerPhotoUrl: asString(row.peer_photo_url),
    latestMessageBody: asString(row.latest_message_body),
    latestMessageAt: asString(row.latest_message_at),
    latestMessageSenderId: asString(row.latest_message_sender_id),
    unread: Boolean(row.unread),
  };
}

function mapMessage(raw: unknown): ConversationMessage | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asString(row.id);
  const conversationId = asString(row.conversation_id);
  const senderId = asString(row.sender_id);
  const body = asString(row.body);
  const createdAt = asString(row.created_at);
  if (!id || !conversationId || !senderId || !body || !createdAt) return null;
  return {
    id,
    conversationId,
    senderId,
    body,
    clientMessageId: asString(row.client_message_id),
    createdAt,
    localStatus: 'sent',
  };
}

export async function ensureConversationForConnection(
  connectionId: string
): Promise<DataAccessResult<{ conversationId: string; created: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('ensure_conversation_for_connection', {
    p_connection_id: connectionId,
  });
  const result = rpcResult(data, error, 'Could not open this conversation.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const conversationId = asString(result.data.conversation_id);
  if (!conversationId) {
    return { success: false, message: 'Could not open this conversation.' };
  }
  return {
    success: true,
    data: {
      conversationId,
      created: Boolean(result.data.created),
    },
  };
}

export async function listMyConversations(): Promise<
  DataAccessResult<ConversationListItem[]>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('list_my_conversations');
  const result = rpcResult(data, error, 'Could not load conversations.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const rows = Array.isArray(result.data.conversations) ? result.data.conversations : [];
  const items = rows
    .map(mapListItem)
    .filter((item): item is ConversationListItem => Boolean(item))
    .sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.createdAt;
      const bTime = b.lastMessageAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    });

  return { success: true, data: items };
}

export async function getConversationThreadMeta(
  conversationId: string
): Promise<DataAccessResult<ConversationThreadMeta>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('get_conversation_thread_meta', {
    p_conversation_id: conversationId,
  });
  const result = rpcResult(data, error, 'Could not load this conversation.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const row = asRecord(result.data.conversation);
  if (!row) return { success: false, message: 'Conversation not found.' };

  const peerUserId = asString(row.peer_user_id);
  const id = asString(row.conversation_id);
  const connectionId = asString(row.connection_id);
  if (!id || !connectionId || !peerUserId) {
    return { success: false, message: 'Conversation not found.' };
  }

  return {
    success: true,
    data: {
      conversationId: id,
      connectionId,
      status: row.status === 'ended' ? 'ended' : 'active',
      createdAt: asString(row.created_at) ?? new Date(0).toISOString(),
      lastMessageAt: asString(row.last_message_at),
      peerUserId,
      peerFirstName:
        asString(row.peer_first_name) ??
        firstNameFromFullName(asString(row.peer_full_name)) ??
        'Member',
      peerFullName: asString(row.peer_full_name),
      peerAge: typeof row.peer_age === 'number' ? row.peer_age : null,
      peerPhotoUrl: asString(row.peer_photo_url),
      isBlocked: Boolean(row.is_blocked),
    },
  };
}

export async function listConversationMessages(
  conversationId: string,
  options?: { before?: string; beforeId?: string; limit?: number }
): Promise<DataAccessResult<{ messages: ConversationMessage[]; hasMore: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const limit = options?.limit ?? MESSAGE_PAGE_SIZE;
  const { data, error } = await supabase.rpc('list_conversation_messages', {
    p_conversation_id: conversationId,
    p_before: options?.before,
    p_before_id: options?.beforeId,
    p_limit: limit,
  });
  const result = rpcResult(data, error, 'Could not load messages.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const rows = Array.isArray(result.data.messages) ? result.data.messages : [];
  const messages = rows
    .map(mapMessage)
    .filter((item): item is ConversationMessage => Boolean(item));

  return {
    success: true,
    data: {
      messages,
      hasMore: rows.length >= limit,
    },
  };
}

export async function sendConversationMessage(input: {
  conversationId: string;
  body: string;
  clientMessageId?: string;
}): Promise<DataAccessResult<ConversationMessage>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const body = input.body.trim();
  if (!body) return { success: false, message: 'Message cannot be empty.' };
  if (body.length > MESSAGE_MAX_LENGTH) {
    return { success: false, message: `Messages can be up to ${MESSAGE_MAX_LENGTH} characters.` };
  }

  const { data, error } = await supabase.rpc('send_conversation_message', {
    p_conversation_id: input.conversationId,
    p_body: body,
    p_client_message_id: input.clientMessageId,
  });
  const result = rpcResult(data, error, 'Could not send your message.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };

  const messageId = asString(result.data.message_id);
  const createdAt = asString(result.data.created_at);
  if (!messageId || !createdAt) {
    return { success: false, message: 'Could not send your message.' };
  }

  return {
    success: true,
    data: {
      id: messageId,
      conversationId: input.conversationId,
      senderId: user.id,
      body: asString(result.data.body) ?? body,
      clientMessageId: input.clientMessageId ?? null,
      createdAt,
      localStatus: 'sent',
    },
  };
}

export async function markConversationRead(
  conversationId: string
): Promise<DataAccessResult<{ readAt: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  const result = rpcResult(data, error, 'Could not update read state.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };
  return {
    success: true,
    data: { readAt: asString(result.data.read_at) ?? new Date().toISOString() },
  };
}

export async function endConnection(
  connectionId: string
): Promise<DataAccessResult<{ ended: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('end_connection', {
    p_connection_id: connectionId,
  });
  const result = rpcResult(data, error, 'Could not end this connection.');
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: { ended: true } };
}

export async function blockUser(
  blockedUserId: string
): Promise<DataAccessResult<{ blocked: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('block_user', {
    p_blocked_user_id: blockedUserId,
  });
  const result = rpcResult(data, error, 'Could not block this person.');
  if (!result.success) return { success: false, message: result.message };
  return { success: true, data: { blocked: true } };
}

export async function reportUser(
  payload: ReportPayload
): Promise<DataAccessResult<{ reportId: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('report_user', {
    p_reported_user_id: payload.reportedUserId,
    p_reason: payload.reason,
    p_details: payload.details,
    p_conversation_id: payload.conversationId,
  });
  const result = rpcResult(data, error, 'Could not submit your report.');
  if (!result.success) return { success: false, message: result.message };
  if (!result.data) return { success: false, message: 'Unexpected empty response.' };
  const reportId = asString(result.data.report_id);
  if (!reportId) return { success: false, message: 'Could not submit your report.' };
  return { success: true, data: { reportId } };
}
