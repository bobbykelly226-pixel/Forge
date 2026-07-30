'use server';

import { Resend } from 'resend';

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
import type { ConversationAttachmentInput, ReportPayload } from '@/lib/conversations/types';

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

export async function reportUserAction(payload: ReportPayload) {
  const result = await reportUser(payload);
  if (!result.success || !result.data?.reportId) return result;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('Safety report saved but review notification is not configured.', {
      reportId: result.data.reportId,
    });
    return result;
  }

  const escapeHtml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] ?? character
    );

  try {
    const resend = new Resend(resendKey);
    const details = payload.details?.trim();
    const notification = await resend.emails.send({
      from: 'Forge Safety <hello@forgedinlife.com>',
      to: 'admin@forgedinlife.com',
      subject: `Forge safety report: ${payload.reason}`,
      html: `
        <h2>New Forge safety report</h2>
        <p><strong>Report ID:</strong> ${escapeHtml(result.data.reportId)}</p>
        <p><strong>Reason:</strong> ${escapeHtml(payload.reason)}</p>
        <p><strong>Reported member ID:</strong> ${escapeHtml(payload.reportedUserId)}</p>
        <p><strong>Conversation ID:</strong> ${escapeHtml(payload.conversationId ?? 'Not provided')}</p>
        <p><strong>Details:</strong> ${escapeHtml(details || 'No additional details provided.')}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(new Date().toISOString())}</p>
      `,
    });

    if (notification.error) {
      console.error('Safety report saved but review notification failed.', {
        reportId: result.data.reportId,
        error: notification.error.message,
      });
    }
  } catch (error) {
    console.error('Safety report saved but review notification failed.', {
      reportId: result.data.reportId,
      error: error instanceof Error ? error.message : 'Unknown notification error',
    });
  }

  return result;
}
