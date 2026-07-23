import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const CATEGORY_KEY = 'relationship_vision_intentions';

function buildChoices(
  questionNumber: number,
  labels: readonly string[],
  specials: Readonly<
    Record<
      number,
      NonNullable<QuestionDefinition['choices'][number]['specialResponseState']>
    >
  > = {}
) {
  const qid = `${CATEGORY_KEY}_q${String(questionNumber).padStart(2, '0')}`;
  return labels.map((label, index) => {
    const displayOrder = index + 1;
    const specialResponseState = specials[displayOrder];
    return {
      id: `${qid}_c${String(displayOrder).padStart(2, '0')}`,
      label,
      displayOrder,
      ...(specialResponseState ? { specialResponseState } : {}),
    };
  });
}

function q(
  def: Omit<QuestionDefinition, 'id' | 'choices'> & { choices: QuestionDefinition['choices'] }
): QuestionDefinition {
  return { ...def, id: `${CATEGORY_KEY}_q${String(def.number).padStart(2, '0')}` };
}

/**
 * Locked product decisions for Category 1 after the 10 question reduction.
 * Broader Compatibility Profile target is approximately 100 questions; only
 * Category 1 is reduced in this slice.
 */
export const CATEGORY_01_LOCKED_PRODUCT_DECISIONS = [
  'Children and faith remain primarily within their Essential Profile questions and dedicated alignment categories.',
  'Q8 may identify whether those subjects require shared direction, but it does not duplicate their deeper questions.',
  'Multiselect questions are not fully ranked. Only Q5, Q8, and Q10 receive a lightweight “choose the two most important” follow up.',
  'Genuine uncertainty remains available in Q1, but vague escape answers have otherwise been removed.',
  'Related answers must be grouped into shared scoring dimensions so repeated questions increase confidence rather than artificially multiplying their weight.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_01_FORMAT_DISTRIBUTION = {
  'Single choice': [1, 3, 4, 7],
  'Limited multiselect': [5, 6, 8, 10],
  'Importance scale': [2],
  'Scenario based choice': [9],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt: 'What are you ultimately hoping a meaningful relationship will grow into?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: 'Establishes the relationship destination someone is pursuing.',
    choices: buildChoices(1, [
      'A committed long term partnership where marriage is not expected',
      'A committed partnership where marriage is possible',
      'A partnership intentionally moving toward marriage',
      'Marriage and building a shared life together',
      'I am still genuinely discovering what I want',
    ]),
  }),
  q({
    number: 2,
    prompt: 'How important is marriage in the future you envision?',
    formatLabel: 'Importance scale',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Separates someone’s preferred relationship structure from how necessary marriage is to them.',
    choices: buildChoices(2, [
      'Not part of the future I want',
      'I could be open to it, but I do not need it',
      'I would prefer to marry',
      'Marriage is very important to me',
      'Marriage is essential to the future I want',
    ]),
  }),
  q({
    number: 3,
    prompt: 'What pace do you prefer when building a new relationship?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Identifies meaningful differences between cautious, gradual, steady, and fast moving dating styles.',
    choices: buildChoices(3, [
      'I prefer significant time before becoming emotionally invested or committed',
      'I prefer a slow, intentional progression toward commitment',
      'I prefer steady progress when mutual interest is clear',
      'I am comfortable progressing quickly when intentions and connection align',
      'I prefer to adapt the pace to the connection rather than follow a general progression',
    ]),
  }),
  q({
    number: 4,
    prompt: 'Which approach to exclusivity most closely reflects what you want?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Captures expectations that can otherwise create early confusion or hurt.',
    choices: buildChoices(4, [
      'I prefer exclusivity once we decide to date intentionally',
      'I prefer discussing exclusivity relatively early, once mutual interest is established',
      'I prefer several dates and deeper conversation before discussing exclusivity',
      'I prefer an extended period of nonexclusive dating before deciding',
      'I do not expect exclusivity unless both people explicitly agree to it',
    ]),
  }),
  q({
    number: 5,
    prompt: 'Which qualities most strongly define commitment for you?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Identifies both someone’s broader definition of commitment and its most important components.',
    choices: buildChoices(5, [
      'Exclusivity',
      'Emotional availability',
      'Consistent communication',
      'Reliability and follow through',
      'Shared effort',
      'Working through difficulties together',
      'Making decisions with each other in mind',
      'Planning for a shared future',
      'Supporting one another’s individual growth',
    ]),
    priorityFollowUp: {
      prompt: 'Of the qualities you selected, which two matter most?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 6,
    prompt:
      'Which statements best describe what being ready for a committed relationship means to you personally?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Grounds readiness in observable capacity and behavior instead of idealized traits.',
    choices: buildChoices(6, [
      'I have made consistent time and space in my life for a relationship',
      'I am no longer emotionally attached to a previous relationship',
      'I can clearly communicate what I want and need',
      'I am prepared to make decisions with another person in mind',
      'I can remain engaged when a relationship becomes difficult',
      'I have enough emotional and practical stability to invest consistently',
      'I am willing to adjust established routines and priorities',
      'I am ready to be known honestly, including my imperfections',
      'I believe some readiness can develop within the right relationship',
    ]),
  }),
  q({
    number: 7,
    prompt: 'Which approach to personal growth best reflects the partnership you want?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Differentiates independent, supportive, challenging, shared, and highly integrated approaches to growth.',
    choices: buildChoices(7, [
      'Each partner should pursue growth independently while respecting the other’s path',
      'Partners should maintain separate goals while actively supporting one another',
      'Partners should encourage and respectfully challenge one another to grow',
      'Partners should build shared goals while continuing to grow individually',
      'Growth should be a central purpose of the relationship, pursued intentionally together',
    ]),
  }),
  q({
    number: 8,
    prompt:
      'In which areas would partners need reasonably compatible long term direction?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies concrete future directions requiring alignment while leaving detailed children, faith, money, and lifestyle matching to their respective categories.',
    choices: buildChoices(8, [
      'Whether to marry',
      'Whether or how to build a family',
      'Where and how to live',
      'Career priorities',
      'Financial goals',
      'Lifestyle and standard of living',
      'The role of faith or spiritual life',
      'Extended family involvement',
      'Travel and major life experiences',
      'Community involvement',
      'Retirement and long term planning',
      'I am comfortable with partners having substantially different long term goals',
    ]),
    priorityFollowUp: {
      prompt: 'Of the areas you selected, which two allow the least room for difference?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 9,
    prompt:
      'If a loving relationship revealed a major difference involving a core long term goal, what would you most likely do first?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals someone’s initial approach to major incompatibility rather than asking whether they generally believe in compromise.',
    allowedSpecialResponseStates: ['context_dependent'],
    choices: buildChoices(
      9,
      [
        'Determine whether either of us could genuinely change without resentment',
        'Look for a compromise that preserves what matters most to both people',
        'Give the relationship more time before making a decision',
        'Seek counseling or trusted outside guidance',
        'End the relationship if the goal is truly nonnegotiable',
        'My response would depend on whether the difference affects the life I fundamentally want',
      ],
      { 6: 'context_dependent' }
    ),
  }),
  q({
    number: 10,
    prompt:
      'Which relational foundations must be present before you would confidently choose a lasting partnership?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies what someone needs within the relationship itself, without repeating marriage or future goal alignment.',
    choices: buildChoices(10, [
      'Mutual trust',
      'Emotional safety',
      'Mutual respect',
      'Honest communication',
      'Healthy conflict repair',
      'Consistency and reliability',
      'Shared effort',
      'Affection and physical connection',
      'Acceptance of one another',
      'Support for individual growth',
      'Confidence in functioning as a team',
      'The ability to be fully authentic together',
    ]),
    priorityFollowUp: {
      prompt: 'Of the foundations you selected, which two are most essential?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_01: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 1,
  title: 'Relationship Vision & Intentions',
  status: 'locked',
  lockedProductDecisions: CATEGORY_01_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_01_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
