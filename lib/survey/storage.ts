import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateSurveySubmission } from './validation';

// Narrow schema extension until the shared generated types are regenerated.
type SurveyDatabase = Database & { public: { Tables: {
  dating_survey_responses: {
    Row: { id: string; survey_version: string; submitted_at: string; answers: Json };
    Insert: { id: string; survey_version: string; submitted_at?: string; answers: Json };
    Update: never;
    Relationships: [];
  };
} } };

/** Trusted intake only. Do not expose until the public endpoint has abuse protection. */
export async function saveSurveySubmission(value: unknown): Promise<{ success: boolean; message: string }> {
  const validation = validateSurveySubmission(value);
  if (!validation.success) return validation;
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Feedback could not be saved right now. Your answers are still here, please try again.' };
  const { submission } = validation;
  const surveyAdmin = admin as unknown as SupabaseClient<SurveyDatabase>;
  const { error } = await surveyAdmin.from('dating_survey_responses').upsert({
    id: submission.id,
    survey_version: submission.version,
    answers: submission.answers,
  }, { onConflict: 'id', ignoreDuplicates: true });
  // A retry with the same random ID never overwrites or adds another response.
  if (error) return { success: false, message: 'Feedback could not be saved right now. Your answers are still here, please try again.' };
  return { success: true, message: 'Thank you. Your feedback will help guide Forge’s priorities.' };
}
