'use server';

import {
  blockUser,
  endConnection,
  ensureConversationForConnection,
  getConversationThreadMeta,
  listConversationMessages,
  listMyConversations,
  markConversationRead,
  reportUser,
  sendConversationMessage,
} from '@/lib/data/conversations';
import type { ReportPayload } from '@/lib/conversations/types';

export async function ensureConversationAction(connectionId: string) {
  return ensureConversationForConnection(connectionId);
}

export async function listMyConversationsAction() {
  return listMyConversations();
}

export async function getConversationThreadMetaAction(conversationId: string) {
  return getConversationThreadMeta(conversationId);
}

export async function listConversationMessagesAction(
  conversationId: string,
  options?: { before?: string; beforeId?: string; limit?: number }
) {
  return listConversationMessages(conversationId, options);
}

export async function sendConversationMessageAction(input: {
  conversationId: string;
  body: string;
  clientMessageId?: string;
}) {
  return sendConversationMessage(input);
}

export async function markConversationReadAction(conversationId: string) {
  return markConversationRead(conversationId);
}

export async function endConnectionAction(connectionId: string) {
  return endConnection(connectionId);
}

export async function blockUserAction(blockedUserId: string) {
  return blockUser(blockedUserId);
}

export async function reportUserAction(payload: ReportPayload) {
  return reportUser(payload);
}
