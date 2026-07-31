'use server';

import { after } from 'next/server';

import { sendBetaFeedbackNotification } from '@/lib/feedback/notification';
import { getBetaFeedbackCategory } from '@/lib/feedback/constants';
import { validateBetaFeedbackFormData } from '@/lib/feedback/validation';
import { createClient } from '@/lib/supabase/server';

export type SubmitBetaFeedbackState = {
  success: boolean;
  message: string;
  reference?: string;
  responseExpectation?: string;
  fieldErrors?: Partial<Record<'category' | 'area' | 'message', string>>;
};

export const INITIAL_BETA_FEEDBACK_STATE: SubmitBetaFeedbackState = {
  success: false,
  message: '',
};

export async function submitBetaFeedbackAction(
  _previousState: SubmitBetaFeedbackState,
  formData: FormData
): Promise<SubmitBetaFeedbackState> {
  const validated = validateBetaFeedbackFormData(formData);
  if (!validated.success) {
    return {
      success: false,
      message: validated.message,
      fieldErrors: validated.fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'Your session has expired. Sign in again, then resend your feedback.',
    };
  }

  const submissionId = crypto.randomUUID();
  const { error } = await supabase.from('beta_feedback_submissions').insert({
    id: submissionId,
    submitter_id: user.id,
    category: validated.data.category,
    area: validated.data.area,
    message: validated.data.message,
    contact_requested: validated.data.contactRequested,
  });

  if (error) {
    console.error('Beta feedback could not be saved.', {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    return {
      success: false,
      message: 'Your feedback could not be saved right now. Please try again.',
    };
  }

  const profileResult = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  after(async () => {
    await sendBetaFeedbackNotification({
      submissionId,
      submitterId: user.id,
      submitterEmail: user.email ?? null,
      submitterName: profileResult.data?.full_name ?? null,
      category: validated.data.category,
      area: validated.data.area,
      message: validated.data.message,
      contactRequested: validated.data.contactRequested,
    });
  });

  const reference = submissionId.slice(0, 8).toUpperCase();
  const categoryDetails = getBetaFeedbackCategory(validated.data.category);

  return {
    success: true,
    message: 'Thank you. Your feedback is recorded and ready for Forge review.',
    reference,
    responseExpectation: categoryDetails.responseExpectation,
  };
}
