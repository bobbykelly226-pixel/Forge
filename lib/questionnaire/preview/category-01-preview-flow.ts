/**
 * In-memory preview flow for Compatibility Profile Categories 1 through 4.
 * Answers stay in React memory only; no database writes.
 */

import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

export type QuestionAnswerState = {
  selectedChoiceIds: string[];
  priorityChoiceIds: string[];
};

export type PreviewAnswers = Record<string, QuestionAnswerState>;

/** Per-category in-memory answer bags for the multi-category preview. */
export type PreviewAnswersByCategory = Record<number, PreviewAnswers>;

/** Single-category flow step used by advance/retreat helpers. */
export type CategoryFlowStep =
  | { kind: 'intro' }
  | { kind: 'question'; questionIndex: number; phase: 'base' | 'priority' }
  | { kind: 'complete' };

/** Multi-category preview shell step. */
export type PreviewStep =
  | { kind: 'directory' }
  | { kind: 'intro'; categoryNumber: number }
  | {
      kind: 'question';
      categoryNumber: number;
      questionIndex: number;
      phase: 'base' | 'priority';
    }
  | { kind: 'complete'; categoryNumber: number };

export type SelectionResult =
  | { ok: true; answer: QuestionAnswerState }
  | { ok: false; reason: 'at_max'; answer: QuestionAnswerState };

export type CategoryIntroCopy = {
  eyebrow: string;
  body: string;
  supporting: string;
  metadata: string;
  primary: string;
  secondary: string;
};

export const PREVIEW_NOTICE =
  'Preview mode. Your answers are not being saved yet.' as const;

/** Page metadata description for `/onboarding-v2-preview` (user facing). */
export const PREVIEW_PAGE_DESCRIPTION =
  'Preview Categories 1 through 4 from the Forge Compatibility Profile.' as const;

export const DIRECTORY_COPY = {
  eyebrow: 'Compatibility Profile',
  title: 'Onboarding 2.0 Preview',
  body: 'Explore the first four Compatibility Profile categories. Open any category directly. Your answers stay in this browser session only and are not saved.',
  metadata: 'Categories 1 through 4 available',
} as const;

/** Category 1 intro copy preserved exactly. */
export const INTRO_COPY: CategoryIntroCopy = {
  eyebrow: 'Compatibility Profile',
  body: 'The future you want and the way you build toward it shapes whether a relationship can grow with clarity. These questions help Forge understand your intentions, expectations, and room for flexibility.',
  supporting:
    'There are no wrong answers. Choose what most honestly reflects the relationship you want and how you approach building it.',
  metadata: '10 questions',
  primary: 'Begin Category',
  secondary: 'Back to categories',
};

export const CATEGORY_INTRO_COPY: Record<number, CategoryIntroCopy> = {
  1: INTRO_COPY,
  2: {
    eyebrow: 'Compatibility Profile',
    body: 'The values you live by shape how you make decisions, take responsibility, and understand character. These questions help Forge understand the principles and behaviors that matter most to you.',
    supporting:
      'There are no wrong answers. Choose what most honestly reflects how you try to live and what you value in a partner.',
    metadata: '10 questions',
    primary: 'Begin Category',
    secondary: 'Back to categories',
  },
  3: {
    eyebrow: 'Compatibility Profile',
    body: 'Communication affects how two people feel understood, supported, and emotionally connected. These questions explore how you express yourself, listen, and build closeness.',
    supporting:
      'There are no wrong answers. Choose what most honestly reflects the communication and emotional connection you want.',
    metadata: '10 questions',
    primary: 'Begin Category',
    secondary: 'Back to categories',
  },
  4: {
    eyebrow: 'Compatibility Profile',
    body: 'Conflict is unavoidable. The way two people respond, repair, and reconnect often determines whether trust can grow. These questions explore what helps disagreement remain respectful and workable.',
    supporting:
      'There are no wrong answers. Choose what most honestly reflects how you approach conflict and what you need for repair.',
    metadata: '10 questions',
    primary: 'Begin Category',
    secondary: 'Back to categories',
  },
};

export const COMPLETE_COPY = {
  eyebrow: 'Category Preview Complete',
  body: 'This is the first part of the larger Forge Compatibility Profile. Your responses will eventually help Forge explain meaningful alignment while leaving the decision and the conversation to you.',
} as const;

