/**
 * Compatibility Profile questionnaire contracts (Onboarding 2.0 foundation).
 * Catalog-driven; not wired to the live onboarding UI in this slice.
 *
 * Separates reusable response behavior from the exact Forge HQ format label
 * so named scales/ranges do not require a new enum per written label.
 */

/** Reusable response behaviors (UI/storage semantics). */
export const RESPONSE_BEHAVIORS = [
  'single_choice',
  'multi_select',
  'scale_range',
  'scenario_choice',
  'structured_identity',
] as const;

export type ResponseBehavior = (typeof RESPONSE_BEHAVIORS)[number];

/**
 * Response-level states for a question answer.
 * Distinct concepts stay distinct — do not collapse qualifiers into these.
 */
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
  'current_priority',
  'no_specific_requirement',
] as const;

export type ResponseState = (typeof RESPONSE_STATES)[number];

/**
 * Typed response qualifiers that are not approximate aliases of RESPONSE_STATES.
 * Some may coexist with concrete selected choices.
 */
export const RESPONSE_QUALIFIERS = [
  'no_specific_requirement',
  'limited_openness',
  'evaluation_preference',
  'limited_capacity_contribution',
] as const;

export type ResponseQualifier = (typeof RESPONSE_QUALIFIERS)[number];

/** Category lifecycle. Category 1 must be locked in the live catalog. */
export type CategoryStatus = 'locked' | 'draft' | 'preview';

export type OptionalChoiceContextDefinition = {
  kind: 'free_text';
  /** Optional context is never required in V1 coverage examples. */
  required: false;
  /** Context text must remain unscored. */
  scored: false;
};

export type AnswerChoiceDefinition = {
  id: string;
  /** Exact user-facing label from Forge HQ. */
  label: string;
  displayOrder: number;
  /** When true, selecting this choice is incompatible with other selections. */
  mutuallyExclusive?: boolean;
  /** When set, selecting this choice represents a special response state. */
  specialResponseState?: ResponseState;
  /**
   * Distinct qualifier activated by this choice.
   * Must be listed in the question's allowedQualifiers.
   */
  qualifier?: ResponseQualifier;
  /**
   * When true, the qualifier may coexist with ordinary selected choices.
   * When false/omitted with mutuallyExclusive, it replaces other selections.
   */
  qualifierCoexistsWithSelections?: boolean;
  /** Machine-readable flag: selecting this choice may open optional context input. */
  opensOptionalContext?: boolean;
  /** Optional unscored context input associated with this choice. */
  optionalContext?: OptionalChoiceContextDefinition;
};

/**
 * Unordered priority follow-up metadata.
 * Priorities must be chosen from selected answers (subject to eligibility/exclusions).
 */
export type PriorityFollowUpDefinition = {
  /** Exact follow-up prompt from Forge HQ. */
  prompt: string;
  /** Required number of priority selections (Category 1 uses 2). */
  selectionCount: number;
  /** Priority selections are unordered (not a full ranking). */
  unordered: true;
  /**
   * Choice ids eligible for the priority follow-up.
   * When omitted, all non-excluded choices for the question are eligible.
   */
  eligibleChoiceIds?: readonly string[];
  /** Choice ids excluded from the priority follow-up even if selected. */
  excludedChoiceIds?: readonly string[];
  /**
   * Minimum number of eligible selected choices required before the follow-up displays.
   * When omitted, defaults to selectionCount. Must be >= selectionCount.
   */
  minEligibleSelectionsBeforeDisplay?: number;
};

export type EligibilityRuleDefinition = {
  id: string;
  ruleKey: string;
  /** Exact HQ eligibility wording. */
  description: string;
  /**
   * Machine-readable condition reserved for future evaluators.
   * Not executed in this foundation slice.
   */
  condition: {
    type: 'profile_predicate' | 'answer_predicate' | 'always';
    predicateKey?: string;
    params?: Record<string, unknown>;
  };
};

export type ConditionalQuestionDefinition = {
  kind: 'conditional_scenario';
  /** Optional eligibility rule that gates display. */
  requiresEligibilityRuleId?: string;
};

/**
 * Structured identity configuration (configuration-driven; not inferred from labels).
 * Establishes architecture only — does not expose identity publicly.
 */
export type StructuredIdentityDefinition = {
  allowsRefinement: boolean;
  allowsUserSuppliedIdentity: boolean;
  privacy: {
    /** User controls whether the identity appears on a public profile. */
    userControlsPublicDisplay: boolean;
    /**
     * When true, the user independently controls whether the identity may be
     * used privately for matching.
     */
    userControlsPrivateMatchingUse: boolean;
  };
};

export type QuestionDefinition = {
  id: string;
  number: number;
  /** Exact user-facing prompt from Forge HQ. */
  prompt: string;
  /**
   * Optional statement shown with agreement-scale prompts (exact HQ wording).
   */
  statement?: string;
  /** Exact HQ **Format:** label (preserved verbatim). */
  formatLabel: string;
  /** Reusable response behavior derived from the format label. */
  responseBehavior: ResponseBehavior;
  /** Exact HQ context note, when present. */
  contextNote?: string;
  /** Exact HQ implementation note, when present. */
  implementationNote?: string;
  /** Reference into catalog.eligibilityRules. */
  eligibilityRuleId?: string;
  /** Conditional scenario / gated display metadata. */
  conditional?: ConditionalQuestionDefinition;
  /** Structured identity behavior when responseBehavior is structured_identity. */
  structuredIdentity?: StructuredIdentityDefinition;
  /**
   * True for unrestricted “Select all that apply” style questions.
   * maxSelections should be null when select-all.
   */
  selectAllThatApply?: boolean;
  /** Exact alignment-purpose text from Forge HQ. */
  alignmentPurpose: string;
  minSelections: number;
  /** Null means unrestricted upper bound (select-all). */
  maxSelections: number | null;
  choices: AnswerChoiceDefinition[];
  priorityFollowUp?: PriorityFollowUpDefinition;
  /**
   * Special response states this question may record
   * (in addition to ordinary answered/unanswered/skipped/withheld).
   */
  allowedSpecialResponseStates?: readonly ResponseState[];
  /** Qualifiers this question may activate via choices. */
  allowedQualifiers?: readonly ResponseQualifier[];
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
  /** Version-scoped eligibility/display rules referenced by questions. */
  eligibilityRules: EligibilityRuleDefinition[];
};

export type CatalogValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type CatalogValidationResult =
  | { ok: true; catalog: QuestionnaireCatalog }
  | { ok: false; issues: CatalogValidationIssue[] };
