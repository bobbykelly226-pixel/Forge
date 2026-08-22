import 'server-only';

import { Resend } from 'resend';

import { createServiceClient } from '@/lib/supabase/admin';

const FROM_ADDRESS = 'Forge Safety <hello@forgedinlife.com>';
const CANONICAL_APP_ORIGIN = 'https://forge.forgedinlife.com';

const ACTION_LABELS: Record<string, string> = {
  warn: 'safety warning',
  restrict: 'profile restriction',
  suspend: 'account suspension',
  remove: 'account removal',
  safety_block: 'safety restriction',
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character
  );
}

export type OperatorEnforcementNotificationResult =
  | { success: true; outcome: string }
  | { success: false; outcome: string };

export async function sendOperatorEnforcementNotification({
  reportId,
  targetUserId,
  action,
  reason,
}: {
  reportId: string;
  targetUserId: string;
  action: string;
  reason: string;
}): Promise<OperatorEnforcementNotificationResult> {
  const admin = createServiceClient();
  const resendKey = process.env.RESEND_API_KEY;
  if (!admin || !resendKey) {
    return { success: false, outcome: 'Member notification configuration is incomplete.' };
  }

  const { data, error } = await admin.auth.admin.getUserById(targetUserId);
  const recipient = data.user?.email;
  if (error || !recipient) {
    return { success: false, outcome: 'The member email address could not be loaded.' };
  }

  const actionLabel = ACTION_LABELS[action] ?? 'safety action';
  const appealUrl = new URL('/safety/appeal', CANONICAL_APP_ORIGIN);
  appealUrl.searchParams.set('report', reportId);

  const resend = new Resend(resendKey);
  const notification = await resend.emails.send(
    {
      from: FROM_ADDRESS,
      to: recipient,
      subject: `Forge ${actionLabel}`,
      html: `
        <h2>Forge safety review update</h2>
        <p>Forge completed a safety review connected to your account.</p>
        <p><strong>Action:</strong> ${escapeHtml(actionLabel)}</p>
        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
        <p>If you believe this decision should be reconsidered, you may submit an appeal:</p>
        <p><a href="${escapeHtml(appealUrl.toString())}">Open the Forge appeal form</a></p>
        <p>Report reference: ${escapeHtml(reportId)}</p>
      `,
    },
    { headers: { 'Idempotency-Key': `forge-operator-action-${reportId}-${action}` } }
  );

  if (notification.error || !notification.data?.id) {
    return {
      success: false,
      outcome: notification.error?.message?.slice(0, 500) ?? 'The email provider rejected the message.',
    };
  }

  return { success: true, outcome: `Resend accepted message ${notification.data.id}.` };
}