export const CATEGORY_COMPLETE_COPY: Record<number, { eyebrow: string; body: string }> = {
  1: COMPLETE_COPY,
  2: {
    eyebrow: 'Category Preview Complete',
    body: 'This is part of the larger Forge Compatibility Profile. Your responses will eventually help Forge explain meaningful alignment while leaving the decision and the conversation to you.',
  },
  3: {
    eyebrow: 'Category Preview Complete',
    body: 'This is part of the larger Forge Compatibility Profile. Your responses will eventually help Forge explain meaningful alignment while leaving the decision and the conversation to you.',
  },
  4: {
    eyebrow: 'Category Preview Complete',
    body: 'This is part of the larger Forge Compatibility Profile. Your responses will eventually help Forge explain meaningful alignment while leaving the decision and the conversation to you.',
  },
};

export function getIntroCopy(categoryNumber: number): CategoryIntroCopy {
  return CATEGORY_INTRO_COPY[categoryNumber] ?? INTRO_COPY;
}

export function getCompleteCopy(categoryNumber: number): { eyebrow: string; body: string } {
  return CATEGORY_COMPLETE_COPY[categoryNumber] ?? COMPLETE_COPY;
}

export function emptyAnswer(): QuestionAnswerState {
  return { selectedChoiceIds: [], priorityChoiceIds: [] };
}

export function getAnswer(
  answers: PreviewAnswers,
  questionId: string
): QuestionAnswerState {
  return answers[questionId] ?? emptyAnswer();
}

export function getCategoryAnswers(
  answersByCategory: PreviewAnswersByCategory,
  categoryNumber: number
): PreviewAnswers {
  return answersByCategory[categoryNumber] ?? {};
}

export function isCategorySessionComplete(
  category: CategoryDefinition,
  answersByCategory: PreviewAnswersByCategory
): boolean {
  return isCategoryPreviewComplete(
    category,
    getCategoryAnswers(answersByCategory, category.number)
  );
}

export function clearCategoryAnswers(
  answersByCategory: PreviewAnswersByCategory,
  categoryNumber: number
): PreviewAnswersByCategory {
  const next = { ...answersByCategory };
  delete next[categoryNumber];
  return next;
}

export function eligibleSelectedChoiceIds(
  question: QuestionDefinition,
  selectedChoiceIds: readonly string[]
): string[] {
  const excluded = new Set(question.priorityFollowUp?.excludedChoiceIds ?? []);
  const eligibleConfigured = question.priorityFollowUp?.eligibleChoiceIds;
  const eligibleSet = eligibleConfigured
    ? new Set(eligibleConfigured)
    : new Set(question.choices.map((c) => c.id));

  return selectedChoiceIds.filter(
    (id) => eligibleSet.has(id) && !excluded.has(id)
  );
}

export function shouldShowPriorityFollowUp(
  question: QuestionDefinition,
  selectedChoiceIds: readonly string[]
): boolean {
  if (!question.priorityFollowUp) return false;
  const eligible = eligibleSelectedChoiceIds(question, selectedChoiceIds);
  const minDisplay =
    question.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
    question.priorityFollowUp.selectionCount;
  return eligible.length >= minDisplay;
}

export function syncAnswerAfterBaseChange(
  question: QuestionDefinition,
  selectedChoiceIds: readonly string[],
  previousPriorityChoiceIds: readonly string[] = []
): QuestionAnswerState {
  const validIds = new Set(question.choices.map((c) => c.id));
  const selected = [...new Set(selectedChoiceIds)].filter((id) => validIds.has(id));
  const eligible = eligibleSelectedChoiceIds(question, selected);
  const showPriority = shouldShowPriorityFollowUp(question, selected);
  return {
    selectedChoiceIds: selected,
    priorityChoiceIds: showPriority
      ? previousPriorityChoiceIds.filter((id) => eligible.includes(id))
      : [],
  };
}

