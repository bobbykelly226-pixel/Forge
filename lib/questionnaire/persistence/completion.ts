import {
  isQuestionCurrentlyEligible,
  type ParentingEligibilityProfile,
} from '@/lib/questionnaire/eligibility';
import {
  isPersistedAnswerComplete,
  type PersistedQuestionAnswer,
} from '@/lib/questionnaire/persistence/answer-state';
import {
  countCompletedPriorityFollowUps,
  shouldShowPriorityFollowUp,
  isPriorityAnswerValid,
  getAnswer,
} from '@/lib/questionnaire/preview/category-01-preview-flow';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

export type AnswersByQuestionId = Record<string, PersistedQuestionAnswer>;

export function getEligibleQuestions(
  category: CategoryDefinition,
  profile: ParentingEligibilityProfile | null | undefined
): QuestionDefinition[] {
  return category.questions.filter((question) =>
    isQuestionCurrentlyEligible(question.eligibilityRuleId, profile)
  );
}

export function isCategoryComplete(
  category: CategoryDefinition,
  answers: AnswersByQuestionId,
  profile: ParentingEligibilityProfile | null | undefined
): boolean {
  const eligible = getEligibleQuestions(category, profile);
  if (eligible.length === 0) return false;
  return eligible.every((question) =>
    isPersistedAnswerComplete(question, answers[question.id] ?? {
      selectedChoiceIds: [],
      priorityChoiceIds: [],
      choiceContexts: {},
      identity: {},
      revision: 0,
    })
  );
}

export function countCompletedEligibleQuestions(
  category: CategoryDefinition,
  answers: AnswersByQuestionId,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  return getEligibleQuestions(category, profile).filter((question) =>
    isPersistedAnswerComplete(question, answers[question.id] ?? {
      selectedChoiceIds: [],
      priorityChoiceIds: [],
      choiceContexts: {},
      identity: {},
      revision: 0,
    })
  ).length;
}

export function countCompletedPrioritiesInCategory(
  category: CategoryDefinition,
  answers: AnswersByQuestionId,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  let count = 0;
  for (const question of getEligibleQuestions(category, profile)) {
    if (!question.priorityFollowUp) continue;
    const answer = answers[question.id];
    if (
      shouldShowPriorityFollowUp(question, answer?.selectedChoiceIds ?? []) &&
      isPriorityAnswerValid(question, {
        selectedChoiceIds: answer?.selectedChoiceIds ?? [],
        priorityChoiceIds: answer?.priorityChoiceIds ?? [],
      })
    ) {
      count += 1;
    }
  }
  return count;
}

export function countAllEligibleQuestions(
  categories: readonly CategoryDefinition[],
  profile: ParentingEligibilityProfile | null | undefined
): number {
  return categories.reduce(
    (sum, category) => sum + getEligibleQuestions(category, profile).length,
    0
  );
}

export function countAllCompletedEligibleQuestions(
  categories: readonly CategoryDefinition[],
  answersByCategory: Record<number, AnswersByQuestionId>,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  return categories.reduce(
    (sum, category) =>
      sum +
      countCompletedEligibleQuestions(
        category,
        answersByCategory[category.number] ?? {},
        profile
      ),
    0
  );
}

export function countCompletedCategories(
  categories: readonly CategoryDefinition[],
  answersByCategory: Record<number, AnswersByQuestionId>,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  return categories.filter((category) =>
    isCategoryComplete(category, answersByCategory[category.number] ?? {}, profile)
  ).length;
}

export function areAllCategoriesComplete(
  categories: readonly CategoryDefinition[],
  answersByCategory: Record<number, AnswersByQuestionId>,
  profile: ParentingEligibilityProfile | null | undefined
): boolean {
  return categories.every((category) =>
    isCategoryComplete(category, answersByCategory[category.number] ?? {}, profile)
  );
}

export function countAllCompletedPriorities(
  categories: readonly CategoryDefinition[],
  answersByCategory: Record<number, AnswersByQuestionId>,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  return categories.reduce(
    (sum, category) =>
      sum +
      countCompletedPrioritiesInCategory(
        category,
        answersByCategory[category.number] ?? {},
        profile
      ),
    0
  );
}

export function firstIncompleteQuestionIndex(
  category: CategoryDefinition,
  answers: AnswersByQuestionId,
  profile: ParentingEligibilityProfile | null | undefined
): number {
  const eligibleIds = new Set(
    getEligibleQuestions(category, profile).map((q) => q.id)
  );
  for (let i = 0; i < category.questions.length; i += 1) {
    const question = category.questions[i];
    if (!eligibleIds.has(question.id)) continue;
    if (
      !isPersistedAnswerComplete(question, answers[question.id] ?? {
        selectedChoiceIds: [],
        priorityChoiceIds: [],
        choiceContexts: {},
        identity: {},
        revision: 0,
      })
    ) {
      return i;
    }
  }
  return 0;
}

/** Compatibility helper using preview answer shape for priority counting. */
export function previewStylePriorityCount(
  category: CategoryDefinition,
  answers: AnswersByQuestionId
): number {
  const previewAnswers = Object.fromEntries(
    Object.entries(answers).map(([id, answer]) => [
      id,
      {
        selectedChoiceIds: answer.selectedChoiceIds,
        priorityChoiceIds: answer.priorityChoiceIds,
      },
    ])
  );
  return countCompletedPriorityFollowUps(category, previewAnswers);
}

export function getPreviewStyleAnswer(
  answers: AnswersByQuestionId,
  questionId: string
) {
  return getAnswer(
    Object.fromEntries(
      Object.entries(answers).map(([id, answer]) => [
        id,
        {
          selectedChoiceIds: answer.selectedChoiceIds,
          priorityChoiceIds: answer.priorityChoiceIds,
        },
      ])
    ),
    questionId
  );
}
