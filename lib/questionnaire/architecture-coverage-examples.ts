/**
 * Complete, strongly typed architecture-coverage definitions.
 *
 * These are NOT imported into the live Compatibility Profile catalog.
 * They prove Categories 2–10 structural features validate against the real contracts.
 */

import type {
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionnaireCatalog,
  QuestionDefinition,
} from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

function choices(
  prefix: string,
  labels: readonly string[],
  extras: Readonly<
    Record<
      number,
      Partial<QuestionDefinition['choices'][number]>
    >
  > = {}
): QuestionDefinition['choices'] {
  return labels.map((label, index) => {
    const displayOrder = index + 1;
    return {
      id: `${prefix}_c${String(displayOrder).padStart(2, '0')}`,
      label,
      displayOrder,
      ...extras[displayOrder],
    };
  });
}

function q(
  prefix: string,
  def: Omit<QuestionDefinition, 'id' | 'choices'> & {
    choices: QuestionDefinition['choices'];
  }
): QuestionDefinition {
  return { ...def, id: prefix };
}

/** Exact HQ eligibility wording used three times in the master. */
export const COVERAGE_ELIGIBILITY_RULES: EligibilityRuleDefinition[] = [
  {
    id: 'elig_parenting_role_a',
    ruleKey: 'parenting_role_display_a',
    description:
      'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.',
    condition: {
      type: 'profile_predicate',
      predicateKey: 'open_to_parenting_or_stepparenting_role',
    },
  },
  {
    id: 'elig_parenting_role_b',
    ruleKey: 'parenting_role_display_b',
    description:
      'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.',
    condition: {
      type: 'profile_predicate',
      predicateKey: 'open_to_parenting_or_stepparenting_role',
    },
  },
  {
    id: 'elig_parenting_role_c',
    ruleKey: 'parenting_role_display_c',
    description:
      'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.',
    condition: {
      type: 'profile_predicate',
      predicateKey: 'open_to_parenting_or_stepparenting_role',
    },
  },
];

const STRUCTURED_IDENTITY_FAITH = q('coverage_c07_q02', {
  number: 1,
  prompt:
    'Which religious, spiritual, or nonreligious tradition most closely reflects your current identity?',
  formatLabel: 'Structured identity selection',
  responseBehavior: 'structured_identity',
  structuredIdentity: {
    allowsRefinement: true,
    allowsUserSuppliedIdentity: true,
    privacy: {
      userControlsPublicDisplay: true,
      userControlsPrivateMatchingUse: false,
    },
  },
  alignmentPurpose:
    'Records self-identified belief tradition without assuming that a label reveals practice, doctrine, values, or relationship expectations.',
  minSelections: 1,
  maxSelections: 1,
  choices: choices('coverage_c07_q02', [
    'Christianity',
    'Judaism',
    'Islam',
    'Hinduism',
    'Buddhism',
    'Sikhism',
    'Baháʼí Faith',
    'Indigenous or traditional spirituality',
    'Pagan, earth-centered, or nature-based spirituality',
    'Unitarian Universalism',
    'Spiritual but not religious',
    'Agnostic',
    'Atheist',
    'Secular humanist',
    'No particular tradition',
    'Exploring or questioning',
    'Another religious, spiritual, or nonreligious tradition',
    'Prefer not to identify',
  ]),
});

const STRUCTURED_IDENTITY_POLITICS = q('coverage_c08_q02', {
  number: 1,
  prompt: 'How would you describe your current political identity?',
  formatLabel: 'Structured identity selection',
  responseBehavior: 'structured_identity',
  structuredIdentity: {
    allowsRefinement: true,
    allowsUserSuppliedIdentity: true,
    privacy: {
      userControlsPublicDisplay: true,
      userControlsPrivateMatchingUse: true,
    },
  },
  alignmentPurpose:
    'Records self-identified political orientation without assuming that the label reveals the respondent’s specific beliefs, values, voting behavior, or relationship expectations.',
  minSelections: 1,
  maxSelections: 1,
  choices: choices('coverage_c08_q02', [
    'Progressive',
    'Liberal',
    'Moderate',
    'Centrist',
    'Conservative',
    'Libertarian',
    'Independent',
    'Politically mixed',
    'Politically unaffiliated',
    'Apolitical',
    'Exploring or uncertain',
    'Another political identity',
    'Prefer not to identify',
  ]),
});

