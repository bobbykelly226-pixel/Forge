/**
 * Compact architecture-coverage manifest for the full ten-category master.
 *
 * Does NOT import Categories 2–10 into the live catalog. Structural metadata for
 * the full Compatibility Profile structure lives in fixtures/master-structure-manifest.json.
 */

import type { ResponseBehavior, ResponseState } from '@/lib/questionnaire/types';
import masterStructureManifest from '@/lib/questionnaire/fixtures/master-structure-manifest.json';

export { getArchitectureCoverageCatalog, ARCHITECTURE_COVERAGE_QUESTIONS } from '@/lib/questionnaire/architecture-coverage-examples';
export {
  getSyntheticCatalogFromManifest,
  getManifestQuestion,
  SYNTHETIC_ELIGIBILITY_DESCRIPTION,
} from '@/lib/questionnaire/synthetic-catalog-from-manifest';
export type {
  ManifestQuestion,
  ManifestSpecialChoice,
} from '@/lib/questionnaire/synthetic-catalog-from-manifest';

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

export const MASTER_STRUCTURE_MANIFEST = masterStructureManifest;

export const MASTER_STRUCTURE_COUNTS = {
  questions: masterStructureManifest.questionCount,
  distinctFormatLabels: MASTER_FORMAT_LABELS.length,
  contextNotes: masterStructureManifest.questions.filter((q) => q.hasContextNote).length,
  implementationNotes: masterStructureManifest.questions.filter((q) => q.hasImplementationNote)
    .length,
  eligibilityRuleAttachments: masterStructureManifest.questions.filter((q) => q.hasEligibility)
    .length,
  uniqueEligibilityDescriptions: 1,
  priorityFollowUps: masterStructureManifest.questions.filter((q) => q.priorityFollowUp).length,
  selectAllThatApply: masterStructureManifest.questions.filter((q) =>
    q.features.includes('select_all')
  ).length,
  conditionalScenarioQuestions: masterStructureManifest.questions.filter(
    (q) => q.isConditionalScenario
  ).length,
  structuredIdentitySelections: masterStructureManifest.questions.filter(
    (q) => q.responseBehavior === 'structured_identity'
  ).length,
} as const;

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
  structuredIdentity: {
    refinement: true,
    userSuppliedIdentity: true,
    publicDisplayControl: true,
    privateMatchingControl: true,
  },
  optionalUnscoredChoiceContext: true,
  typedQualifiers: [
    'no_specific_requirement',
    'limited_openness',
    'evaluation_preference',
    'limited_capacity_contribution',
  ] as const,
  specialResponseStates: [
    'no_preference',
    'context_dependent',
    'current_priority',
    'no_specific_requirement',
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
    responseRowLockForSelectionMutations: true,
    responseIdentityImmutableAfterInsert: true,
  },
} as const;

export const MASTER_ELIGIBILITY_DESCRIPTION =
  'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.';

export function resolveResponseBehavior(formatLabel: string): ResponseBehavior {
  const key = formatLabel.replace(/\*+$/, '').trim() as MasterFormatLabel;
  const behavior = FORMAT_LABEL_TO_BEHAVIOR[key];
  if (!behavior) {
    throw new Error(`No responseBehavior mapping for format label: ${formatLabel}`);
  }
  return behavior;
}
