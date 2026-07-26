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
  | {
      success: false;
      message: string;
      code?: string;
      transportError?: boolean;
    };

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
  if (!state.success) {
    return {
      success: false as const,
      message: state.message,
      code: state.code,
      transportError: state.transportError,
    };
  }
  if (!profile.success) {
    return {
      success: false as const,
      message: profile.message,
      code: profile.code,
      transportError: profile.transportError,
    };
  }
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
  expectedWriteGeneration: number;
  expectedRevision?: number;
  operationId: string;
}): Promise<
  ActionResult<{
    revision: number;
    writeGeneration: number;
    operationId: string;
    responseState?: string;
  }>
> {
  const result = await saveMyQuestionnaireResponse(input);
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
      transportError: result.transportError,
    };
  }
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function clearCompatibilityAnswerAction(input: {
  questionKey: string;
  expectedRevision: number;
  expectedWriteGeneration: number;
  operationId: string;
}): Promise<
  ActionResult<{
    revision: number;
    writeGeneration: number;
    operationId: string;
    responseState?: string;
  }>
> {
  const result = await clearMyQuestionnaireQuestion(input);
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
      transportError: result.transportError,
    };
  }
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function saveCompatibilityProgressAction(input: {
  categoryKey?: string | null;
  questionKey?: string | null;
  phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  expectedWriteGeneration: number;
}): Promise<ActionResult<{ writeGeneration: number; status?: string }>> {
  const result = await saveMyQuestionnaireProgressPosition(input);
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
      transportError: result.transportError,
    };
  }
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function restartCompatibilityCategoryAction(input: {
  categoryKey: string;
  expectedWriteGeneration: number;
  operationId: string;
}): Promise<ActionResult<{ writeGeneration: number; operationId: string }>> {
  const result = await clearMyQuestionnaireCategory(input);
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
      transportError: result.transportError,
    };
  }
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}

export async function restartCompatibilityProfileAction(input: {
  expectedWriteGeneration: number;
  operationId: string;
}): Promise<ActionResult<{ writeGeneration: number; operationId: string }>> {
  const result = await clearMyQuestionnaireProfile(input);
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      code: result.code,
      transportError: result.transportError,
    };
  }
  revalidateCompatibilityPaths();
  return { success: true, data: result.data };
}
