'use server';

import { revalidatePath } from 'next/cache';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { sendOperatorEnforcementNotification } from '@/lib/safety/operator-enforcement-notification';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ACTIONS = [
  'begin_review',
  'escalate',
  'warn',
  'restrict',
  'suspend',
  'remove',
  'safety_block',
  'resolve',
  'dismiss',
] as const;

const ENFORCEMENT_ACTIONS = new Set<string>([
  'warn',
  'restrict',
  'suspend',
  'remove',
  'safety_block',
]);

export type OperatorReportActionState = {
  success: boolean;
  message: string;
};

export async function reviewSafetyReportAction(
  _previousState: OperatorReportActionState,
  formData: FormData
): Promise<OperatorReportActionState> {
  const reportId = String(formData.get('report_id') ?? '').trim();
  const action = String(formData.get('action') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const notifyMember = formData.get('notify_member') === 'on' && ENFORCEMENT_ACTIONS.has(action);

  if (!reportId || !ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return { success: false, message: 'Choose a valid case action.' };
  }
  if (reason.length < 3 || reason.length > 2000) {
    return { success: false, message: 'Enter a reason between 3 and 2,000 characters.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Your session has expired. Sign in again.' };
  }
  if (!isForgeOperatorUser(user)) {
    return { success: false, message: 'You are not authorized to review reports.' };
  }

  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') {
    return {
      success: false,
      message:
        mfa.status === 'unavailable'
          ? mfa.message
          : 'Verify your authenticator code before reviewing reports.',
    };
  }

  const admin = createServiceClient();
  if (!admin) {
    return { success: false, message: 'The operator review service is not configured.' };
  }

  const { error } = await admin.rpc('review_safety_report', {
    p_report_id: reportId,
    p_operator_id: user.id,
    p_action: action,
    p_reason: reason,
    p_notify_member: notifyMember,
  });

  if (error) {
    console.error('Operator report decision could not be saved.', {
      reportId,
      operatorId: user.id,
      action,
      code: error.code,
      message: error.message,
    });
    return { success: false, message: 'The report decision could not be saved.' };
  }

  let notificationMessage = '';
  if (notifyMember) {
    const { data: report, error: reportError } = await admin
      .from('user_reports')
      .select('reported_user_id')
      .eq('id', reportId)
      .single();

    const notification =
      reportError || !report
        ? { success: false as const, outcome: 'The report target could not be loaded.' }
        : await sendOperatorEnforcementNotification({
            reportId,
            targetUserId: report.reported_user_id,
            action,
            reason,
          });

    const { error: auditError } = await admin.rpc('record_safety_member_notification', {
      p_report_id: reportId,
      p_operator_id: user.id,
      p_success: notification.success,
      p_outcome: notification.outcome,
    });
    if (auditError) {
      console.error('Member notification outcome could not be audited.', {
        reportId,
        operatorId: user.id,
        message: auditError.message,
      });
    }
    notificationMessage = notification.success
      ? ' Member notification accepted for delivery.'
      : ' The case action was saved, but member notification failed.';
  }

  revalidatePath('/internal/report-review');
  revalidatePath('/discovery');
  revalidatePath('/connections');

  return { success: true, message: `Case action saved.${notificationMessage}` };
}
