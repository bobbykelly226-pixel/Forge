'use server';

import { revalidatePath } from 'next/cache';

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
  unblockUser,
} from '@/lib/data/conversations';
import type { ConversationAttachmentInput, ReportPayload } from '@/lib/conversations/types';
import { sendSafetyReportNotification } from '@/lib/safety/report-notification';

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
  attachment?: ConversationAttachmentInput;
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

export async function unblockUserAction(blockedUserId: string) {
  const result = await unblockUser(blockedUserId);
  if (result.success) {
    revalidatePath('/connections');
    revalidatePath('/connections/c/[conversationId]', 'page');
  }
  return result;
}

export async function reportUserAction(payload: ReportPayload) {
  const result = await reportUser(payload);
  if (!result.success || !result.data?.reportId) return result;

  if (!result.data.duplicate) {
    await sendSafetyReportNotification({
      reportId: result.data.reportId,
      payload,
    });
  }

  return result;
}
