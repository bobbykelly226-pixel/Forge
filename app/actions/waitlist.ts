'use server';

import { createServiceClient } from '@/lib/supabase/admin';

export type WaitlistActionState = { success: boolean; message: string };

const SAVED = 'You are on the Founding Beta waitlist. Forge may contact you when a place becomes available.';

export async function joinWaitlist(
  _previous: WaitlistActionState,
  formData: FormData
): Promise<WaitlistActionState> {
  // No outbound email or account creation from this public form. The database
  // bounds submission volume across instances and makes duplicates idempotent.
  if (String(formData.get('website') ?? '').trim()) return { success: true, message: SAVED };
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (name.length < 1 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Enter your name and a valid email address.' };
  }
  if (formData.get('contact_permission') !== 'on') {
    return { success: false, message: 'Please confirm that Forge may contact you about a beta place.' };
  }
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'The waitlist is temporarily unavailable. Please try again later.' };
  try {
    const { data, error } = await admin.rpc('join_beta_waitlist', { p_email: email, p_name: name });
    if (error || data !== true) {
      return { success: false, message: 'We cannot save your request right now. Please try again later.' };
    }
    return { success: true, message: SAVED };
  } catch {
    return { success: false, message: 'We cannot save your request right now. Please try again later.' };
  }
}
