/**
 * Builds a complete, strongly typed synthetic catalog from the committed
 * structural manifest so all documented question structures can be validator-proven.
 *
 * Category 1 through 7 are the live 10 question catalogs. Categories 8–10 wording is
 * intentionally not imported — prompts/options are synthetic placeholders.
 * This catalog is NOT returned by getQuestionnaireCatalog().
 */

import masterStructureManifest from '@/lib/questionnaire/fixtures/master-structure-manifest.json';
import type {
  AnswerChoiceDefinition,
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionDefinition,
  QuestionnaireCatalog,
  ResponseQualifier,
  ResponseState,
} from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

export type ManifestSpecialChoice = {
  index: number;
  opensOptionalContext?: boolean;
  optionalContext?: {
    kind: 'free_text';
    required: false;
    scored: false;
  };
  qualifier?: ResponseQualifier;
  qualifierCoexistsWithSelections?: boolean;
  mutuallyExclusive?: boolean;
  specialResponseState?: ResponseState;
  excludeFromPriority?: boolean;
  architectureOnly?: boolean;
};

export type ManifestQuestion = {
  categoryNumber: number;
  categoryTitle: string;
  questionNumber: number;
  formatLabel: string;
  responseBehavior: QuestionDefinition['responseBehavior'];
  listedChoiceCount: number;
  choiceCount: number;
  minSelections: number;
  maxSelections: number | null;
  features: string[];
  specialChoices: ManifestSpecialChoice[];
  allowedSpecialResponseStates?: ResponseState[];
  allowedQualifiers?: ResponseQualifier[];
  priorityFollowUp?: {
    selectionCount: number;
    unordered: true;
    minEligibleSelectionsBeforeDisplay: number;
    excludedChoiceIndexes?: number[];
  };
  structuredIdentity?: QuestionDefinition['structuredIdentity'];
  hasContextNote: boolean;
  hasImplementationNote: boolean;
  hasEligibility: boolean;
  isConditionalScenario: boolean;
};

export const SYNTHETIC_ELIGIBILITY_DESCRIPTION =
  'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.';

function choiceId(categoryNumber: number, questionNumber: number, index: number): string {
  return `synth_c${String(categoryNumber).padStart(2, '0')}_q${String(questionNumber).padStart(2, '0')}_c${String(index).padStart(2, '0')}`;
}

function questionId(categoryNumber: number, questionNumber: number): string {
  return `synth_c${String(categoryNumber).padStart(2, '0')}_q${String(questionNumber).padStart(2, '0')}`;
}

function eligibilityRuleId(slot: number): string {
  return `synth_elig_parenting_${slot}`;
}

function buildChoices(entry: ManifestQuestion): AnswerChoiceDefinition[] {
  const byIndex = new Map(entry.specialChoices.map((s) => [s.index, s]));
  const choices: AnswerChoiceDefinition[] = [];
  for (let index = 1; index <= entry.choiceCount; index += 1) {
    const special = byIndex.get(index);
    const choice: AnswerChoiceDefinition = {
      id: choiceId(entry.categoryNumber, entry.questionNumber, index),
      label: special?.architectureOnly
        ? `Architecture qualifier option ${index}`
        : `Synthetic option ${index}`,
      displayOrder: index,
    };
    if (special?.mutuallyExclusive) choice.mutuallyExclusive = true;
    if (special?.specialResponseState) {
      choice.specialResponseState = special.specialResponseState;
    }
    if (special?.qualifier) {
      choice.qualifier = special.qualifier;
      choice.qualifierCoexistsWithSelections = !!special.qualifierCoexistsWithSelections;
    }
    if (special?.opensOptionalContext && special.optionalContext) {
      choice.opensOptionalContext = true;
      choice.optionalContext = {
        kind: 'free_text',
        required: false,
        scored: false,
      };
    }
    choices.push(choice);
  }
  return choices;
}

