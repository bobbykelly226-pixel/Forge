import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const CATEGORY_KEY = 'relationship_vision_intentions';

function buildChoices(
  questionNumber: number,
  labels: readonly string[],
  specials: Readonly<Record<number, NonNullable<QuestionDefinition['choices'][number]['specialResponseState']>>> = {}
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

/** Exact locked product decisions from Forge HQ Category 1. */
export const CATEGORY_01_LOCKED_PRODUCT_DECISIONS = [
  "Children and faith remain primarily within their Essential Profile questions and dedicated alignment categories.",
  "Q12 may identify whether those subjects require shared direction, but it does not duplicate their deeper questions.",
  "Multi-select questions are not fully ranked. Only Q5, Q12, and Q15 receive a lightweight “choose the two most important” follow-up.",
  "Genuine uncertainty remains available in Q1, but vague escape answers have otherwise been removed.",
  "Related answers must be grouped into shared scoring dimensions so repeated questions increase confidence rather than artificially multiplying their weight.",
  "Written responses are excluded because this category has no defined use for them at launch.",
  "Structured answers power alignment; follow-up priorities determine added weight.",
] as const;

export const CATEGORY_01_FORMAT_DISTRIBUTION = {
  'Single choice': [1, 3, 4, 7, 10],
  'Limited multi-select': [5, 9, 12, 15],
  'Agreement scale': [6],
  'Importance scale': [2, 11],
  'Frequency scale': [8],
  'Comfort range': [13],
  'Scenario-based choice': [14],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt: "What are you ultimately hoping a meaningful relationship will grow into?",
    formatLabel: "Single choice",
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Establishes the relationship destination someone is pursuing.",
    choices: buildChoices(1, [
      "A committed long-term partnership where marriage is not expected",
      "A committed partnership where marriage is possible",
      "A partnership intentionally moving toward marriage",
      "Marriage and building a shared life together",
      "I am still genuinely discovering what I want",
    ]),
  }),
  q({
    number: 2,
    prompt: "How important is marriage in the future you envision?",
    formatLabel: "Importance scale",
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Separates someone’s preferred relationship structure from how necessary marriage is to them.",
    choices: buildChoices(2, [
      "Not part of the future I want",
      "I could be open to it, but I do not need it",
      "I would prefer to marry",
      "Marriage is very important to me",
      "Marriage is essential to the future I want",
    ]),
  }),
  q({
    number: 3,
    prompt: "What pace do you prefer when building a new relationship?",
    formatLabel: "Single choice",
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Identifies meaningful differences between cautious, gradual, steady, and fast-moving dating styles.",
    choices: buildChoices(3, [
      "I prefer significant time before becoming emotionally invested or committed",
      "I prefer a slow, intentional progression toward commitment",
      "I prefer steady progress when mutual interest is clear",
      "I am comfortable progressing quickly when intentions and connection align",
      "I prefer to adapt the pace to the connection rather than follow a general progression",
    ]),
  }),
  q({
    number: 4,
    prompt: "Which approach to exclusivity most closely reflects what you want?",
    formatLabel: "Single choice",
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Captures expectations that can otherwise create early confusion or hurt.",
    choices: buildChoices(4, [
      "I prefer exclusivity once we decide to date intentionally",
      "I prefer discussing exclusivity relatively early, once mutual interest is established",
      "I prefer several dates and deeper conversation before discussing exclusivity",
      "I prefer an extended period of nonexclusive dating before deciding",
      "I do not expect exclusivity unless both people explicitly agree to it",
    ]),
  }),
  q({
    number: 5,
    prompt: "Which qualities most strongly define commitment for you?",
    formatLabel: "Select up to four",
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose: "Identifies both someone’s broader definition of commitment and its most important components.",
    choices: buildChoices(5, [
      "Exclusivity",
      "Emotional availability",
      "Consistent communication",
      "Reliability and follow-through",
      "Shared effort",
      "Working through difficulties together",
      "Making decisions with each other in mind",
      "Planning for a shared future",
      "Supporting one another’s individual growth",
    ]),
    priorityFollowUp: {
      prompt: "Of the qualities you selected, which two matter most?",
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 6,
    prompt: "How much do you agree with this statement?",
    statement: "People should be honest early in dating about whether they are open to building a long-term future together.",
    formatLabel: "Agreement scale",
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Measures expectations around clarity and intentionality without requiring premature commitment.",
    choices: buildChoices(6, [
      "Strongly disagree",
      "Disagree",
      "Neither agree nor disagree",
      "Agree",
      "Strongly agree",
    ]),
  }),
  q({
    number: 7,
    prompt: "When dating someone new, how do you approach long-term compatibility?",
    formatLabel: "Single choice",
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Distinguishes present-focused dating from increasingly future-conscious approaches.",
    choices: buildChoices(7, [
      "I focus on the present and consider the future only after a strong connection develops",
      "I gradually consider long-term compatibility as the relationship develops",
      "I balance enjoying the connection with evaluating long-term compatibility",
      "I intentionally evaluate long-term compatibility from the beginning",
      "I need clarity about major long-term goals before becoming emotionally invested",
    ]),
  }),
  q({
    number: 8,
    prompt: "How frequently should partners intentionally discuss the health and direction of their relationship?",
    formatLabel: "Frequency scale",
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Compares expectations for relationship communication and reassurance.",
    choices: buildChoices(8, [
      "Only when there is a concern or major decision",
      "Occasionally, when the conversation arises naturally",
      "At important relationship milestones",
      "Regularly, as part of maintaining the relationship",
      "Very regularly through intentional relationship check-ins",
    ]),
  }),
  q({
    number: 9,
    prompt: "Which statements best describe what being ready for a committed relationship means to you personally?",
    formatLabel: "Select up to four",
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose: "Grounds readiness in observable capacity and behavior instead of idealized traits.",
    choices: buildChoices(9, [
      "I have made consistent time and space in my life for a relationship",
      "I am no longer emotionally attached to a previous relationship",
      "I can clearly communicate what I want and need",
      "I am prepared to make decisions with another person in mind",
      "I can remain engaged when a relationship becomes difficult",
      "I have enough emotional and practical stability to invest consistently",
      "I am willing to adjust established routines and priorities",
      "I am ready to be known honestly, including my imperfections",
      "I believe some readiness can develop within the right relationship",
    ]),
  }),
  q({
    number: 10,
    prompt: "Which approach to personal growth best reflects the partnership you want?",
    formatLabel: "Single choice",
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Differentiates independent, supportive, challenging, shared, and highly integrated approaches to growth.",
    choices: buildChoices(10, [
      "Each partner should pursue growth independently while respecting the other’s path",
      "Partners should maintain separate goals while actively supporting one another",
      "Partners should encourage and respectfully challenge one another to grow",
      "Partners should build shared goals while continuing to grow individually",
      "Growth should be a central purpose of the relationship, pursued intentionally together",
    ]),
  }),
  q({
    number: 11,
    prompt: "How important is it that partners share a similar overall vision for the next five to ten years?",
    formatLabel: "Importance scale",
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Measures the overall importance of shared future direction without duplicating any particular life goal.",
    choices: buildChoices(11, [
      "Not important",
      "Slightly important",
      "Moderately important",
      "Very important",
      "Essential",
    ]),
  }),
  q({
    number: 12,
    prompt: "In which areas would partners need reasonably compatible long-term direction?",
    formatLabel: "Select up to five",
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose: "Identifies concrete future directions requiring alignment while leaving detailed children, faith, money, and lifestyle matching to their respective categories.",
    choices: buildChoices(12, [
      "Whether to marry",
      "Whether or how to build a family",
      "Where and how to live",
      "Career priorities",
      "Financial goals",
      "Lifestyle and standard of living",
      "The role of faith or spiritual life",
      "Extended-family involvement",
      "Travel and major life experiences",
      "Community involvement",
      "Retirement and long-term planning",
      "I am comfortable with partners having substantially different long-term goals",
    ]),
    priorityFollowUp: {
      prompt: "Of the areas you selected, which two allow the least room for difference?",
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 13,
    prompt: "How comfortable would you be continuing to date someone whose preferred timeline for commitment is meaningfully different from yours?",
    formatLabel: "Comfort range",
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Measures how much flexibility someone genuinely has around commitment timing.",
    choices: buildChoices(13, [
      "Comfortable—I am highly flexible about timing",
      "Mostly comfortable if our ultimate intentions align",
      "Possibly comfortable if the difference is temporary or relatively small",
      "Uncomfortable—I need similar expectations for progression",
      "Not comfortable—I would consider this a fundamental incompatibility",
    ]),
  }),
  q({
    number: 14,
    prompt: "If a loving relationship revealed a major difference involving a core long-term goal, what would you most likely do first?",
    formatLabel: "Scenario-based choice",
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose: "Reveals someone’s initial approach to major incompatibility rather than asking whether they generally “believe in compromise.”",
    allowedSpecialResponseStates: ['context_dependent'],
    choices: buildChoices(
      14,
      [
        "Determine whether either of us could genuinely change without resentment",
        "Look for a compromise that preserves what matters most to both people",
        "Give the relationship more time before making a decision",
        "Seek counseling or trusted outside guidance",
        "End the relationship if the goal is truly non-negotiable",
        "My response would depend on whether the difference affects the life I fundamentally want",
      ],
      { 6: 'context_dependent' }
    ),
  }),
  q({
    number: 15,
    prompt: "Which relational foundations must be present before you would confidently choose a lasting partnership?",
    formatLabel: "Select up to five",
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose: "Identifies what someone needs within the relationship itself, without repeating marriage or future-goal alignment.",
    choices: buildChoices(15, [
      "Mutual trust",
      "Emotional safety",
      "Mutual respect",
      "Honest communication",
      "Healthy conflict repair",
      "Consistency and reliability",
      "Shared effort",
      "Affection and physical connection",
      "Acceptance of one another",
      "Support for individual growth",
      "Confidence in functioning as a team",
      "The ability to be fully authentic together",
    ]),
    priorityFollowUp: {
      prompt: "Of the foundations you selected, which two are most essential?",
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