const SERVICE_FORMS_WITH_OPTIONAL_CONTEXT = q('coverage_c09_q02', {
  number: 1,
  prompt: 'Which forms of service or contribution are currently part of your life?',
  formatLabel: 'Select all that apply',
  responseBehavior: 'multi_select',
  selectAllThatApply: true,
  implementationNote:
    'This is an unrestricted multi-select. An unselected form of service does not indicate opposition or lack of concern.',
  alignmentPurpose:
    'Identifies lived forms of contribution rather than relying on a general statement that service matters.',
  minSelections: 0,
  maxSelections: null,
  allowedQualifiers: ['limited_capacity_contribution'],
  choices: choices(
    'coverage_c09_q02',
    [
      'Caring for children, relatives, or other people who depend on me',
      'Helping friends, neighbors, or community members informally',
      'Volunteering through a nonprofit or community organization',
      'I value service but have limited capacity to participate currently',
      'None of these currently apply to me',
      'Another form of contribution',
    ],
    {
      4: {
        qualifier: 'limited_capacity_contribution',
        qualifierCoexistsWithSelections: true,
      },
      5: {
        mutuallyExclusive: true,
      },
      6: {
        opensOptionalContext: true,
        optionalContext: {
          kind: 'free_text',
          required: false,
          scored: false,
        },
      },
    }
  ),
});

const PARTNER_SUPPORT_NO_SPECIFIC_REQUIREMENT = q('coverage_c09_q05', {
  number: 1,
  prompt: 'Which forms of contribution would you most want a partner to respect or support?',
  formatLabel: 'Select up to five',
  responseBehavior: 'multi_select',
  alignmentPurpose:
    'Distinguishes respect for a partner’s contribution from requiring identical participation.',
  minSelections: 1,
  maxSelections: 5,
  allowedSpecialResponseStates: ['no_specific_requirement'],
  allowedQualifiers: ['no_specific_requirement'],
  choices: choices(
    'coverage_c09_q05',
    [
      'Caregiving for children, relatives, or dependents',
      'Informal help for friends, neighbors, or community members',
      'Volunteering through an organization',
      'Religious or spiritually motivated service',
      'Military, veteran, or national-service commitments',
      'I do not require support for a particular form of contribution',
    ],
    {
      6: {
        mutuallyExclusive: true,
        specialResponseState: 'no_specific_requirement',
        qualifier: 'no_specific_requirement',
        qualifierCoexistsWithSelections: false,
      },
    }
  ),
  priorityFollowUp: {
    prompt:
      'Of the forms you selected, which two would be most important for a partner to respect even if they did not participate personally?',
    selectionCount: 2,
    unordered: true,
    excludedChoiceIds: ['coverage_c09_q05_c06'],
    minEligibleSelectionsBeforeDisplay: 2,
  },
});

const INTEGRITY_QUALIFIERS = q('coverage_c10_q14', {
  number: 1,
  prompt: 'Which integrity-related differences could you genuinely accept in a long-term partner?',
  formatLabel: 'Select all that apply',
  responseBehavior: 'multi_select',
  selectAllThatApply: true,
  implementationNote:
    'This is an unrestricted multi-select. Limited-openness and evaluation-preference are distinct architecture-only qualifiers that may coexist with concrete accepted differences.',
  alignmentPurpose:
    'Records genuine openness to differences in privacy, disclosure, repair, and moral reasoning without implying acceptance of deception, coercion, or unsafe conduct.',
  minSelections: 0,
  maxSelections: null,
  allowedQualifiers: ['limited_openness', 'evaluation_preference'],
  choices: choices(
    'coverage_c10_q14',
    [
      'Different levels of general openness',
      'Different needs for personal privacy',
      'Different timing when discussing sensitive information',
      'Different preferences about sharing passwords or device access',
      'Different comfort levels with seeking outside advice',
      'Different definitions of minor or harmless omissions',
      'Different approaches to forgiveness',
      'Different timelines for rebuilding trust',
      'Different expectations about public versus private relationship information',
      'Different moral, cultural, religious, or personal frameworks',
      'A partner who needs time before discussing a mistake',
      'A partner whose capacity affects organization or follow-through',
      'A past mistake that has been honestly disclosed and meaningfully addressed',
      'Differences that do not compromise informed consent, safety, or essential trust',
      // Architecture-only qualifier choices (master defines these outside the listed difference set).
      'I need substantial agreement and have limited openness to integrity-related differences',
      'Integrity is best evaluated through the relationship rather than predetermined compatibility rules',
    ],
    {
      15: {
        qualifier: 'limited_openness',
        qualifierCoexistsWithSelections: true,
      },
      16: {
        qualifier: 'evaluation_preference',
        qualifierCoexistsWithSelections: true,
      },
    }
  ),
});

const CONDITIONAL_SCENARIO = q('coverage_conditional_scenario', {
  number: 1,
  prompt: 'How would you prefer to raise children regarding religious or spiritual tradition?',
  formatLabel: 'Conditional scenario-based choice',
  responseBehavior: 'scenario_choice',
  eligibilityRuleId: 'elig_parenting_role_a',
  conditional: {
    kind: 'conditional_scenario',
    requiresEligibilityRuleId: 'elig_parenting_role_a',
  },
  alignmentPurpose:
    'Conditional parenting scenario gated by eligibility; architecture coverage only.',
  minSelections: 1,
  maxSelections: 1,
  choices: choices('coverage_conditional_scenario', [
    'Raise them primarily within one shared religious or spiritual tradition',
    'Raise them primarily within one tradition while respectfully teaching them about other beliefs',
    'Include meaningful participation in both partners’ traditions',
    'Provide broad exposure without requiring a shared tradition',
  ]),
});

