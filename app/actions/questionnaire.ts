'use server';

import { revalidatePath } from 'next/cache';

import {
  clearMyQuestionnaireCategory,
  clearMyQuestionnaireProfile,
  clearMyQuestionnaireQuestion,
  loadMyQuestionnaireState,
  loadParentingEligibilityProfile,
  saveMyQuestionnaireProgressPosition,
  saveMyQuestionnaireResponse,
} from '@/lib/data/questionnaire';
import type { PersistedQuestionAnswer } from '@/lib/questionnaire/persistence/answer-state';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };

function revalidateCompatibilityPaths() {
  revalidatePath('/compatibility-profile');
  revalidatePath('/profile');
  revalidatePath('/app');
}

export async function loadCompatibilityProfileStateAction() {
  const [state, profile] = await Promise.all([
    loadMyQuestionnaireState(),
    loadParentingEligibilityProfile(),
  ]);
  if (!state.success) return { success: false as const, message: state.message };
  if (!profile.success) return { success: false as const, message: profile.message };
  return {
    success: true as const,
    data: {
      state: state.data,
      parentingProfile: profile.data,
    },
  };
}

export async function saveCompatibilityAnswerAction(input: {
  questionKey: string;
  answer: PersistedQuestionAnswer;
}): Promise<ActionResult<{ clientMutation: number }>> {
  const result = await saveMyQuestionnaireResponse(input);
  if (!result.success) return { success: false, message: result.message };
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function clearCompatibilityAnswerAction(
  questionKey: string
): Promise<ActionResult<{ clientMutation: number }>> {
  const result = await clearMyQuestionnaireQuestion(questionKey);
  if (!result.success) return { success: false, message: result.message };
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function saveCompatibilityProgressAction(input: {
  categoryKey?: string | null;
  questionKey?: string | null;
  phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  status?: 'not_started' | 'in_progress' | 'completed' | null;
}): Promise<ActionResult> {
  const result = await saveMyQuestionnaireProgressPosition(input);
  if (!result.success) return { success: false, message: result.message };
  revalidateCompatibilityPaths();
  return { success: true };
}

export async function restartCompatibilityCategoryAction(
  categoryKey: string
): Promise<ActionResult> {
  const result = await clearMyQuestionnaireCategory(categoryKey);
  if (!result.success) return { success: false, message: result.message };
  revalidateCompatibilityPaths();
  return { success: true };
}

export async function restartCompatibilityProfileAction(): Promise<ActionResult> {
  const result = await clearMyQuestionnaireProfile();
  if (!result.success) return { success: false, message: result.message };
  revalidateCompatibilityPaths();
  return { success: true };
}
