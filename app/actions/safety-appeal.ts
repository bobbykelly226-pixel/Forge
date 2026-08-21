'use server';

import { createClient } from '@/lib/supabase/server';

export type SafetyAppealActionState = { success: boolean; message: string };

export async function submitSafetyAppealAction(
  _previousState: SafetyAppealActionState,
  formData: FormData
): Promise<SafetyAppealActionState> {
  const reportId = String(formData.get('report_id') ?? '').trim();
  const details = String(formData.get('details') ?? '').trim();
  if (!reportId) return { success: false, message: 'The report reference is missing.' };
  if (details.length < 10 || details.length > 2000) {
    return { success: false, message: 'Enter appeal details between 10 and 2,000 characters.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Sign in before submitting an appeal.' };

  const { error } = await supabase.rpc('submit_safety_report_appeal', {
    p_report_id: reportId,
    p_details: details,
  });
  if (error) {
    console.error('Safety appeal could not be saved.', { reportId, code: error.code, message: error.message });
    return {
      success: false,
      message:
        error.code === '23505'
          ? 'An appeal has already been submitted for this case.'
          : 'This appeal could not be submitted. Confirm the report reference and try again.',
    };
  }
  return { success: true, message: 'Your appeal was submitted for safety review.' };
}
