import { createClient } from '@/lib/supabase/server';
import type { Json, Tables } from '@/lib/supabase/database.types';
import {
  PROFILE_ANSWER_KEYS,
  type ProfileAnswerKey,
  type ProfileAnswerValue,
  type ProfileAnswersMap,
  type OnboardingStepId,
  deriveOnboardingStep,
  isOnboardingContentComplete,
  onboardingStepIdFromNumber,
  onboardingStepNumber,
  ONBOARDING_STEPS,
} from '@/lib/types/profile-answers';
import {
  ensureFoundationalRecords,
  type DataAccessResult,
  updateOnboardingProgress,
} from '@/lib/data/profile';
import { mapLegacyRelationshipGoal } from '@/lib/profile/legacy-mapping';

const ALLOWED_KEYS = new Set<string>(Object.values(PROFILE_ANSWER_KEYS));

function isAllowedKey(key: string): key is ProfileAnswerKey {
  return ALLOWED_KEYS.has(key);
}

function isValidAnswerValue(value: unknown): value is ProfileAnswerValue {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return (
      value.length > 0 &&
      value.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  }
  return false;
}

function parseAnswerJson(value: Json): ProfileAnswerValue | null {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[];
  }
  return null;
}

export async function loadCurrentUserProfileAnswersMap(): Promise<
  DataAccessResult<ProfileAnswersMap>
> {
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return ensured;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data, error } = await supabase
    .from('profile_answers')
    .select('question_key, answer')
    .eq('user_id', user.id);

  if (error) {
    console.error('loadCurrentUserProfileAnswersMap:', error.message);
    return { success: false, message: 'Could not load your answers.' };
  }

  const answers: ProfileAnswersMap = {};
  for (const row of data ?? []) {
    if (!isAllowedKey(row.question_key)) continue;
    const parsed = parseAnswerJson(row.answer);
    if (parsed == null || !isValidAnswerValue(parsed)) continue;
    answers[row.question_key] = parsed;
  }

  return { success: true, data: answers };
}

export async function upsertCurrentUserProfileAnswer(
  questionKey: string,
  answerValue: ProfileAnswerValue
): Promise<DataAccessResult<{ questionKey: ProfileAnswerKey }>> {
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return ensured;
  }

  if (!isAllowedKey(questionKey)) {
    return { success: false, message: 'Unknown question.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const normalized: ProfileAnswerValue = Array.isArray(answerValue)
    ? answerValue.map((item) => item.trim()).filter(Boolean)
    : answerValue.trim();

  if (
    (typeof normalized === 'string' && !normalized) ||
    (Array.isArray(normalized) && normalized.length === 0)
  ) {
    const { error } = await supabase
      .from('profile_answers')
      .delete()
      .eq('user_id', user.id)
      .eq('question_key', questionKey);

    if (error) {
      console.error('clear profile answer:', error.message);
      return { success: false, message: 'Could not clear your answer. Please try again.' };
    }

    return { success: true, data: { questionKey } };
  }

  if (!isValidAnswerValue(normalized)) {
    return { success: false, message: 'Answer value is invalid.' };
  }

  const { error } = await supabase.from('profile_answers').upsert(
    {
      user_id: user.id,
      question_key: questionKey,
      answer: normalized,
      visibility: 'private',
      is_non_negotiable: false,
    },
    { onConflict: 'user_id,question_key' }
  );

  if (error) {
    console.error('upsert profile answer:', error.message);
    return { success: false, message: 'Could not save your answer. Please try again.' };
  }

  // Keep profiles.relationship_goal as the shared authoritative public field.
  if (
    questionKey === PROFILE_ANSWER_KEYS.relationshipIntention &&
    typeof normalized === 'string'
  ) {
    const mapped = mapLegacyRelationshipGoal(normalized);
    if (mapped.mapped) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ relationship_goal: mapped.mapped })
        .eq('id', user.id);
      if (profileError) {
        console.error('sync relationship_goal:', profileError.message);
        return {
          success: false,
          message: 'Could not sync your relationship goal. Please try again.',
        };
      }
    }
  }

  return { success: true, data: { questionKey } };
}

export type OnboardingLoadState = {
  answers: ProfileAnswersMap;
  onboardingCompleted: boolean;
  onboardingStep: OnboardingStepId;
  initialStepNumber: number;
  appState: Tables<'user_app_state'> | null;
};

export async function loadOnboardingState(): Promise<
  DataAccessResult<OnboardingLoadState>
> {
  const answersResult = await loadCurrentUserProfileAnswersMap();
  if (!answersResult.success) {
    return answersResult;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data: appState, error } = await supabase
    .from('user_app_state')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('loadOnboardingState app state:', error.message);
    return { success: false, message: 'Could not load onboarding progress.' };
  }

  const onboardingCompleted = Boolean(appState?.onboarding_completed);
  const stepId = deriveOnboardingStep({
    onboardingCompleted,
    savedStep: appState?.onboarding_step,
    answers: answersResult.data,
  });

  return {
    success: true,
    data: {
      answers: answersResult.data,
      onboardingCompleted,
      onboardingStep: stepId,
      initialStepNumber: onboardingStepNumber(stepId),
      appState,
    },
  };
}

export async function saveOnboardingStepProgress(
  step: number | OnboardingStepId
): Promise<DataAccessResult<Tables<'user_app_state'>>> {
  const stepId =
    typeof step === 'number' ? onboardingStepIdFromNumber(step) : step;

  return updateOnboardingProgress({
    onboardingStep: stepId,
  });
}

/**
 * Marks onboarding complete only when required answers exist.
 */
export async function completeOnboarding(): Promise<
  DataAccessResult<{ completed: true }>
> {
  const answersResult = await loadCurrentUserProfileAnswersMap();
  if (!answersResult.success) {
    return answersResult;
  }

  if (!isOnboardingContentComplete(answersResult.data)) {
    return {
      success: false,
      message:
        'Please finish your relationship intention and values before completing onboarding.',
    };
  }

  const progress = await updateOnboardingProgress({
    onboardingStep: ONBOARDING_STEPS.readiness,
    onboardingCompleted: true,
  });

  if (!progress.success) {
    return progress;
  }

  return { success: true, data: { completed: true } };
}
