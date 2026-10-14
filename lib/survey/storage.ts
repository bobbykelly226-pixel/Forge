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

// Best-effort warm-instance throttle. Database-wide hourly capacity is checked separately.
// Keep only short lived daily keyed hashes, never raw IPs or links to answers.
const buckets = new Map<string, { start: number; count: number }>();
export function consumeSurveyRate(key: string, now = Date.now()) {
  for (const [entry, bucket] of buckets) if (now - bucket.start >= 3600000) buckets.delete(entry);
  const existing = buckets.get(key);
  if (existing && existing.count >= 40) return false;
  if (!existing && buckets.size >= 5000) return false;
  buckets.set(key, { start: existing?.start ?? now, count: (existing?.count ?? 0) + 1 });
  return true;
}

/** Trusted intake only, called after signed cookie, origin and honeypot checks. */
export async function saveSurveySubmission(value: unknown, rateKey: string): Promise<{ success: boolean; message: string }> {
  const validation = validateSurveySubmission(value);
  if (!validation.success) return validation;
  const admin = createServiceClient();
  if (!admin) return { success: false, message: 'Feedback could not be saved right now. Your answers are still here, please try again.' };
  const { submission } = validation;
  const surveyAdmin = admin as unknown as SupabaseClient<SurveyDatabase>;
  const existing = await surveyAdmin.from('dating_survey_responses').select('id').eq('id', submission.id).maybeSingle();
  if (existing.error) return { success: false, message: 'Feedback could not be saved right now. Your answers are still here, please try again.' };
  if (existing.data) return { success: true, message: 'Thank you. Your feedback will help guide Forge’s priorities.' };
  if (!consumeSurveyRate(rateKey)) return { success: false, message: 'We’ve received several submissions recently. Please try again later, your answers are still here.' };
  const volume = await surveyAdmin.from('dating_survey_responses').select('id', { count: 'exact', head: true }).gte('submitted_at', new Date(Date.now() - 3600000).toISOString());
  if (volume.error || (volume.count ?? 0) >= 300) return { success: false, message: 'We’ve received several submissions recently. Please try again later, your answers are still here.' };
  const { error } = await surveyAdmin.from('dating_survey_responses').upsert({ id: submission.id, survey_version: submission.version, answers: submission.answers }, { onConflict: 'id', ignoreDuplicates: true });
  // A retry with the same random ID never overwrites or adds another response.
  if (error) return { success: false, message: 'Feedback could not be saved right now. Your answers are still here, please try again.' };
  return { success: true, message: 'Thank you. Your feedback will help guide Forge’s priorities.' };
}
