import 'server-only';

import { Resend } from 'resend';

import {
  getBetaFeedbackAreaLabel,
  getBetaFeedbackCategory,
  type BetaFeedbackArea,
  type BetaFeedbackCategory,
} from '@/lib/feedback/constants';
import { createServiceClient } from '@/lib/supabase/admin';

const REVIEW_ADDRESS = 'admin@forgedinlife.com';
const FROM_ADDRESS = 'Forge Beta <hello@forgedinlife.com>';

type BetaFeedbackNotificationInput = {
  submissionId: string;
  submitterId: string;
  submitterEmail: string | null;
  submitterName: string | null;
  category: BetaFeedbackCategory;
  area: BetaFeedbackArea;
  message: string;
  contactRequested: boolean;
};

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown notification error';
  return message.slice(0, 500);
}

async function updateNotificationStatus(
  submissionId: string,
  values: {
    status: 'accepted' | 'failed' | 'not_configured';
    providerMessageId?: string | null;
    error?: string | null;
  }
) {
  const admin = createServiceClient();
  if (!admin) return;

  const now = new Date().toISOString();
  const { error } = await admin
    .from('beta_feedback_submissions')
    .update({
      notification_status: values.status,
      provider_message_id: values.providerMessageId ?? null,
      notification_attempted_at: now,
      notification_error: values.error ?? null,
      updated_at: now,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Beta feedback notification status could not be recorded.', {
      submissionId,
      error: error.message,
    });
  }
}

export async function sendBetaFeedbackNotification(
  input: BetaFeedbackNotificationInput
) {
  const resendKey = process.env.RESEND_API_KEY;
  const admin = createServiceClient();

  if (!resendKey || !admin) {
    console.error('Beta feedback saved but admin notification is not configured.', {
      submissionId: input.submissionId,
      resendConfigured: Boolean(resendKey),
      serverAccessConfigured: Boolean(admin),
    });
    await updateNotificationStatus(input.submissionId, {
      status: 'not_configured',
      error: 'Admin notification configuration is incomplete.',
    });
    return;
  }

  const category = getBetaFeedbackCategory(input.category);
  const areaLabel = getBetaFeedbackAreaLabel(input.area);
  const reference = input.submissionId.slice(0, 8).toUpperCase();
  const submitter = input.submitterName?.trim() || 'Forge beta member';
  const replyAddress = input.submitterEmail?.trim() || null;

  try {
    const notification = await new Resend(resendKey).emails.send(
      {
        from: FROM_ADDRESS,
        to: REVIEW_ADDRESS,
        replyTo: input.contactRequested && replyAddress ? replyAddress : undefined,
        subject: `[Forge Beta ${reference}] ${category.label}`,
        text: [
          'New Forge beta feedback',
          '',
          `Reference: ${reference}`,
          `Submission ID: ${input.submissionId}`,
          `Category: ${category.label}`,
          `Product area: ${areaLabel}`,
          `Beta member: ${submitter}`,
          `Account email: ${replyAddress ?? 'Unavailable'}`,
          `Direct response requested: ${input.contactRequested ? 'Yes' : 'No'}`,
          `Submitter ID: ${input.submitterId}`,
          '',
          'Feedback:',
          input.message,
          '',
          `Submitted: ${new Date().toISOString()}`,
          '',
          'Triage in Forge HQ → Master Tasks. This is product feedback, not a member safety report.',
        ].join('\n'),
      },
      {
        headers: {
          'Idempotency-Key': `forge-beta-feedback-${input.submissionId}`,
        },
      }
    );

    if (notification.error || !notification.data?.id) {
      throw new Error(notification.error?.message ?? 'The email provider did not accept the alert.');
    }

    await updateNotificationStatus(input.submissionId, {
      status: 'accepted',
      providerMessageId: notification.data.id,
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    console.error('Beta feedback saved but admin notification failed.', {
      submissionId: input.submissionId,
      error: message,
    });
    await updateNotificationStatus(input.submissionId, {
      status: 'failed',
      error: message,
    });
  }
}
