import 'server-only';

import { Resend } from 'resend';

import { getReportReasonLabel } from '@/lib/conversations/constants';
import type { ReportPayload } from '@/lib/conversations/types';
import { createServiceClient } from '@/lib/supabase/admin';

const REVIEW_ADDRESS = 'admin@forgedinlife.com';
const FROM_ADDRESS = 'Forge Safety <hello@forgedinlife.com>';

function escapeHtml(value: string) {
  return value.replace(
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
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown notification error';
  return message.slice(0, 500);
}

async function updateDeliveryRecord(
  reportId: string,
  values: {
    status: 'accepted' | 'failed' | 'not_configured';
    provider_message_id?: string | null;
    last_error?: string | null;
  }
) {
  const admin = createServiceClient();
  if (!admin) return;

  const now = new Date().toISOString();
  const { error } = await admin
    .from('safety_report_notifications')
    .update({
      status: values.status,
      provider_message_id: values.provider_message_id ?? null,
      last_error: values.last_error ?? null,
      attempt_count: 1,
      attempted_at: now,
      accepted_at: values.status === 'accepted' ? now : null,
      failed_at: values.status === 'failed' ? now : null,
      updated_at: now,
    })
    .eq('report_id', reportId);

  if (error) {
    console.error('Safety report notification status could not be recorded.', {
      reportId,
      error: error.message,
    });
  }
}

export async function sendSafetyReportNotification({
  reportId,
  payload,
}: {
  reportId: string;
  payload: ReportPayload;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const admin = createServiceClient();

  if (!resendKey || !admin) {
    console.error('Safety report saved but review notification is not configured.', {
      reportId,
      resendConfigured: Boolean(resendKey),
      evidenceAccessConfigured: Boolean(admin),
    });
    await updateDeliveryRecord(reportId, {
      status: 'not_configured',
      last_error: 'Review notification configuration is incomplete.',
    });
    return;
  }

  try {
    const attachments = [];
    for (const evidence of payload.evidence ?? []) {
      const { data, error } = await admin.storage
        .from('report-evidence')
        .download(evidence.storage_path);
      if (error || !data) {
        throw new Error('Private report evidence could not be loaded for review.');
      }
      attachments.push({
        filename: evidence.file_name,
        content: Buffer.from(await data.arrayBuffer()),
        contentType: evidence.mime_type,
      });
    }

    const reasonLabel = getReportReasonLabel(payload.reason);
    const details = payload.details?.trim();
    const submittedAt = new Date().toISOString();
    const resend = new Resend(resendKey);
    const notification = await resend.emails.send(
      {
        from: FROM_ADDRESS,
        to: REVIEW_ADDRESS,
        subject: `Forge safety report: ${reasonLabel}`,
        attachments,
        html: `
          <h2>New Forge safety report</h2>
          <p><strong>Report ID:</strong> ${escapeHtml(reportId)}</p>
          <p><strong>Reason:</strong> ${escapeHtml(reasonLabel)}</p>
          <p><strong>Reported member ID:</strong> ${escapeHtml(payload.reportedUserId)}</p>
          <p><strong>Conversation ID:</strong> ${escapeHtml(payload.conversationId ?? 'Not provided')}</p>
          <p><strong>Details:</strong> ${escapeHtml(details || 'No additional details provided.')}</p>
          <p><strong>Private screenshots:</strong> ${attachments.length}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
          <hr />
          <p>This message is an operational alert. The protected Forge report record remains authoritative.</p>
        `,
      },
      {
        headers: {
          'Idempotency-Key': `forge-safety-report-${reportId}`,
        },
      }
    );

    if (notification.error || !notification.data?.id) {
      throw new Error(notification.error?.message ?? 'The email provider did not accept the alert.');
    }

    await updateDeliveryRecord(reportId, {
      status: 'accepted',
      provider_message_id: notification.data.id,
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    console.error('Safety report saved but review notification failed.', {
      reportId,
      error: message,
    });
    await updateDeliveryRecord(reportId, {
      status: 'failed',
      last_error: message,
    });
  }
}
