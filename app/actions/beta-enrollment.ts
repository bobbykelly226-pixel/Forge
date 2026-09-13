'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';

import { hashBetaAccessSecret } from '@/lib/auth/beta-access';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type BetaEnrollmentActionState = {
  success: boolean;
  message: string;
  invitationPath?: string;
};

async function authorizeOperator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isForgeOperatorUser(user)) return null;
  const mfa = await getOperatorMfaState(supabase);
  return mfa.status === 'verified' ? user : null;
}

export async function createBetaSignupLinkAction(
  _previous: BetaEnrollmentActionState,
  formData: FormData
): Promise<BetaEnrollmentActionState> {
  const operator = await authorizeOperator();
  if (!operator) return { success: false, message: 'Verified administrator access is required.' };

  const label = String(formData.get('label') ?? '').trim();
  const type = String(formData.get('link_type') ?? 'single');
  if (type !== 'single' && type !== 'limited') return { success: false, message: 'Choose a valid link type.' };
  const uses = type === 'single' ? 1 : Number(formData.get('max_uses'));
  const expiresInDays = Number(formData.get('expires_in_days'));
  if (label.length < 1 || label.length > 120) return { success: false, message: 'Enter a link name between 1 and 120 characters.' };
  if (!Number.isInteger(uses) || uses < 1 || uses > 100) return { success: false, message: 'Choose between 1 and 100 uses.' };
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 90) return { success: false, message: 'Choose an expiration between 1 and 90 days.' };

  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Founding Beta administration is not configured.' };
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
  const { error } = await admin.from('beta_signup_links').insert({
    label,
    token_hash: hashBetaAccessSecret(token),
    max_uses: uses,
    expires_at: expiresAt,
    created_by: operator.id,
  });
  if (error) {
    console.error('Founding Beta link creation failed.');
    return { success: false, message: 'The invitation link could not be created.' };
  }
  revalidatePath('/internal/beta-enrollment');
  return {
    success: true,
    message: 'Invitation link created. Copy it now; Forge does not store the raw link.',
    invitationPath: `/signup?invite=${token}`,
  };
}

export async function createDirectBetaInvitationAction(
  _previous: BetaEnrollmentActionState,
  formData: FormData
): Promise<BetaEnrollmentActionState> {
  const operator = await authorizeOperator();
  if (!operator) return { success: false, message: 'Verified administrator access is required.' };
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const note = String(formData.get('note') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'Enter a valid email address.' };
  if (note.length > 500) return { success: false, message: 'Keep the note under 500 characters.' };
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Founding Beta administration is not configured.' };
  const { error } = await admin.from('beta_signup_invitations').insert({
    email,
    invited_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    accepted_at: null,
    accepted_user_id: null,
    revoked_at: null,
    note: note || 'Direct operator invitation',
    source_link_id: null,
  });
  if (error) {
    console.error('Direct Founding Beta invitation creation failed.');
    return { success: false, message: 'The invitation could not be saved. An existing invitation or account may already use that email; its history has not been changed.' };
  }
  revalidatePath('/internal/beta-enrollment');
  return { success: true, message: `Direct signup access is active for ${email} for 14 days.` };
}

export async function updateBetaEnrollmentAction(
  _previous: BetaEnrollmentActionState,
  formData: FormData
): Promise<BetaEnrollmentActionState> {
  const operator = await authorizeOperator();
  if (!operator) return { success: false, message: 'Verified administrator access is required.' };
  const intent = String(formData.get('intent') ?? '');
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Founding Beta administration is not configured.' };

  if (intent === 'toggle') {
    const enrollmentOpen = formData.get('enrollment_open') === 'true';
    const { error } = await admin.from('beta_enrollment_settings').update({
      enrollment_open: enrollmentOpen,
      updated_at: new Date().toISOString(),
      updated_by: operator.id,
    }).eq('singleton', true);
    if (error) return { success: false, message: 'Enrollment availability could not be changed.' };
    revalidatePath('/internal/beta-enrollment');
    return { success: true, message: enrollmentOpen ? 'Founding Beta enrollment is open.' : 'Founding Beta enrollment is paused.' };
  }

  if (intent === 'limit') {
    const memberLimit = Number(formData.get('member_limit'));
    if (!Number.isInteger(memberLimit) || memberLimit < 1 || memberLimit > 500) {
      return { success: false, message: 'The limit must be at least the accepted count and no more than 500.' };
    }
    const { data, error } = await admin.rpc('set_beta_member_limit', {
      p_limit: memberLimit, p_operator: operator.id,
    });
    if (error || data !== true) return { success: false, message: 'The limit cannot be lower than the occupied places. Refresh and try again.' };
    revalidatePath('/internal/beta-enrollment');
    return { success: true, message: `Founding Beta capacity is now ${memberLimit}.` };
  }

  if (intent === 'revoke_link') {
    const linkId = String(formData.get('link_id') ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(linkId)) return { success: false, message: 'Choose a valid invitation link.' };
    const { error } = await admin.from('beta_signup_links').update({ revoked_at: new Date().toISOString() }).eq('id', linkId).is('revoked_at', null);
    if (error) return { success: false, message: 'The invitation link could not be revoked.' };
    revalidatePath('/internal/beta-enrollment');
    return { success: true, message: 'Invitation link revoked.' };
  }

  return { success: false, message: 'Choose a valid Founding Beta action.' };
}
