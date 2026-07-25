import type { ParentingEligibilityProfile } from '@/lib/questionnaire/eligibility';
import { getEligibleQuestions } from '@/lib/questionnaire/persistence/completion';
import {
  isPersistedAnswerComplete,
  type PersistedQuestionAnswer,
} from '@/lib/questionnaire/persistence/answer-state';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import {
  advanceStep,
  canContinueFromStep,
  progressFraction,
  retreatStep,
  type CategoryFlowStep,
  type PreviewAnswers,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

/** Category view containing only currently eligible questions, in catalog order. */
export function toEligibleCategoryView(
  category: CategoryDefinition,
  profile: ParentingEligibilityProfile | null | undefined
): CategoryDefinition {
  return {
    ...category,
    questions: getEligibleQuestions(category, profile),
  };
}

export function toPreviewAnswers(
  answers: Record<string, PersistedQuestionAnswer>
): PreviewAnswers {
  return Object.fromEntries(
    Object.entries(answers).map(([id, answer]) => [
      id,
      {
        selectedChoiceIds: answer.selectedChoiceIds,
        priorityChoiceIds: answer.priorityChoiceIds,
      },
    ])
  );
}

export function firstIncompleteEligibleIndex(
  category: CategoryDefinition,
  answers: Record<string, PersistedQuestionAnswer>,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  const eligible = getEligibleQuestions(category, profile);
  for (let i = 0; i < eligible.length; i += 1) {
    const question = eligible[i];
    if (
      !isPersistedAnswerComplete(
        question,
        answers[question.id] ?? {
          selectedChoiceIds: [],
          priorityChoiceIds: [],
          choiceContexts: {},
          identity: {},
          revision: 0,
        }
      )
    ) {
      return i;
    }
  }
  return 0;
}

export function canContinueEligible(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: Record<string, PersistedQuestionAnswer>,
  profile: ParentingEligibilityProfile | null | undefined
): boolean {
  const view = toEligibleCategoryView(category, profile);
  return canContinueFromStep(view, step, toPreviewAnswers(answers));
}

export function advanceEligible(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: Record<string, PersistedQuestionAnswer>,
  profile: ParentingEligibilityProfile | null | undefined
): CategoryFlowStep {
  const view = toEligibleCategoryView(category, profile);
  return advanceStep(view, step, toPreviewAnswers(answers));
}

export function retreatEligible(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: Record<string, PersistedQuestionAnswer>,
  profile: ParentingEligibilityProfile | null | undefined
): CategoryFlowStep {
  const view = toEligibleCategoryView(category, profile);
  return retreatStep(view, step, toPreviewAnswers(answers));
}

export function eligibleProgressFraction(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  const view = toEligibleCategoryView(category, profile);
  return progressFraction(view, step);
}
