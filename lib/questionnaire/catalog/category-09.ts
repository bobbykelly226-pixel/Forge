import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

export const CATEGORY_09_PARENTING_ELIGIBILITY_ID = 'elig_parenting_role_c09';

export const CATEGORY_09_PARENTING_ELIGIBILITY = {
  id: CATEGORY_09_PARENTING_ELIGIBILITY_ID,
  ruleKey: 'parenting_role_display_c09',
  description:
    'Display only when the user has children, wants or may want children, or is open to a future parenting or stepparenting role.',
  condition: {
    type: 'profile_predicate' as const,
    predicateKey: 'open_to_parenting_or_stepparenting_role',
  },
};

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'service_community_contribution'
);

/**
 * Locked product decisions for Category 9 after the 10 question reduction.
 */
export const CATEGORY_09_LOCKED_PRODUCT_DECISIONS = [
  'Former Q5 was removed because the retained shared service question captures whether a partner must participate or may simply respect the value.',
  'Former Q10 was removed because differences in causes are less important than the broader expectations for shared service and time.',
  'Former Q11 was removed because recognition style provides less compatibility value than the retained questions.',
  'Former Q12 was removed because changes in service capacity are highly contextual and provide limited stable alignment value.',
  'Former Q14 was removed because the importance, shared participation, and serious incompatibility questions already capture workable differences.',
  'Multiselect questions are not fully ranked. Only Q3 and Q10 receive a lightweight “choose the two most important” follow up.',
  'Q9 is gated by parenting eligibility and does not display for users outside that predicate.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_09_FORMAT_DISTRIBUTION = {
  'Importance range': [1],
  'Select all that apply': [2],
  'Select up to four, with a separate current priority state': [3],
  'Importance scale': [4],
  'Shared participation range with separate no preference state': [5],
  'Scenario based choice': [6, 8],
  'Financial coordination range': [7],
  'Conditional scenario based choice': [9],
  'Limited multiselect': [10],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt:
      'How significant a role does service or contribution to others currently play in your life?',
    formatLabel: 'Importance range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'Current participation may be affected by work, finances, disability, health, caregiving, transportation, geography, or another season of life constraint.',
    alignmentPurpose:
      'Measures the present significance of contribution without treating greater participation as evidence of stronger character.',
    choices: buildChoices(1, [
      'A central role. It strongly shapes my identity, priorities, and use of time',
      'A significant role. I regularly contribute and consider service an important responsibility',
      'A meaningful role. I contribute when I can, although it is not central to my identity',
      'An occasional role. I participate when a particular need or opportunity matters to me',
      'A limited role. My current responsibilities leave little capacity for organized service',
      'A minimal role. Service or community involvement is not currently a significant part of my life',
    ]),
  }),
  q({
    number: 2,
    prompt: 'Which forms of service or contribution are currently part of your life?',
    formatLabel: 'Select all that apply',
    responseBehavior: 'multi_select',
    selectAllThatApply: true,
    minSelections: 0,
    maxSelections: null,
    allowedQualifiers: ['limited_capacity_contribution'],
    implementationNote:
      'This is an unrestricted multi select. An unselected form of service does not indicate opposition or lack of concern.',
    alignmentPurpose:
      'Identifies lived forms of contribution rather than relying on a general statement that service matters.',
    choices: buildChoices(
      2,
      [
        'Caring for children, relatives, or other people who depend on me',
        'Helping friends, neighbors, or community members informally',
        'Volunteering through a nonprofit or community organization',
        'Participating in a religious or spiritual community’s service efforts',
        'Mentoring, coaching, tutoring, or supporting someone’s development',
        'Serving through healthcare, education, public safety, social services, or another helping profession',
        'Military, veteran, reserve, or national service involvement',
        'Donating money, supplies, food, or other resources',
        'Organizing fundraisers, drives, or community events',
        'Supporting disaster relief or emergency response',
        'Participating in neighborhood, school, youth, or civic organizations',
        'Supporting animal welfare or environmental projects',
        'Advocacy intended to improve conditions for others',
        'Offering professional skills without charge',
        'Providing transportation, meals, practical help, or companionship',
        'Quiet or private acts of service that are not connected to an organization',
        'I value service but have limited capacity to participate currently',
        'None of these currently apply to me',
        'Another form of contribution',
      ],
      {
        17: {
          qualifier: 'limited_capacity_contribution',
          qualifierCoexistsWithSelections: true,
        },
        18: { mutuallyExclusive: true },
        19: {
          opensOptionalContext: true,
          optionalContext: {
            kind: 'free_text',
            required: false,
            scored: false,
          },
        },
      }
    ),
  }),
  q({
    number: 3,
    prompt: 'What most strongly motivates you to serve or contribute to others?',
    formatLabel: 'Select up to four, with a separate current priority state',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    allowedSpecialResponseStates: ['current_priority'],
    implementationNote:
      '“Service is not currently a major personal priority” is mutually exclusive with the motivation selections and should be stored as a separate response state.\n\n“I contribute without needing one particular motivation” may be selected independently but should not be included in the priority follow up because it does not identify a specific motivation.',
    alignmentPurpose:
      'Identifies the values beneath service choices without judging one motivation as more sincere than another.',
    choices: buildChoices(
      3,
      [
        'Compassion for people experiencing hardship',
        'Responsibility toward family, friends, or neighbors',
        'Religious or spiritual conviction',
        'Gratitude and a desire to give back',
        'Commitment to my country or community',
        'Belief in personal responsibility and mutual support',
        'A desire to improve systems or address injustice',
        'Loyalty to a group, organization, profession, or mission',
        'Personal experience with a similar need',
        'A desire to use my skills or resources meaningfully',
        'The example or tradition established by my family',
        'A sense of purpose, fulfillment, or connection',
        'Responding to immediate needs when I encounter them',
        'I contribute without needing one particular motivation',
        'Service is not currently a major personal priority',
      ],
      {
        15: {
          mutuallyExclusive: true,
          specialResponseState: 'current_priority',
        },
      }
    ),
    priorityFollowUp: {
      prompt:
        'Of the specific motivations you selected, which two most strongly shape the kind of contribution you consider meaningful?',
      selectionCount: 2,
      unordered: true,
      excludedChoiceIds: [
        'service_community_contribution_q03_c14',
        'service_community_contribution_q03_c15',
      ],
      minEligibleSelectionsBeforeDisplay: 2,
    },
  }),
  q({
    number: 4,
    prompt:
      'How important is it that a long term partner personally values service or contribution?',
    formatLabel: 'Importance scale',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'Valuing service does not necessarily require organized volunteering, public involvement, financial giving, or a service oriented profession.',
    alignmentPurpose:
      'Measures the importance of shared commitment to contribution separately from the respondent’s current level of participation.',
    choices: buildChoices(4, [
      'Essential. I need service or contribution to be a meaningful shared value',
      'Very important. I strongly prefer a partner who actively demonstrates this value',
      'Important. The value should be present, although our forms of contribution may differ',
      'Somewhat important. I appreciate it, but it does not need to be a defining shared value',
      'Not especially important. A partner may contribute differently or prioritize other responsibilities',
      'Not important. Service does not need to be a relationship consideration for me',
    ]),
  }),
  q({
    number: 5,
    prompt:
      'What level of shared service would you ideally want within a long term relationship?',
    formatLabel: 'Shared participation range with separate no preference state',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    allowedSpecialResponseStates: ['no_preference'],
    implementationNote:
      '“No particular preference” is not part of the ordered shared participation range and should be stored as a separate response state.',
    alignmentPurpose:
      'Measures whether service is expected to become a shared relationship practice, an independent pursuit, or a limited commitment.',
    choices: buildChoices(
      5,
      [
        'Service should be a major shared commitment that we regularly pursue together',
        'I would want us to participate together in meaningful service on a regular basis',
        'I would enjoy occasional shared service while also supporting separate interests',
        'I mainly want mutual support for each person’s individual forms of contribution',
        'Service can remain largely individual and does not need to become a couple activity',
        'I would prefer service commitments to remain limited so they do not compete with the relationship',
        'No particular preference. The appropriate level can develop according to our circumstances',
      ],
      {
        7: { specialResponseState: 'no_preference' },
      }
    ),
  }),
  q({
    number: 6,
    prompt:
      'How should a couple decide how much time to devote to service outside the household?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'Several principles may matter simultaneously. The selected answer identifies the principle that should carry the greatest influence when competing responsibilities must be balanced.',
    alignmentPurpose:
      'Measures expectations concerning time, autonomy, shared decision making, dependability, and responsibility to the household.',
    choices: buildChoices(6, [
      'Maintain a regular commitment because service should remain a protected priority',
      'Agree on a sustainable amount of time that respects both partners’ responsibilities',
      'Allow each partner substantial independence in managing their service commitments',
      'Reevaluate commitments whenever work, caregiving, health, or household needs change',
      'Prioritize the relationship and household before accepting significant outside obligations',
      'Participate mainly when a specific need is especially important to one or both partners',
      'Keep outside commitments limited unless both partners agree to a greater investment',
    ]),
  }),
  q({
    number: 7,
    prompt:
      'How should charitable giving or financial support for others be handled within a committed relationship?',
    formatLabel: 'Financial coordination range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    allowedSpecialResponseStates: ['context_dependent'],
    contextNote:
      'This question concerns coordination of generosity within the relationship. It does not evaluate income, wealth, charitable amount, or willingness to provide financial help in an emergency.',
    implementationNote:
      '“No fixed approach” should be stored separately from the ordered financial coordination range.',
    alignmentPurpose:
      'Measures expectations concerning generosity, financial autonomy, shared budgeting, household security, and joint decision making.',
    choices: buildChoices(
      7,
      [
        'Charitable giving should be a planned and meaningful part of the shared budget',
        'The couple should establish shared priorities and agree on a general giving amount',
        'Partners should discuss substantial contributions while retaining some individual freedom',
        'Each partner should control charitable giving from their own discretionary money',
        'Giving should occur mainly when the household is financially secure enough to support it',
        'Financial contributions should remain limited because the household’s obligations come first',
        'No fixed approach. The decision should depend on finances, need, and circumstances',
      ],
      {
        7: { specialResponseState: 'context_dependent' },
      }
    ),
  }),
  q({
    number: 8,
    prompt:
      'If one partner felt strongly called to make a major service commitment, which principle should most strongly guide the decision?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    statement:
      'Examples could include disaster response deployment, military or reserve duty, extensive caregiving, a demanding volunteer leadership role, mission work, or prolonged community service.',
    contextNote:
      'Supporting service does not require accepting every level of risk, absence, financial cost, or transferred responsibility.',
    alignmentPurpose:
      'Examines how someone balances purpose, sacrifice, partnership, fairness, autonomy, and practical consequences.',
    choices: buildChoices(8, [
      'Strongly support the commitment because meaningful service may require substantial sacrifice',
      'Support it when the couple has openly considered the effect on both partners',
      'Modify the commitment so service and relationship responsibilities remain sustainable',
      'Proceed only after the couple agrees on time, finances, safety, and household responsibilities',
      'Delay the commitment when the relationship or household is already under significant strain',
      'Decline or substantially limit the commitment if it would repeatedly leave the other partner carrying an unfair burden',
      'Recognize that an unresolved difference about the commitment may reveal a deeper incompatibility',
    ]),
  }),
  q({
    number: 9,
    prompt:
      'If children were part of the relationship, how should service and contribution primarily be approached in their upbringing?',
    formatLabel: 'Conditional scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    eligibilityRuleId: CATEGORY_09_PARENTING_ELIGIBILITY_ID,
    conditional: {
      kind: 'conditional_scenario',
      requiresEligibilityRuleId: CATEGORY_09_PARENTING_ELIGIBILITY_ID,
    },
    contextNote:
      'Children should not be used to improve a parent’s public image, pressured into unsafe or developmentally inappropriate service, or taught that their worth depends on sacrifice. Parents should substantially agree on age appropriate expectations.',
    alignmentPurpose:
      'Identifies expectations for family modeling, responsibility, community exposure, generosity, participation, and a child’s developing autonomy.',
    choices: buildChoices(9, [
      'Make regular family service an established part of household life',
      'Teach responsibility to others while choosing activities appropriate to each child’s age and ability',
      'Expose children to different forms of service and allow their interests to develop',
      'Model generosity and contribution without requiring formal participation',
      'Focus first on responsibility within the family and gradually expand into the community',
      'Encourage individual acts of kindness and practical help in everyday life',
      'Allow children to decide how involved they want to become as they mature',
      'Discuss service as a family value without tying it to praise, punishment, or loyalty',
    ]),
  }),
  q({
    number: 10,
    prompt:
      'Which service related differences would most seriously threaten long term compatibility?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies essential boundaries and high impact incompatibilities without judging the respondent’s current participation or preferred causes.',
    choices: buildChoices(10, [
      'Expecting me to abandon service commitments that remain reasonable and sustainable',
      'Making major commitments without discussing their effect on the relationship',
      'Repeatedly leaving household or caregiving responsibilities to me without agreement',
      'Giving away shared money or resources without appropriate consent',
      'Expecting participation in causes, organizations, or missions I do not support',
      'Disrespecting the people or communities I feel responsible for helping',
      'Treating one form of service as morally superior to every other form',
      'Using service to seek control, admiration, status, or public praise at the household’s expense',
      'Promising help repeatedly and failing to follow through',
      'Pressuring children into inappropriate, unsafe, or unwanted participation',
      'Allowing an organization, leader, cause, or community to control relationship decisions',
      'Service commitments that create unacceptable financial, physical, legal, or emotional risk',
      'Refusing reasonable adjustments when health, finances, caregiving, or household needs change',
      'Using service, patriotism, faith, generosity, or sacrifice to shame or manipulate a partner',
      'Fundamental differences about responsibility to family, community, country, or people in need',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the differences you selected, which two would be most difficult for you to move past?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_09: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 9,
  title: 'Service, Community & Contribution',
  status: 'locked',
  lockedProductDecisions: CATEGORY_09_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_09_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
