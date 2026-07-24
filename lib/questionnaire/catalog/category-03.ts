import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'communication_emotional_connection'
);

/**
 * Locked product decisions for Category 3 after the 10 question reduction.
 * Categories 5 through 10 remain at fifteen questions until later groups.
 */
export const CATEGORY_03_LOCKED_PRODUCT_DECISIONS = [
  'Pauses and reconnection during difficult conversations remain primarily in Category 4.',
  'Privacy and disclosure boundaries remain primarily in Category 10.',
  'Destructive conflict and trust patterns remain primarily in Categories 4 and 10.',
  'Multiselect questions are not fully ranked. Only Q3 and Q10 receive a lightweight “choose the two most important” follow up.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_03_FORMAT_DISTRIBUTION = {
  'Single choice': [1, 4, 8],
  'Limited multiselect': [3, 7, 10],
  'Directness scale': [2],
  'Frequency range': [5],
  'Comfort range': [6],
  'Scenario based choice': [9],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt:
      'When something important is bothering you in a relationship, how do you usually prefer to address it?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Identifies whether someone initiates concerns immediately, after reflection, under the right conditions, through invitation, or only when necessary.',
    choices: buildChoices(1, [
      'I prefer to discuss it as soon as possible',
      'I prefer a little time to organize my thoughts before discussing it',
      'I prefer to wait until both people are calm and available',
      'I usually need the other person to invite the conversation',
      'I prefer to process it privately unless it continues affecting the relationship',
    ]),
  }),
  q({
    number: 2,
    prompt:
      'How directly do you prefer a partner to communicate difficult feelings or concerns?',
    formatLabel: 'Directness scale',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures compatibility around candor, emotional sensitivity, and communication intensity.',
    choices: buildChoices(2, [
      'Very gently and indirectly',
      'Gently, with attention to how the message may be received',
      'Clearly, with a balance of honesty and sensitivity',
      'Directly, even when the conversation may feel uncomfortable',
      'Very directly. I would rather hear the unfiltered truth',
    ]),
  }),
  q({
    number: 3,
    prompt: 'During an important conversation, what helps you feel most heard?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Identifies the specific behaviors through which someone experiences listening, care, and understanding.',
    choices: buildChoices(3, [
      "Receiving the other person's full attention",
      'Being allowed to finish before receiving a response',
      'Having my feelings acknowledged',
      'Hearing questions that show genuine curiosity',
      'Knowing the other person understands my perspective',
      'Receiving empathy before advice or solutions',
      'Seeing that the conversation leads to meaningful action',
      'Having enough time to explain myself fully',
      'Maintaining a calm and respectful tone',
      'Knowing the conversation will remain private',
    ]),
    priorityFollowUp: {
      prompt: 'Of the needs you selected, which two matter most?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 4,
    prompt: 'When a partner shares a problem, what is your usual first instinct?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Differentiates emotional listening, curiosity, problem solving, action, and preference checking.',
    choices: buildChoices(4, [
      'Listen without trying to change or solve anything',
      'Acknowledge how they feel and offer emotional support',
      'Ask questions to better understand what happened',
      'Help them think through possible solutions',
      'Take practical action if there is something I can do',
      'Ask whether they want listening, advice, or help',
    ]),
  }),
  q({
    number: 5,
    prompt:
      'How much ongoing communication do you prefer when you and a partner are apart during a typical day?',
    formatLabel: 'Frequency range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Captures differences in desired contact without treating either independence or frequent communication as healthier.',
    choices: buildChoices(5, [
      'Minimal communication unless something needs attention',
      'One or two meaningful check ins',
      'Occasional messages throughout the day',
      'Frequent communication whenever time allows',
      'Very frequent contact so we remain closely connected',
    ]),
  }),
  q({
    number: 6,
    prompt:
      'How comfortable are you expressing vulnerable emotions to a romantic partner?',
    formatLabel: 'Comfort range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures emotional openness without assuming immediate vulnerability is appropriate for everyone.',
    choices: buildChoices(6, [
      'Very comfortable. I usually express them openly',
      'Comfortable once trust and safety are established',
      'Somewhat comfortable, although I may need encouragement',
      'Uncomfortable unless the situation makes it necessary',
      'Very uncomfortable. I strongly prefer processing vulnerable emotions privately',
    ]),
  }),
  q({
    number: 7,
    prompt:
      'Which emotional experiences are most important for you to be able to share with a partner?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies the scope of emotional intimacy someone wants within a partnership.',
    choices: buildChoices(7, [
      'Fear or uncertainty',
      'Sadness or disappointment',
      'Stress and feeling overwhelmed',
      'Insecurity or self doubt',
      'Hopes and ambitions',
      'Joy and excitement',
      'Past experiences that still affect me',
      'Concerns about the relationship',
      'Spiritual or deeply personal reflections',
      'Affection, gratitude, and appreciation',
      'I prefer to process most emotions independently',
    ]),
  }),
  q({
    number: 8,
    prompt:
      'When you are upset, what kind of response from a partner is usually most helpful?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals differences in emotional support needs during moments of distress.',
    choices: buildChoices(8, [
      'Give me space until I am ready to talk',
      'Stay nearby without pressuring me to speak',
      'Reassure me that we are okay before discussing the issue',
      'Listen and acknowledge how I feel',
      'Ask questions and help me understand what I am experiencing',
      'Help me determine what can be done next',
    ]),
  }),
  q({
    number: 9,
    prompt:
      'If you and a partner interpret the same conversation very differently, what should happen first?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Identifies whether someone first seeks factual clarity, mutual understanding, emotional repair, underlying causes, reassurance, or reflection.',
    choices: buildChoices(9, [
      'Clarify the facts and what was actually said',
      'Allow each person to explain how they experienced the conversation',
      'Focus on the effect the misunderstanding had on the relationship',
      'Identify the assumption that caused the misunderstanding',
      'Reassure one another before trying to resolve the disagreement',
      'Take time apart and revisit the conversation with a clearer perspective',
    ]),
  }),
  q({
    number: 10,
    prompt: 'Which communication behaviors are most important in a long term partner?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies the communication qualities someone most needs from a partner.',
    choices: buildChoices(10, [
      'Communicates honestly',
      'Speaks respectfully during difficult conversations',
      'Listens without immediately becoming defensive',
      'Expresses feelings openly',
      'Communicates needs clearly',
      'Asks questions rather than making assumptions',
      'Follows through after important conversations',
      'Provides reassurance and affection',
      'Respects requests for processing time',
      'Initiates meaningful conversations',
      'Addresses concerns rather than avoiding them',
      'Can talk about both everyday life and deeper subjects',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the behaviors you selected, which two allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
];

export const CATEGORY_03: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 3,
  title: 'Communication & Emotional Connection',
  status: 'locked',
  lockedProductDecisions: CATEGORY_03_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_03_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
