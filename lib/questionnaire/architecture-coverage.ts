/**
 * Compact architecture-coverage manifest for the full ten-category master.
 *
 * Does NOT import Categories 2–10 into the live catalog. Demonstrates that every
 * structural feature used in the authoritative master can be represented by the
 * foundation contracts without redesigning enums per written format label.
 *
 * Source: Forge Compatibility Profile — 150 Final Locked Questions.
 */

import type { ResponseBehavior, ResponseState } from '@/lib/questionnaire/types';

/** Exact HQ format labels observed in the master (trailing markdown asterisks normalized). */
export const MASTER_FORMAT_LABELS = [
  'Agreement scale',
  'Autonomy range',
  'Comfort range',
  'Community-involvement range',
  'Conditional scenario-based choice',
  'Directness scale',
  'Discussion-frequency range with separate no-preference response',
  'Family-involvement range',
  'Financial-coordination range',
  'Flexibility range',
  'Frequency range',
  'Frequency scale',
  'Household-media range',
  'Importance range',
  'Importance scale',
  'Independence range',
  'Participation range',
  'Privacy-boundary range',
  'Reassurance-and-access range',
  'Role range',
  'Scenario-based choice',
  'Select all that apply',
  'Select up to five',
  'Select up to four',
  'Select up to four, with a separate current-priority state',
  'Select up to three',
  'Shared-participation range with separate no-preference state',
  'Single choice',
  'Structured identity selection',
  'Support range',
  'Transparency range with a separate context-dependent state',
  'Trust-repair posture with a separate context-dependent state',
  'Visibility-preference range',
] as const;

export type MasterFormatLabel = (typeof MASTER_FORMAT_LABELS)[number];

/** Map each exact HQ format label to a reusable response behavior. */
export const FORMAT_LABEL_TO_BEHAVIOR: Readonly<Record<MasterFormatLabel, ResponseBehavior>> = {
  'Single choice': 'single_choice',
  'Select up to three': 'multi_select',
  'Select up to four': 'multi_select',
  'Select up to four, with a separate current-priority state': 'multi_select',
  'Select up to five': 'multi_select',
  'Select all that apply': 'multi_select',
  'Agreement scale': 'scale_range',
  'Importance scale': 'scale_range',
  'Importance range': 'scale_range',
  'Frequency scale': 'scale_range',
  'Frequency range': 'scale_range',
  'Comfort range': 'scale_range',
  'Flexibility range': 'scale_range',
  'Support range': 'scale_range',
  'Independence range': 'scale_range',
  'Family-involvement range': 'scale_range',
  'Role range': 'scale_range',
  'Participation range': 'scale_range',
  'Community-involvement range': 'scale_range',
  'Discussion-frequency range with separate no-preference response': 'scale_range',
  'Autonomy range': 'scale_range',
  'Household-media range': 'scale_range',
  'Shared-participation range with separate no-preference state': 'scale_range',
  'Financial-coordination range': 'scale_range',
  'Visibility-preference range': 'scale_range',
  'Transparency range with a separate context-dependent state': 'scale_range',
  'Privacy-boundary range': 'scale_range',
  'Trust-repair posture with a separate context-dependent state': 'scale_range',
  'Reassurance-and-access range': 'scale_range',
  'Directness scale': 'scale_range',
  'Scenario-based choice': 'scenario_choice',
  'Conditional scenario-based choice': 'scenario_choice',
  'Structured identity selection': 'structured_identity',
};

/** Structural feature counts observed across the ten-category master. */
export const MASTER_STRUCTURE_COUNTS = {
  questions: 150,
  distinctFormatLabels: MASTER_FORMAT_LABELS.length,
  contextNotes: 31,
  implementationNotes: 18,
  /** Three question-level eligibility attachments (identical HQ wording). */
  eligibilityRuleAttachments: 3,
  uniqueEligibilityDescriptions: 1,
  priorityFollowUps: 38,
  selectAllThatApply: 9,
  conditionalScenarioQuestions: 4,
  structuredIdentitySelections: 2,
} as const;

/**
 * Structural capabilities the foundation must represent for Categories 2–10
 * without importing those categories into the live catalog yet.
 */