export function toggleBaseSelection(
  question: QuestionDefinition,
  current: QuestionAnswerState,
  choiceId: string
): SelectionResult {
  const isSingle =
    question.responseBehavior === 'single_choice' ||
    question.responseBehavior === 'scale_range' ||
    question.responseBehavior === 'scenario_choice' ||
    question.responseBehavior === 'structured_identity';

  if (isSingle) {
    const next = syncAnswerAfterBaseChange(question, [choiceId], []);
    return { ok: true, answer: next };
  }

  const alreadySelected = current.selectedChoiceIds.includes(choiceId);
  if (alreadySelected) {
    const nextIds = current.selectedChoiceIds.filter((id) => id !== choiceId);
    return {
      ok: true,
      answer: syncAnswerAfterBaseChange(
        question,
        nextIds,
        current.priorityChoiceIds
      ),
    };
  }

  const max = question.maxSelections;
  if (max !== null && current.selectedChoiceIds.length >= max) {
    return { ok: false, reason: 'at_max', answer: current };
  }

  return {
    ok: true,
    answer: syncAnswerAfterBaseChange(
      question,
      [...current.selectedChoiceIds, choiceId],
      current.priorityChoiceIds
    ),
  };
}

export function togglePrioritySelection(
  question: QuestionDefinition,
  current: QuestionAnswerState,
  choiceId: string
): QuestionAnswerState {
  const eligible = eligibleSelectedChoiceIds(question, current.selectedChoiceIds);
  if (!eligible.includes(choiceId)) {
    return current;
  }

  const already = current.priorityChoiceIds.includes(choiceId);
  if (already) {
    return {
      ...current,
      priorityChoiceIds: current.priorityChoiceIds.filter((id) => id !== choiceId),
    };
  }

  const required = question.priorityFollowUp?.selectionCount ?? 2;
  if (current.priorityChoiceIds.length >= required) {
    return current;
  }

  return {
    ...current,
    priorityChoiceIds: [...current.priorityChoiceIds, choiceId],
  };
}

export function isBaseAnswerValid(
  question: QuestionDefinition,
  answer: QuestionAnswerState
): boolean {
  const count = answer.selectedChoiceIds.length;
  if (count < question.minSelections) return false;
  if (question.maxSelections !== null && count > question.maxSelections) return false;
  return true;
}

export function isPriorityAnswerValid(
  question: QuestionDefinition,
  answer: QuestionAnswerState
): boolean {
  if (!shouldShowPriorityFollowUp(question, answer.selectedChoiceIds)) {
    return true;
  }
  const required = question.priorityFollowUp!.selectionCount;
  const eligible = new Set(
    eligibleSelectedChoiceIds(question, answer.selectedChoiceIds)
  );
  if (answer.priorityChoiceIds.length !== required) return false;
  return answer.priorityChoiceIds.every((id) => eligible.has(id));
}

export function canContinueFromStep(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: PreviewAnswers
): boolean {
  if (step.kind !== 'question') return true;
  const question = category.questions[step.questionIndex];
  if (!question) return false;
  const answer = getAnswer(answers, question.id);
  if (step.phase === 'base') {
    return isBaseAnswerValid(question, answer);
  }
  return isPriorityAnswerValid(question, answer);
}

export function advanceStep(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: PreviewAnswers
): CategoryFlowStep {
  if (step.kind === 'intro') {
    return { kind: 'question', questionIndex: 0, phase: 'base' };
  }
  if (step.kind === 'complete') {
    return step;
  }

  const question = category.questions[step.questionIndex];
  if (!question) return { kind: 'complete' };
  const answer = getAnswer(answers, question.id);

  if (step.phase === 'base') {
    if (shouldShowPriorityFollowUp(question, answer.selectedChoiceIds)) {
      return { kind: 'question', questionIndex: step.questionIndex, phase: 'priority' };
    }
  }

  const nextIndex = step.questionIndex + 1;
  if (nextIndex >= category.questions.length) {
    return { kind: 'complete' };
  }
  return { kind: 'question', questionIndex: nextIndex, phase: 'base' };
}

