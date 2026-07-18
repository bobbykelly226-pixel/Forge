/**
 * Server-side helper: load the authenticated viewer's normalized comparison input.
 */

import {
  getCurrentUserProfile,
  getCurrentUserProfileAnswers,
} from '@/lib/data/profile';
import { PROFILE_ANSWER_KEYS } from '@/lib/types/profile-answers';

import { personFromOwnerProfile } from './inputs';
import type { CompatibilityPersonInput } from './types';

function coreValuesFromAnswers(
  answers: Awaited<ReturnType<typeof getCurrentUserProfileAnswers>>
): string[] {
  if (!answers.success || !answers.data) return [];
  const row = answers.data.find(
    (answer) => answer.question_key === PROFILE_ANSWER_KEYS.coreValues
  );
  if (!row) return [];
  const value = row.answer;
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export async function loadViewerCompatibilityPerson(): Promise<
  | { success: true; person: CompatibilityPersonInput }
  | { success: false; message: string }
> {
  const [profileResult, answersResult] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserProfileAnswers(),
  ]);

  if (!profileResult.success) {
    return { success: false, message: profileResult.message };
  }
  if (!profileResult.data) {
    return { success: false, message: 'Your profile is not available yet.' };
  }

  return {
    success: true,
    person: personFromOwnerProfile(profileResult.data, {
      coreValues: coreValuesFromAnswers(answersResult),
    }),
  };
}
