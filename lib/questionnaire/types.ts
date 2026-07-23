/**
 * Compatibility Profile questionnaire contracts (Onboarding 2.0 foundation).
 * Catalog-driven; not wired to the live onboarding UI in this slice.
 */

export const QUESTION_FORMATS = [
  'single_choice',
  'limited_multi_select',
  'agreement_scale',
  'importance_scale',
  'frequency_scale',
  'comfort_range',
  'scenario_choice',
] as const;

export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export const RESPONSE_STATES = [
  'answered',
  'unanswered',
  'skipped',
  'withheld',
  'inapplicable',
  'no_preference',
  'context_dependent',
  'limited_capacity',
  'not_currently_relevant',
] as const;

export type ResponseState = (typeof RESPONSE_STATES)[number];

/** Category lifecycle. Category 1 must be locked. */
export type CategoryStatus = 'locked' | 'draft' | 'preview';

export type AnswerChoiceDefinition = {
  id: string;
  /** Exact user-facing label from Forge HQ. */
  label: string;
  displayOrder: number;
  /** When true, selecting this choice clears/incompatibly combines with others. */
  mutuallyExclusive?: boolean;
  /** When set, selecting this choice represents a special response state. */
  specialResponseState?: ResponseState;
};

/**
 * Two-item unordered priority follow-up.
 * Priorities must be chosen from the user's selected answers for the same question.
 */
export type PriorityFollowUpDefinition = {
  /** Exact follow-up prompt from Forge HQ. */
  prompt: string;
  /** Always 2 for Category 1 lightweight priority follow-ups. */
  selectionCount: 2;
};

export type QuestionDefinition = {
  id: string;
  number: number;
  /** Exact user-facing prompt from Forge HQ. */
  prompt: string;
  /**
   * Optional statement shown with agreement-scale prompts (exact HQ wording).
   * Used when the prompt introduces a statement that follows on its own line.
   */
  statement?: string;
  format: QuestionFormat;
  /** Exact alignment-purpose text from Forge HQ. */
  alignmentPurpose: string;
  minSelections: number;
  maxSelections: number;
  choices: AnswerChoiceDefinition[];
  priorityFollowUp?: PriorityFollowUpDefinition;
};

export type CategoryDefinition = {
  id: string;
  number: number;
  /** Exact category title from Forge HQ (without the "Category N:" prefix). */
  title: string;
  status: CategoryStatus;
  questions: QuestionDefinition[];
  /** Exact locked product decision strings from Forge HQ. */
  lockedProductDecisions: readonly string[];
  /** Final format distribution documentation from Forge HQ. */
  formatDistribution: Readonly<Record<string, readonly number[]>>;
};

export type QuestionnaireCatalog = {
  questionnaireVersion: string;
  specificationVersion: string;
  categories: CategoryDefinition[];
};

export type CatalogValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type CatalogValidationResult =
  | { ok: true; catalog: QuestionnaireCatalog }
  | { ok: false; issues: CatalogValidationIssue[] };
