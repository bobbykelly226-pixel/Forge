'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type GovernanceActionState = { success: boolean; message: string };

export async function updateAccountGovernanceAction(
  _previous: GovernanceActionState,
  formData: FormData
): Promise<GovernanceActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isForgeOperatorUser(user)) return { success: false, message: 'Administrator authorization is required.' };
  const mfa = await getOperatorMfaState(supabase);
  if (mfa.status !== 'verified') return { success: false, message: 'Authenticator verification is required.' };

  const memberId = String(formData.get('member_id') ?? '');
  const legalHoldActive = formData.get('legal_hold_active') === 'on';
  const reason = String(formData.get('reason') ?? '').trim();
  const retentionClass = String(formData.get('retention_class') ?? 'standard');
  const retainUntilRaw = String(formData.get('retain_until') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return { success: false, message: 'Choose a valid member.' };
  if (reason.length < 3 || reason.length > 2000) return { success: false, message: 'Enter an audit reason between 3 and 2,000 characters.' };
  if (!['standard', 'safety_extended', 'legal_required'].includes(retentionClass)) return { success: false, message: 'Choose a valid retention class.' };

  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Account governance service is not configured.' };
  const db = admin as unknown as SupabaseClient;
  const { data, error } = await db.rpc('set_account_governance', {
    p_user_id: memberId,
    p_operator_id: user.id,
    p_legal_hold_active: legalHoldActive,
    p_reason: reason,
    p_retention_class: retentionClass,
    p_retain_until: retainUntilRaw ? new Date(`${retainUntilRaw}T23:59:59.999Z`).toISOString() : null,
  });
  if (error || !(data as { ok?: boolean } | null)?.ok) {
    console.error('Account governance update failed.', error);
    return { success: false, message: 'The account governance change could not be saved.' };
  }
  revalidatePath('/internal/account-governance');
  return { success: true, message: 'Retention and legal-hold controls were saved and audited.' };
}
