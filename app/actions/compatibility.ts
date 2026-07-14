'use server';

/**
 * @deprecated Compatibility answers are legacy.
 * This module re-exports profile_answers-backed onboarding actions only.
 * Do not write to compatibility_answers.
 */

import {
  finishOnboarding,
  loadOnboardingBootstrap,
  saveOnboardingStep,
  saveProfileAnswer,
} from '@/app/actions/onboarding';
import type {
  ProfileAnswerValue,
  ProfileAnswersMap,
} from '@/lib/types/profile-answers';

/** @deprecated Use loadOnboardingBootstrap */
export async function loadCompatibilityAnswers(): Promise<ProfileAnswersMap> {
  const data = await loadOnboardingBootstrap();
  return data.answers;
}

/** @deprecated Use saveProfileAnswer — writes profile_answers only */
export async function saveCompatibilityAnswer(
  questionKey: string,
  answerValue: ProfileAnswerValue
): Promise<{ success: boolean; message: string }> {
  return saveProfileAnswer(questionKey, answerValue);
}

export {
  finishOnboarding,
  loadOnboardingBootstrap,
  saveOnboardingStep,
  saveProfileAnswer,
};
