'use server';

import {
  completeOnboarding,
  loadOnboardingState,
  saveOnboardingStepProgress,
  upsertCurrentUserProfileAnswer,
} from '@/lib/data/onboarding';
import type {
  ProfileAnswerValue,
  ProfileAnswersMap,
} from '@/lib/types/profile-answers';

type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Load onboarding answers + resume step from profile_answers / user_app_state.
 * Does not read or write compatibility_answers.
 */
export async function loadOnboardingBootstrap(): Promise<{
  answers: ProfileAnswersMap;
  initialStep: number;
  completed: boolean;
}> {
  const result = await loadOnboardingState();
  if (!result.success) {
    return { answers: {}, initialStep: 1, completed: false };
  }

  return {
    answers: result.data.answers,
    initialStep: result.data.initialStepNumber,
    completed: result.data.onboardingCompleted,
  };
}

export async function saveProfileAnswer(
  questionKey: string,
  answerValue: ProfileAnswerValue
): Promise<ActionResult> {
  const result = await upsertCurrentUserProfileAnswer(questionKey, answerValue);
  if (!result.success) {
    return { success: false, message: result.message };
  }
  return { success: true, message: 'Answer saved.' };
}

export async function saveOnboardingStep(step: number): Promise<ActionResult> {
  const result = await saveOnboardingStepProgress(step);
  if (!result.success) {
    return { success: false, message: result.message };
  }
  return { success: true, message: 'Progress saved.' };
}

export async function finishOnboarding(): Promise<ActionResult> {
  const result = await completeOnboarding();
  if (!result.success) {
    return { success: false, message: result.message };
  }
  return { success: true, message: 'Onboarding complete.' };
}