function buildQuestion(
  entry: ManifestQuestion,
  eligibilitySlotByQuestion: Map<string, number>
): QuestionDefinition {
  const choices = buildChoices(entry);
  const id = questionId(entry.categoryNumber, entry.questionNumber);
  const question: QuestionDefinition = {
    id,
    number: entry.questionNumber,
    prompt: `[Architecture coverage] Category ${entry.categoryNumber} Question ${entry.questionNumber}`,
    formatLabel: entry.formatLabel,
    responseBehavior: entry.responseBehavior,
    alignmentPurpose: `[Architecture coverage] Alignment purpose for category ${entry.categoryNumber} question ${entry.questionNumber}.`,
    minSelections: entry.minSelections,
    maxSelections: entry.maxSelections,
    choices,
  };

  if (entry.features.includes('select_all') || entry.formatLabel === 'Select all that apply') {
    question.selectAllThatApply = true;
  }
  if (entry.hasContextNote) {
    question.contextNote = '[Architecture coverage] Context note placeholder.';
  }
  if (entry.hasImplementationNote) {
    question.implementationNote = '[Architecture coverage] Implementation note placeholder.';
  }
  if (entry.structuredIdentity) {
    question.structuredIdentity = entry.structuredIdentity;
  }
  if (entry.allowedSpecialResponseStates?.length) {
    question.allowedSpecialResponseStates = entry.allowedSpecialResponseStates;
  }
  if (entry.allowedQualifiers?.length) {
    question.allowedQualifiers = entry.allowedQualifiers;
  }
  if (entry.hasEligibility) {
    const slot = eligibilitySlotByQuestion.get(id);
    if (slot == null) {
      throw new Error(`Missing eligibility slot for ${id}`);
    }
    question.eligibilityRuleId = eligibilityRuleId(slot);
  }
  if (entry.isConditionalScenario) {
    const conditional: NonNullable<QuestionDefinition['conditional']> = {
      kind: 'conditional_scenario',
    };
    if (entry.hasEligibility) {
      const slot = eligibilitySlotByQuestion.get(id);
      if (slot == null) {
        throw new Error(`Missing eligibility slot for conditional ${id}`);
      }
      conditional.requiresEligibilityRuleId = eligibilityRuleId(slot);
    }
    question.conditional = conditional;
  }
  if (entry.priorityFollowUp) {
    const excluded = (entry.priorityFollowUp.excludedChoiceIndexes ?? []).map((index) =>
      choiceId(entry.categoryNumber, entry.questionNumber, index)
    );
    question.priorityFollowUp = {
      prompt: `[Architecture coverage] Priority follow-up for category ${entry.categoryNumber} question ${entry.questionNumber}`,
      selectionCount: entry.priorityFollowUp.selectionCount,
      unordered: true,
      minEligibleSelectionsBeforeDisplay:
        entry.priorityFollowUp.minEligibleSelectionsBeforeDisplay,
      ...(excluded.length ? { excludedChoiceIds: excluded } : {}),
    };
  }

  return question;
}

/**
 * Complete synthetic ten-category catalog built from the structural manifest.
 * Proves every question structure is representable under the real contracts.
 */
export function getSyntheticCatalogFromManifest(): QuestionnaireCatalog {
  const entries = masterStructureManifest.questions as ManifestQuestion[];
  if (entries.length !== 115) {
    throw new Error(`Expected 115 manifest questions, found ${entries.length}`);
  }

  // Assign stable eligibility rule slots for the three HQ eligibility attachments.
  const eligibilityQuestions = entries.filter((e) => e.hasEligibility);
  const eligibilitySlotByQuestion = new Map<string, number>();
  let slot = 0;
  for (const entry of eligibilityQuestions) {
    slot += 1;
    eligibilitySlotByQuestion.set(questionId(entry.categoryNumber, entry.questionNumber), slot);
  }

  const eligibilityRules: EligibilityRuleDefinition[] = [...eligibilitySlotByQuestion.values()]
    .sort((a, b) => a - b)
    .map((n) => ({
      id: eligibilityRuleId(n),
      ruleKey: `parenting_role_display_${n}`,
      description: SYNTHETIC_ELIGIBILITY_DESCRIPTION,
      condition: {
        type: 'profile_predicate' as const,
        predicateKey: 'open_to_parenting_or_stepparenting_role',
      },
    }));

  const byCategory = new Map<number, ManifestQuestion[]>();
  for (const entry of entries) {
    const list = byCategory.get(entry.categoryNumber) ?? [];
    list.push(entry);
    byCategory.set(entry.categoryNumber, list);
  }

  const categories: CategoryDefinition[] = [...byCategory.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, questions]) => {
      const title = questions[0]?.categoryTitle ?? `Category ${number}`;
      return {
        id: `synth_category_${String(number).padStart(2, '0')}`,
        number,
        title,
        status: 'locked' as const,
        lockedProductDecisions: [],
        formatDistribution: {},
        questions: questions
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((entry) => buildQuestion(entry, eligibilitySlotByQuestion)),
      };
    });

  return assertValidQuestionnaireCatalog({
    questionnaireVersion: 'architecture_synthetic_manifest_v1',
    specificationVersion: 'compatibility_profile_categories_1_7_v10',
    eligibilityRules,
    categories,
  });
}

export function getManifestQuestion(
  categoryNumber: number,
  questionNumber: number
): ManifestQuestion | undefined {
  return (masterStructureManifest.questions as ManifestQuestion[]).find(
    (q) => q.categoryNumber === categoryNumber && q.questionNumber === questionNumber
  );
}
