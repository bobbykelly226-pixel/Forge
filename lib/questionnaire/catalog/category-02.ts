import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'values_character'
);

/**
 * Locked product decisions for Category 2 after the 10 question reduction.
 * Categories 5 through 10 remain at fifteen questions until later groups.
 */
export const CATEGORY_02_LOCKED_PRODUCT_DECISIONS = [
  'Honesty when truth may hurt remains primarily in Category 10.',
  'Accountability and repair remain primarily in Categories 4 and 10.',
  'Service and contribution remain primarily in Category 9.',
  'Trust threatening behavior remains primarily in Category 10.',
  'Multiselect questions are not fully ranked. Only Q1 and Q9 receive a lightweight “choose the two most important” follow up.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_02_FORMAT_DISTRIBUTION = {
  'Single choice': [3, 4, 5, 6],
  'Limited multiselect': [1, 9, 10],
  'Comfort range': [7],
  'Scenario based choice': [2, 8],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt: 'Which principles most strongly guide the way you try to live?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      "Establishes the user's core value priorities without asking them to rank every positive quality.",
    choices: buildChoices(1, [
      'Honesty',
      'Compassion',
      'Loyalty',
      'Living consistently with my beliefs',
      'Personal responsibility',
      'Fairness',
      'Service to others',
      'Courage',
      'Humility',
      'Forgiveness',
      'Discipline',
      'Respect',
      'Generosity',
      'Keeping my word',
      'Personal growth',
    ]),
    priorityFollowUp: {
      prompt: 'Of the principles you selected, which two are most central to who you are?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 2,
    prompt:
      'If you realize you have acted against one of your own values, what are you most likely to do first?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      "Identifies the user's first instinct when confronting a personal failure: ownership, reflection, repair, correction, prevention, or guidance.",
    choices: buildChoices(2, [
      'Admit it directly and take responsibility',
      'Reflect privately so I understand why it happened',
      'Apologize to anyone affected',
      'Focus first on correcting the consequences',
      'Make a specific plan to prevent it from happening again',
      'Discuss it with someone I trust before deciding what to do',
    ]),
  }),
  q({
    number: 3,
    prompt:
      'When keeping a commitment becomes substantially harder than expected, what do you generally believe someone should do?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Distinguishes firm, contextual, relational, and flexible approaches to obligation.',
    choices: buildChoices(3, [
      'Keep the commitment unless doing so becomes genuinely impossible',
      'Make every reasonable effort before asking to change it',
      'Renegotiate it openly when circumstances materially change',
      'Prioritize the commitment according to how significantly others depend on it',
      'Reconsider it when keeping it would cause disproportionate harm',
      'Commitments should allow flexibility as people and circumstances change',
    ]),
  }),
  q({
    number: 4,
    prompt:
      'When your intentions were good but your actions still hurt someone, what matters most?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals how someone balances intent, impact, responsibility, and mutual understanding.',
    choices: buildChoices(4, [
      'My intentions should be fully considered before judging what happened',
      'My intentions matter, but I am still responsible for the effect of my actions',
      'The impact matters more than what I intended',
      'Both people should work to understand the difference between intention and impact',
      'The circumstances determine whether intention or impact should carry more weight',
    ]),
  }),
  q({
    number: 5,
    prompt:
      'When someone repeatedly makes choices you disagree with, how do you usually try to respond?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Compares support, understanding, autonomy, boundaries, distance, and principled care.',
    choices: buildChoices(5, [
      'Be honest about my concerns while continuing to support them',
      'Ask questions and try to understand their reasoning',
      'Respect their autonomy unless their choices directly affect me',
      'Establish boundaries while leaving room for the relationship',
      'Step back when the pattern conflicts deeply with my values',
      'Continue showing care without offering approval or involvement',
    ]),
  }),
  q({
    number: 6,
    prompt: 'Which approach to personal responsibility most closely reflects your beliefs?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals how someone understands agency, circumstance, support, and shared social responsibility without reducing the issue to a political label.',
    choices: buildChoices(6, [
      'People are primarily responsible for the outcomes their choices create',
      "Personal choices matter greatly, but circumstances can significantly limit someone's options",
      'Responsibility should be judged according to both choices and circumstances',
      'People should receive support while still being expected to participate in improving their situation',
      "Communities and institutions share meaningful responsibility for the conditions affecting people's lives",
    ]),
  }),
  q({
    number: 7,
    prompt:
      'How comfortable are you admitting that an important belief or judgment of yours was wrong?',
    formatLabel: 'Comfort range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures intellectual humility, openness to correction, and the emotional difficulty of changing a meaningful position.',
    choices: buildChoices(7, [
      'Very comfortable. I can change my position openly when the evidence supports it',
      'Comfortable after I have had time to reflect',
      'Somewhat comfortable, although it can be difficult',
      'Uncomfortable when the belief is closely connected to my identity or values',
      'Very uncomfortable unless I reach the conclusion entirely on my own',
    ]),
  }),
  q({
    number: 8,
    prompt:
      'When loyalty to someone conflicts with doing what you believe is right, which principle should generally come first?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Exposes meaningful differences in how someone balances loyalty, integrity, protection, confrontation, and context.',
    choices: buildChoices(8, [
      'Doing what is right should come first, even if the relationship is damaged',
      'Loyalty should remain unless serious harm or wrongdoing is involved',
      'I should confront the person privately before deciding what to do',
      'I should protect the person while refusing to support the harmful choice',
      'The relationship and the seriousness of the situation should determine my response',
      'I would seek trusted guidance before acting when both obligations are significant',
    ]),
  }),
  q({
    number: 9,
    prompt: 'Which qualities are most important in the character of a long term partner?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Captures the character traits the user prioritizes in a partner and identifies those with the greatest compatibility weight.',
    choices: buildChoices(9, [
      'Honest',
      'Loyal',
      'Compassionate',
      'Accountable',
      'Dependable',
      'Humble',
      'Generous',
      'Disciplined',
      'Courageous',
      'Forgiving',
      'Respectful',
      'Principled',
      'Emotionally mature',
      'Service minded',
      'Open to growth',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the qualities you selected, which two would allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 10,
    prompt:
      "If a partner's behavior conflicted with a value they claimed to hold, what would matter most in deciding how you viewed it?",
    formatLabel: 'Select up to three',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 3,
    alignmentPurpose:
      'Identifies how the user evaluates inconsistency between stated values and demonstrated character.',
    choices: buildChoices(10, [
      'Whether it was an isolated mistake or a repeated pattern',
      'Whether they acknowledged it honestly',
      'Whether they accepted responsibility without blaming others',
      'Whether they tried to repair the harm',
      'Whether their behavior changed afterward',
      'How serious the consequences were',
      'Whether they had knowingly concealed the behavior',
      'Whether the value involved was one I considered fundamental',
    ]),
  }),
];

export const CATEGORY_02: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 2,
  title: 'Values & Character',
  status: 'locked',
  lockedProductDecisions: CATEGORY_02_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_02_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
