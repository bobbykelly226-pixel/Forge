import type {
  QuestionDefinition,
  ResponseQualifier,
  ResponseState,
} from '@/lib/questionnaire/types';
import {
  eligibleSelectedChoiceIds,
  isBaseAnswerValid,
  isPriorityAnswerValid,
  shouldShowPriorityFollowUp,
  syncAnswerAfterBaseChange,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

export type PersistedIdentityFields = {
  refinement?: string | null;
  userSupplied?: string | null;
  publicDisplayAllowed?: boolean | null;
  privateMatchingAllowed?: boolean | null;
};

export type PersistedQuestionAnswer = {
  selectedChoiceIds: string[];
  priorityChoiceIds: string[];
  choiceContexts: Record<string, string>;
  identity: PersistedIdentityFields;
  /** Server authoritative compare-and-swap revision for this question. */
  revision: number;
  responseState?: ResponseState;
  activeQualifiers?: ResponseQualifier[];
};

export function emptyPersistedAnswer(): PersistedQuestionAnswer {
  return {
    selectedChoiceIds: [],
    priorityChoiceIds: [],
    choiceContexts: {},
    identity: {
      publicDisplayAllowed: false,
      privateMatchingAllowed: false,
    },
    revision: 0,
  };
}

export function deriveActiveQualifiers(
  question: QuestionDefinition,
  selectedChoiceIds: readonly string[]
): ResponseQualifier[] {
  const selected = new Set(selectedChoiceIds);
  const qualifiers = new Set<ResponseQualifier>();
  for (const choice of question.choices) {
    if (!selected.has(choice.id) || !choice.qualifier) continue;
    if (
      question.allowedQualifiers &&
      !question.allowedQualifiers.includes(choice.qualifier)
    ) {
      continue;
    }
    qualifiers.add(choice.qualifier);
  }
  return [...qualifiers];
}

export function deriveSpecialResponseState(
  question: QuestionDefinition,
  selectedChoiceIds: readonly string[]
): ResponseState {
  if (selectedChoiceIds.length === 0) return 'unanswered';
  const selected = new Set(selectedChoiceIds);
  for (const choice of question.choices) {
    if (!selected.has(choice.id) || !choice.specialResponseState) continue;
    if (
      question.allowedSpecialResponseStates &&
      !question.allowedSpecialResponseStates.includes(choice.specialResponseState)
    ) {
      continue;
    }
    return choice.specialResponseState;
  }
  return 'answered';
}

export function sanitizeAnswerAgainstCatalog(
  question: QuestionDefinition,
  answer: PersistedQuestionAnswer
): PersistedQuestionAnswer {
  const validIds = new Set(question.choices.map((c) => c.id));
  const selected = [...new Set(answer.selectedChoiceIds)].filter((id) =>
    validIds.has(id)
  );
  const synced = syncAnswerAfterBaseChange(
    question,
    selected,
    answer.priorityChoiceIds
  );
  const contexts: Record<string, string> = {};
  for (const choice of question.choices) {
    if (!choice.opensOptionalContext) continue;
    if (!synced.selectedChoiceIds.includes(choice.id)) continue;
    const text = answer.choiceContexts[choice.id];
    if (typeof text === 'string' && text.trim()) {
      contexts[choice.id] = text.trim().slice(0, 2000);
    }
  }

  const identity: PersistedIdentityFields = {};
  if (question.structuredIdentity) {
    identity.refinement = answer.identity.refinement?.trim() || null;
    identity.userSupplied = answer.identity.userSupplied?.trim() || null;
    identity.publicDisplayAllowed =
      answer.identity.publicDisplayAllowed ?? false;
    if (question.structuredIdentity.privacy.userControlsPrivateMatchingUse) {
      identity.privateMatchingAllowed =
        answer.identity.privateMatchingAllowed ?? false;
    }
  }

  return {
    selectedChoiceIds: synced.selectedChoiceIds,
    priorityChoiceIds: synced.priorityChoiceIds,
    choiceContexts: contexts,
    identity,
    revision: answer.revision,
    responseState: deriveSpecialResponseState(question, synced.selectedChoiceIds),
    activeQualifiers: deriveActiveQualifiers(question, synced.selectedChoiceIds),
  };
}

export function isPersistedAnswerComplete(
  question: QuestionDefinition,
  answer: PersistedQuestionAnswer
): boolean {
  const sanitized = sanitizeAnswerAgainstCatalog(question, answer);
  if (!isBaseAnswerValid(question, sanitized)) return false;
  if (!isPriorityAnswerValid(question, sanitized)) return false;
  return true;
}

export function answerNeedsPriority(
  question: QuestionDefinition,
  answer: PersistedQuestionAnswer
): boolean {
  return shouldShowPriorityFollowUp(question, answer.selectedChoiceIds);
}

export function eligiblePriorityIds(
  question: QuestionDefinition,
  answer: PersistedQuestionAnswer
): string[] {
  return eligibleSelectedChoiceIds(question, answer.selectedChoiceIds);
}
