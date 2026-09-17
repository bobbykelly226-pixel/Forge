'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type FoundingBetaReviewState = { success: boolean; message: string };

type ApprovedRequest = { request_id: string; invitation_id: string; email: string; first_name: string };

async function authorizeOperator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session has expired. Sign in again.' } as const;
  if (!isForgeOperatorUser(user)) return { error: 'You are not authorized to review beta requests.' } as const;
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') return { error: 'Verify your authenticator before reviewing requests.' } as const;
  return { user } as const;
}

async function sendInvitationEmail(input: { email: string; firstName: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { success: false, error: 'Email delivery is not configured.' } as const;

  const signupUrl = new URL('/signup', 'https://forge.forgedinlife.com');
  signupUrl.searchParams.set('email', input.email);
  const result = await new Resend(key).emails.send({
    from: 'Forge <hello@forgedinlife.com>',
    to: input.email,
    subject: 'Your Forge Founding Beta invitation',
    html: `
      <h2>Welcome to the Forge Founding Beta, ${input.firstName.replace(/[<>&"']/g, '')}.</h2>
      <p>Your request has been selected. Your personal invitation is active for seven days and may be used once.</p>
      <p><a href="${signupUrl.toString()}">Create your invited Forge account</a></p>
      <p>Use <strong>${input.email}</strong> when creating your account. The invitation is tied to that address.</p>
      <p>Thank you for helping us build a more intentional dating experience.</p>
      <p>Strong Values. Strong Connections.<br>The Forge Team</p>
    `,
  });
  if (result.error) return { success: false, error: result.error.message } as const;
  return { success: true } as const;
}

export async function reviewFoundingBetaRequestAction(
  _previousState: FoundingBetaReviewState,
  formData: FormData
): Promise<FoundingBetaReviewState> {
  const requestId = String(formData.get('request_id') ?? '').trim();
  const action = String(formData.get('action') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (!requestId || !['approve', 'decline', 'resend'].includes(action)) {
    return { success: false, message: 'Choose a valid request action.' };
  }
  if (reason.length < 3 || reason.length > 1000) {
    return { success: false, message: 'Enter a review note between 3 and 1,000 characters.' };
  }

  const authorization = await authorizeOperator();
  if ('error' in authorization) {
    return {
      success: false,
      message: authorization.error ?? 'You are not authorized to review beta requests.',
    };
  }
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'The Founding Beta review service is not configured.' };

  if (action === 'decline') {
    const { data, error } = await admin.rpc('decline_founding_beta_request', {
      p_request_id: requestId,
      p_operator_id: authorization.user.id,
      p_reason: reason,
    });
    if (error || !data) {
      return { success: false, message: 'This request could not be declined. It may already be reviewed.' };
    }
    revalidatePath('/internal/founding-beta');
    return { success: true, message: 'Request declined and the decision was recorded.' };
  }

  let invitee: { email: string; firstName: string } | null = null;
  if (action === 'approve') {
    const { data, error } = await admin.rpc('approve_founding_beta_request', {
      p_request_id: requestId,
      p_operator_id: authorization.user.id,
      p_reason: reason,
    });
    if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
      console.error('Founding Beta approval failed.', { message: error?.message });
      return { success: false, message: 'This request could not be approved.' };
    }
    const approved = data as unknown as ApprovedRequest;
    invitee = { email: approved.email, firstName: approved.first_name };
  } else {
    const { data, error } = await admin
      .from('founding_beta_requests')
      .select('email, first_name, status')
      .eq('id', requestId)
      .maybeSingle();
    if (error || !data || !['approved', 'invited'].includes(data.status)) {
      return { success: false, message: 'Only approved requests can receive another invitation email.' };
    }
    invitee = { email: data.email, firstName: data.first_name };
  }

  const delivery = await sendInvitationEmail(invitee);
  await admin.rpc('record_founding_beta_invitation_delivery', {
    p_request_id: requestId,
    p_operator_id: authorization.user.id,
    p_success: delivery.success,
    p_error: delivery.success ? null : delivery.error,
    p_is_resend: action === 'resend',
  });

  revalidatePath('/internal/founding-beta');
  if (!delivery.success) {
    return {
      success: false,
      message: 'The request was approved, but the invitation email failed. Use Send invitation again after checking email delivery.',
    };
  }
  return {
    success: true,
    message: action === 'resend' ? 'Invitation email sent again.' : 'Request approved and the seven-day invitation was emailed.',
  };
}