const NAMED_SCALE = q('coverage_directness_scale', {
  number: 1,
  prompt: 'How direct do you prefer communication to be in a relationship?',
  formatLabel: 'Directness scale',
  responseBehavior: 'scale_range',
  alignmentPurpose: 'Named scale via exact format label; architecture coverage only.',
  minSelections: 1,
  maxSelections: 1,
  choices: choices('coverage_directness_scale', [
    'Very indirect',
    'Somewhat indirect',
    'Balanced',
    'Somewhat direct',
    'Very direct',
  ]),
});

const NO_PREFERENCE_RANGE = q('coverage_no_preference_range', {
  number: 1,
  prompt: 'How often should partners discuss political or civic topics?',
  formatLabel: 'Discussion-frequency range with separate no-preference response',
  responseBehavior: 'scale_range',
  allowedSpecialResponseStates: ['no_preference'],
  alignmentPurpose: 'Separate no-preference state; architecture coverage only.',
  minSelections: 1,
  maxSelections: 1,
  choices: choices(
    'coverage_no_preference_range',
    ['Rarely', 'Occasionally', 'Regularly', 'Very often', 'No particular preference'],
    {
      5: { specialResponseState: 'no_preference' },
    }
  ),
});

const CURRENT_PRIORITY_MULTI = q('coverage_current_priority', {
  number: 1,
  prompt: 'Which areas are most important in your life right now?',
  formatLabel: 'Select up to four, with a separate current-priority state',
  responseBehavior: 'multi_select',
  allowedSpecialResponseStates: ['current_priority'],
  alignmentPurpose: 'Current-priority state; architecture coverage only.',
  minSelections: 1,
  maxSelections: 4,
  choices: choices(
    'coverage_current_priority',
    ['Family', 'Work', 'Health', 'Faith', 'Community', 'My priorities are currently shifting'],
    {
      6: { specialResponseState: 'current_priority', mutuallyExclusive: true },
    }
  ),
});

function coverageCategory(
  number: number,
  id: string,
  title: string,
  questions: QuestionDefinition[]
): CategoryDefinition {
  return {
    id,
    number,
    title,
    status: 'locked',
    lockedProductDecisions: [],
    formatDistribution: {},
    questions,
  };
}

/**
 * Synthetic coverage catalog used only by architecture tests.
 * Not returned by getQuestionnaireCatalog().
 */
export function getArchitectureCoverageCatalog(): QuestionnaireCatalog {
  return assertValidQuestionnaireCatalog({
    questionnaireVersion: 'architecture_coverage_v1',
    specificationVersion: 'compatibility_profile_categories_1_7_v10',
    eligibilityRules: COVERAGE_ELIGIBILITY_RULES,
    categories: [
      coverageCategory(90, 'coverage_structured_identity_faith', 'Coverage — Structured Identity Faith', [
        STRUCTURED_IDENTITY_FAITH,
      ]),
      coverageCategory(91, 'coverage_structured_identity_politics', 'Coverage — Structured Identity Politics', [
        STRUCTURED_IDENTITY_POLITICS,
      ]),
      coverageCategory(92, 'coverage_service_optional_context', 'Coverage — Optional Choice Context', [
        SERVICE_FORMS_WITH_OPTIONAL_CONTEXT,
      ]),
      coverageCategory(93, 'coverage_no_specific_requirement', 'Coverage — No Specific Requirement', [
        PARTNER_SUPPORT_NO_SPECIFIC_REQUIREMENT,
      ]),
      coverageCategory(94, 'coverage_integrity_qualifiers', 'Coverage — Integrity Qualifiers', [
        INTEGRITY_QUALIFIERS,
      ]),
      coverageCategory(95, 'coverage_conditional_and_scales', 'Coverage — Conditional And Scales', [
        CONDITIONAL_SCENARIO,
        { ...NAMED_SCALE, number: 2, id: 'coverage_directness_scale' },
        { ...NO_PREFERENCE_RANGE, number: 3, id: 'coverage_no_preference_range' },
        { ...CURRENT_PRIORITY_MULTI, number: 4, id: 'coverage_current_priority' },
      ]),
    ],
  });
}

export const ARCHITECTURE_COVERAGE_QUESTIONS = {
  structuredIdentityFaith: STRUCTURED_IDENTITY_FAITH,
  structuredIdentityPolitics: STRUCTURED_IDENTITY_POLITICS,
  serviceOptionalContext: SERVICE_FORMS_WITH_OPTIONAL_CONTEXT,
  noSpecificRequirement: PARTNER_SUPPORT_NO_SPECIFIC_REQUIREMENT,
  integrityQualifiers: INTEGRITY_QUALIFIERS,
  conditionalScenario: CONDITIONAL_SCENARIO,
  namedScale: NAMED_SCALE,
  noPreferenceRange: NO_PREFERENCE_RANGE,
  currentPriority: CURRENT_PRIORITY_MULTI,
} as const;
