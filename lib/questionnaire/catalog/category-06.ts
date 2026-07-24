import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'family_children_parenting'
);

/**
 * Locked product decisions for Category 6 after the 10 question reduction.
 * Categories 8 through 10 remain at fifteen questions until the final group.
 */
export const CATEGORY_06_LOCKED_PRODUCT_DECISIONS = [
  'Holiday division and narrower extended family contact questions were removed in favor of broader role, boundary, and caregiving questions.',
  'Multiselect questions are not fully ranked. Only Q2 and Q10 receive a lightweight “choose the two most important” follow up.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_06_FORMAT_DISTRIBUTION = {
  'Single choice': [6, 7],
  'Limited multiselect': [2, 10],
  'Select all that apply': [4],
  'Family involvement range': [1],
  'Support range': [3],
  'Role range': [9],
  'Scenario based choice': [5, 8],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt:
      'What role would you ideally like extended family to have in your long term relationship?',
    formatLabel: 'Family involvement range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures expectations for family closeness, couple autonomy, and extended family involvement.',
    choices: buildChoices(1, [
      'A very active role, with frequent contact and substantial involvement in everyday life',
      'A close role, with regular contact and involvement in important parts of our lives',
      'A balanced role, with meaningful connection and clear independence as a couple',
      'A more limited role, primarily centered on important events and occasional time together',
      'A minimal role, with the couple maintaining a largely private and independent life',
    ]),
  }),
  q({
    number: 2,
    prompt:
      'Which boundaries with extended family are most important in a committed relationship?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies essential boundaries involving privacy, respect, money, time, parenting, and couple autonomy.',
    choices: buildChoices(2, [
      'Private relationship matters are not shared without agreement',
      'Family members do not make decisions for the couple',
      'Visits and access to the home are discussed beforehand',
      'Financial help or obligations are agreed upon together',
      'Family members treat both partners respectfully',
      "Parenting decisions remain with the child's parent or caregivers",
      'Neither partner is pressured to tolerate harmful behavior because "they are family"',
      'Time with extended family does not consistently displace the relationship',
      'Family members do not undermine one partner to the other',
      'Each person may maintain reasonable boundaries with their own family',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the boundaries you selected, which two allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 3,
    prompt:
      'If a close family member needs substantial long term help, what level of responsibility should the couple generally assume?',
    formatLabel: 'Support range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'The appropriate level of support may depend on the family relationship, seriousness and duration of the need, available resources, other potential caregivers, and the effect on the couple or household.',
    alignmentPurpose:
      'Measures expectations surrounding family duty, caregiving, financial responsibility, shared decision making, and relational boundaries.',
    choices: buildChoices(3, [
      'Provide as much direct support as reasonably possible, even if it requires significant sacrifice',
      "Provide substantial support while protecting the couple's essential responsibilities",
      'Share meaningful support with other relatives and appropriate community or professional resources',
      'Offer limited practical or financial help within clearly agreed boundaries',
      'Each partner should remain primarily responsible for deciding what support to provide their own family',
    ]),
  }),
  q({
    number: 4,
    prompt: 'Which paths to building or expanding a family would you genuinely consider?',
    formatLabel: 'Select all that apply',
    responseBehavior: 'multi_select',
    selectAllThatApply: true,
    minSelections: 0,
    maxSelections: null,
    alignmentPurpose:
      'Identifies meaningful openness and limitations surrounding family formation without treating every pathway as interchangeable.',
    choices: buildChoices(4, [
      'Having biological children',
      'Adoption',
      'Foster parenting',
      'Becoming a stepparent',
      'Using fertility treatment or assisted reproduction',
      'Using donor eggs, donor sperm, or embryos',
      'Surrogacy',
      "Parenting a relative's child if circumstances required it",
      'I already have the number of children I want',
      'I am uncertain and would need to explore the options with a partner',
    ]),
  }),
  q({
    number: 5,
    prompt:
      'If biological children became difficult or impossible to have, how would you want the couple to proceed?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Surfaces potentially life defining expectations involving infertility, alternative family building paths, and non negotiable parenting goals.',
    choices: buildChoices(5, [
      'Pursue reasonable medical evaluation or fertility treatment',
      'Explore adoption or fostering',
      'Consider multiple paths before making a decision',
      'Accept a life together without additional children',
      "Reevaluate whether the relationship can meet both people's essential family goals",
      'I am not yet sure how I would respond',
    ]),
  }),
  q({
    number: 6,
    prompt: 'How should parenting responsibilities generally be divided?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Identifies expectations for equality, roles, flexibility, and fairness in parenting labor.',
    choices: buildChoices(6, [
      'As equally as possible across most responsibilities',
      "According to each parent's strengths and abilities",
      'According to work schedules, availability, and current circumstances',
      'Through clearly defined roles that both partners willingly accept',
      'Flexibly, with each parent stepping in wherever needed',
      'The exact division matters less than both people believing it is fair and sustainable',
    ]),
  }),
  q({
    number: 7,
    prompt:
      'Which principle should most strongly guide discipline and behavioral expectations for children?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      "Identifies the user's leading parenting principle without reducing parenting philosophy to a simplistic strict versus permissive scale.",
    choices: buildChoices(7, [
      'Clear rules and consistent consequences',
      'Teaching children to understand how their behavior affects others',
      "Adjusting expectations to the child's age, temperament, and needs",
      'Protecting the parent child relationship while correcting behavior',
      'Parents presenting a consistent approach whenever possible',
      'Using structure while remaining willing to reconsider an ineffective response',
    ]),
  }),
  q({
    number: 8,
    prompt:
      'When parents disagree about an important decision involving a child, what should happen?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures expectations for cooperation, expertise, experimentation, outside guidance, and mutual consent.',
    choices: buildChoices(8, [
      'Continue discussing it until both parents can support the decision',
      'Give greater influence to the parent with more knowledge or responsibility in that area',
      "Choose the option that best protects the child's wellbeing",
      'Try a temporary approach and reevaluate it together',
      'Seek professional or trusted guidance when the consequences are significant',
      "Some major parenting decisions should not move forward without both parents' agreement",
    ]),
  }),
  q({
    number: 9,
    prompt:
      'If a partner already has children, what role should a stepparent or long term partner generally have?',
    formatLabel: 'Role range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      "The appropriate role must be shaped by custody arrangements, legal authority, co parenting agreements, the child's age and needs, the child's comfort, and the seriousness and stability of the relationship.",
    alignmentPurpose:
      'Measures expectations for stepparent involvement, caregiving, authority, gradual integration, and respect for existing family structures.',
    choices: buildChoices(9, [
      'Become a fully active parent with substantial shared responsibility and appropriate authority',
      'Take an active caregiving role while major decisions remain with the legal parents',
      'Build a supportive relationship first and allow responsibility or authority to develop gradually',
      'Support the parent without taking a significant disciplinary role',
      'Maintain a caring but limited role without assuming parental authority',
    ]),
  }),
  q({
    number: 10,
    prompt:
      'Which family or parenting differences would most seriously threaten long term compatibility?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies high impact incompatibilities involving children, parenting, blended families, responsibility, and family boundaries.',
    choices: buildChoices(10, [
      'Fundamentally different desires about having children',
      'Incompatible expectations about family size',
      'Unwillingness to accept or respect existing children',
      'Major disagreement about parenting roles',
      'Major disagreement about discipline',
      'Repeatedly undermining the other parent',
      'Expecting one person to carry most parenting responsibilities',
      "Allowing extended family to override the couple's parenting decisions",
      'Refusing necessary medical, educational, or mental health support for a child',
      'Treating stepchildren or biological children unequally',
      'Ongoing conflict with a co parent that repeatedly destabilizes the household',
      'Expecting harmful family behavior to be tolerated without boundaries',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the differences you selected, which two would be most difficult for you to move past?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_06: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 6,
  title: 'Family, Children & Parenting',
  status: 'locked',
  lockedProductDecisions: CATEGORY_06_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_06_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
