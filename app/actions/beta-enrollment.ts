'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isForgeOperatorUser } from '@/lib/operator/access';
import { getOperatorMfaState } from '@/lib/operator/mfa';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

export type BetaEnrollmentState = { success: boolean; message: string };

export async function joinBetaWaitlist(_previous: BetaEnrollmentState, form: FormData): Promise<BetaEnrollmentState> {
  const success = { success: true, message: 'You’re on the waitlist. We’ll contact you when more beta places open.' };
  if (String(form.get('website') ?? '').trim()) return success;
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'Enter a valid email address.' };
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'The waitlist is temporarily unavailable. Please try again.' };
  const requestHeaders = await headers();
  const address = requestHeaders.get('x-vercel-forwarded-for') ?? requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const clientKey = createHash('sha256').update(address.trim()).digest('hex');
  const { data, error } = await admin.rpc('join_beta_waitlist', { p_email: email, p_client_key: clientKey });
  if (error) return { success: false, message: 'The waitlist could not be updated. Please try again.' };
  if (!data) return { success: false, message: 'Too many requests. Please try again in an hour.' };
  revalidatePath('/internal/founding-beta');
  return success;
}

export async function updateBetaLimit(_previous: BetaEnrollmentState, form: FormData): Promise<BetaEnrollmentState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isForgeOperatorUser(user)) return { success: false, message: 'Administrator access is required.' };
  if ((await getOperatorMfaState(supabase)).status !== 'verified') return { success: false, message: 'Verify your authenticator first.' };
  const limit = Number(form.get('account_limit'));
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) return { success: false, message: 'Enter a whole number from 1 to 10,000.' };
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Enrollment settings are unavailable.' };
  const { error } = await admin.rpc('set_beta_account_limit', { p_limit: limit });
  if (error) return { success: false, message: 'The beta limit could not be saved.' };
  revalidatePath('/internal/founding-beta');
  revalidatePath('/signup');
  revalidatePath('/founding-beta');
  return { success: true, message: 'Beta account limit updated.' };
}