export const FOUNDATION_CAPABILITY_MANIFEST = {
  responseBehaviors: [
    'single_choice',
    'multi_select',
    'scale_range',
    'scenario_choice',
    'structured_identity',
  ] as const satisfies readonly ResponseBehavior[],
  exactFormatLabelPreservedSeparately: true,
  contextNotes: true,
  implementationNotes: true,
  eligibilityRulesInCatalog: true,
  conditionalScenarioQuestions: true,
  selectAllThatApply: true,
  mutuallyExclusiveChoices: true,
  specialResponseStates: [
    'no_preference',
    'context_dependent',
    'current_priority',
    'limited_capacity',
    'not_currently_relevant',
    'inapplicable',
    'withheld',
    'skipped',
    'unanswered',
    'answered',
  ] as const satisfies readonly ResponseState[],
  priorityFollowUps: {
    exactPrompt: true,
    requiredCount: true,
    eligibleChoiceSubset: true,
    excludedChoices: true,
    minEligibleSelectionsBeforeDisplay: true,
    unorderedSelections: true,
  },
  databaseIntegrity: {
    maxSelectedChoiceCount: true,
    mutuallyExclusiveChoices: true,
    progressCurrentCategorySameVersion: true,
    selectedChoiceMatchesQuestion: true,
    prioritySubsetOfSelected: true,
    responseMatchesProgressVersion: true,
  },
} as const;

/** Exact eligibility wording used three times in the master (Categories 6+). */
export const MASTER_ELIGIBILITY_DESCRIPTION =
  'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.';

/**
 * Illustrative (non-imported) question shapes proving Categories 2–10 structures fit.
 * Wording snippets are abbreviated markers only — not live catalog content.
 */
export const ARCHITECTURE_COVERAGE_EXAMPLES = [
  {
    id: 'coverage_select_all',
    formatLabel: 'Select all that apply',
    responseBehavior: 'multi_select' as const,
    selectAllThatApply: true,
    maxSelections: null,
    features: ['select_all', 'implementation_note'],
  },
  {
    id: 'coverage_structured_identity',
    formatLabel: 'Structured identity selection',
    responseBehavior: 'structured_identity' as const,
    maxSelections: 1,
    features: ['structured_identity'],
  },
  {
    id: 'coverage_named_scale',
    formatLabel: 'Directness scale',
    responseBehavior: 'scale_range' as const,
    maxSelections: 1,
    features: ['named_scale_via_format_label'],
  },
  {
    id: 'coverage_range_with_no_preference',
    formatLabel: 'Discussion-frequency range with separate no-preference response',
    responseBehavior: 'scale_range' as const,
    maxSelections: 1,
    allowedSpecialResponseStates: ['no_preference'] as const,
    features: ['separate_no_preference_state'],
  },
  {
    id: 'coverage_range_with_context_dependent',
    formatLabel: 'Transparency range with a separate context-dependent state',
    responseBehavior: 'scale_range' as const,
    maxSelections: 1,
    allowedSpecialResponseStates: ['context_dependent'] as const,
    features: ['separate_context_dependent_state'],
  },
  {
    id: 'coverage_current_priority_state',
    formatLabel: 'Select up to four, with a separate current-priority state',
    responseBehavior: 'multi_select' as const,
    maxSelections: 4,
    allowedSpecialResponseStates: ['current_priority'] as const,
    features: ['current_priority_state'],
  },
  {
    id: 'coverage_conditional_scenario',
    formatLabel: 'Conditional scenario-based choice',
    responseBehavior: 'scenario_choice' as const,
    maxSelections: 1,
    conditional: { kind: 'conditional_scenario' as const },
    eligibility: true,
    features: ['conditional_scenario', 'eligibility_rule'],
  },
  {
    id: 'coverage_priority_with_exclusions',
    formatLabel: 'Select all that apply',
    responseBehavior: 'multi_select' as const,
    selectAllThatApply: true,
    maxSelections: null,
    priorityFollowUp: {
      selectionCount: 2,
      unordered: true as const,
      excludedChoiceIds: ['coverage_priority_with_exclusions_c_exclusive'],
      minEligibleSelectionsBeforeDisplay: 2,
    },
    features: [
      'priority_excluded_choices',
      'priority_min_eligible_before_display',
      'mutually_exclusive_choice',
    ],
  },
] as const;

export function resolveResponseBehavior(formatLabel: string): ResponseBehavior {
  const key = formatLabel.replace(/\*+$/, '').trim() as MasterFormatLabel;
  const behavior = FORMAT_LABEL_TO_BEHAVIOR[key];
  if (!behavior) {
    throw new Error(`No responseBehavior mapping for format label: ${formatLabel}`);
  }
  return behavior;
}
