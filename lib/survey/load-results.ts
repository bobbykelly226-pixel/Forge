import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import { createServiceClient } from '@/lib/supabase/admin';
import type { SurveyResults } from './results';

type SurveyResultsDatabase = Database & { public: { Functions: {
  get_dating_survey_results: { Args: { p_page: number }; Returns: Json };
} } };

/** Only load after the calling server page checks operator authorization and MFA. */
export async function loadSurveyResults(page: number): Promise<SurveyResults | null> {
  const admin = createServiceClient();
  if (!admin) return null;
  const client = admin as unknown as SupabaseClient<SurveyResultsDatabase>;
  const { data, error } = await client.rpc('get_dating_survey_results', { p_page: page });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as unknown as SurveyResults;
}