export function retreatStep(
  category: CategoryDefinition,
  step: CategoryFlowStep,
  answers: PreviewAnswers
): CategoryFlowStep {
  if (step.kind === 'intro') return step;
  if (step.kind === 'complete') {
    const lastIndex = category.questions.length - 1;
    const last = category.questions[lastIndex];
    const answer = getAnswer(answers, last.id);
    if (shouldShowPriorityFollowUp(last, answer.selectedChoiceIds)) {
      return { kind: 'question', questionIndex: lastIndex, phase: 'priority' };
    }
    return { kind: 'question', questionIndex: lastIndex, phase: 'base' };
  }

  if (step.phase === 'priority') {
    return { kind: 'question', questionIndex: step.questionIndex, phase: 'base' };
  }

  if (step.questionIndex === 0) {
    return { kind: 'intro' };
  }

  const prevIndex = step.questionIndex - 1;
  const prev = category.questions[prevIndex];
  const prevAnswer = getAnswer(answers, prev.id);
  if (shouldShowPriorityFollowUp(prev, prevAnswer.selectedChoiceIds)) {
    return { kind: 'question', questionIndex: prevIndex, phase: 'priority' };
  }
  return { kind: 'question', questionIndex: prevIndex, phase: 'base' };
}

export function isCategoryPreviewComplete(
  category: CategoryDefinition,
  answers: PreviewAnswers
): boolean {
  return category.questions.every((question) => {
    const answer = getAnswer(answers, question.id);
    return (
      isBaseAnswerValid(question, answer) &&
      isPriorityAnswerValid(question, answer)
    );
  });
}

export function countCompletedPriorityFollowUps(
  category: CategoryDefinition,
  answers: PreviewAnswers
): number {
  let count = 0;
  for (const question of category.questions) {
    if (!question.priorityFollowUp) continue;
    const answer = getAnswer(answers, question.id);
    if (
      shouldShowPriorityFollowUp(question, answer.selectedChoiceIds) &&
      isPriorityAnswerValid(question, answer)
    ) {
      count += 1;
    }
  }
  return count;
}

/** Format guidance derived from question configuration (exact formatLabel + limits). */
export function formatGuidanceForQuestion(question: QuestionDefinition): string {
  if (question.responseBehavior === 'multi_select') {
    if (question.selectAllThatApply || question.maxSelections === null) {
      return question.formatLabel;
    }
    return question.formatLabel;
  }
  return question.formatLabel;
}

export function multiSelectStatusText(question: QuestionDefinition, selectedCount: number): string {
  if (question.maxSelections === null) {
    return `${selectedCount} selected`;
  }
  return `${selectedCount} of ${question.maxSelections} selected`;
}

/** Shown immediately when a multi-select question reaches maxSelections. */
export const SELECTION_LIMIT_MESSAGE =
  "You've reached the selection limit. Deselect one before selecting another." as const;

export function isMultiSelectAtMax(
  question: QuestionDefinition,
  selectedCount: number
): boolean {
  return (
    question.responseBehavior === 'multi_select' &&
    question.maxSelections !== null &&
    selectedCount >= question.maxSelections
  );
}

export function selectionLimitGuidance(
  question: QuestionDefinition,
  selectedCount: number
): string | null {
  return isMultiSelectAtMax(question, selectedCount) ? SELECTION_LIMIT_MESSAGE : null;
}

export function questionsWithPriorityFollowUp(
  category: CategoryDefinition
): number[] {
  return category.questions
    .filter((q) => q.priorityFollowUp)
    .map((q) => q.number);
}

export function progressFraction(
  category: CategoryDefinition,
  step: CategoryFlowStep
): number {
  if (step.kind === 'intro') return 0;
  if (step.kind === 'complete') return 1;
  const total = category.questions.length;
  const base = step.questionIndex / total;
  if (step.phase === 'priority') {
    return (step.questionIndex + 0.5) / total;
  }
  return base;
}

export function toCategoryFlowStep(step: PreviewStep): CategoryFlowStep | null {
  if (step.kind === 'directory') return null;
  if (step.kind === 'intro') return { kind: 'intro' };
  if (step.kind === 'complete') return { kind: 'complete' };
  return {
    kind: 'question',
    questionIndex: step.questionIndex,
    phase: step.phase,
  };
}

export function fromCategoryFlowStep(
  categoryNumber: number,
  step: CategoryFlowStep
): PreviewStep {
  if (step.kind === 'intro') return { kind: 'intro', categoryNumber };
  if (step.kind === 'complete') return { kind: 'complete', categoryNumber };
  return {
    kind: 'question',
    categoryNumber,
    questionIndex: step.questionIndex,
    phase: step.phase,
  };
}
