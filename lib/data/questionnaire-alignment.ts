import { QUESTIONNAIRE_VERSION } from '@/lib/questionnaire/catalog';
import { createClient } from '@/lib/supabase/server';

import {
  parseQuestionnaireAlignmentComparison,
  parseQuestionnaireAlignmentComparisonMap,
} from '@/lib/compatibility/questionnaire-payload';
import type { QuestionnaireAlignmentComparison } from '@/lib/compatibility/questionnaire-types';
import type { DataAccessResult } from '@/lib/data/profile';

export async function loadQuestionnaireAlignmentComparison(
  partnerId: string
): Promise<DataAccessResult<QuestionnaireAlignmentComparison | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'load_questionnaire_alignment_comparison',
    {
      p_partner_id: partnerId,
      p_version_key: QUESTIONNAIRE_VERSION,
    }
  );

  if (error) {
    console.error('loadQuestionnaireAlignmentComparison:', error.message);
    return {
      success: false,
      message: 'Could not load questionnaire alignment right now.',
    };
  }

  return {
    success: true,
    data: parseQuestionnaireAlignmentComparison(data),
  };
}

export async function loadQuestionnaireAlignmentComparisons(
  partnerIds: string[]
): Promise<DataAccessResult<Record<string, QuestionnaireAlignmentComparison>>> {
  const uniqueIds = [...new Set(partnerIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { success: true, data: {} };

  const supabase = await createClient();
  const comparisons: Record<string, QuestionnaireAlignmentComparison> = {};
  for (let offset = 0; offset < uniqueIds.length; offset += 50) {
    const { data, error } = await supabase.rpc('load_questionnaire_alignment_comparisons', {
      p_partner_ids: uniqueIds.slice(offset, offset + 50),
      p_version_key: QUESTIONNAIRE_VERSION,
    });
    if (error) {
      console.error('loadQuestionnaireAlignmentComparisons:', error.message);
      return { success: false, message: 'Could not load questionnaire alignment right now.' };
    }
    Object.assign(comparisons, parseQuestionnaireAlignmentComparisonMap(data));
  }
  return { success: true, data: comparisons };
}
