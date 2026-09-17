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
import { preserveReportedVideoEvidence } from '@/lib/safety/reported-video-evidence';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

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

  const messageReference = payload.details?.startsWith('Reported video message: ');
  if (messageReference) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createServiceClient();
    if (user && admin) {
      await preserveReportedVideoEvidence(admin, result.data.reportId, user.id);
    }
  }

  if (!result.data.duplicate) {
    await sendSafetyReportNotification({
      reportId: result.data.reportId,
      payload,
    });
  }

  return result;
}
