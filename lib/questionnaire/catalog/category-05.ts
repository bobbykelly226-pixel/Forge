import { createCategoryBuilders } from '@/lib/questionnaire/catalog/build-category';
import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

const { buildChoices, q, categoryKey: CATEGORY_KEY } = createCategoryBuilders(
  'commitment_partnership'
);

/**
 * Locked product decisions for Category 5 after the 10 question reduction.
 * Categories 8 through 10 remain at fifteen questions until the final group.
 */
export const CATEGORY_05_LOCKED_PRODUCT_DECISIONS = [
  'Category 1 already defines commitment. This category focuses on concrete partnership behavior.',
  'Multiselect questions are not fully ranked. Only Q1 and Q8 receive a lightweight “choose the two most important” follow up.',
  'Written responses are excluded because this category has no defined use for them at launch.',
  'Structured answers power alignment; follow up priorities determine added weight.',
] as const;

export const CATEGORY_05_FORMAT_DISTRIBUTION = {
  'Single choice': [2, 7],
  'Limited multiselect': [1, 5, 8, 10],
  'Independence range': [4],
  'Support range': [9],
  'Scenario based choice': [3, 6],
  'Written response': [],
} as const;

const QUESTIONS: QuestionDefinition[] = [
  q({
    number: 1,
    prompt:
      'Once two people have agreed to an exclusive relationship, what does exclusivity generally require?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Measures expectations surrounding exclusivity without assuming every couple defines relational boundaries identically.',
    choices: buildChoices(1, [
      'No romantic or sexual involvement with anyone else',
      'No dating app activity or maintaining backup romantic options',
      'Clear boundaries with former partners',
      'Clear boundaries with people who express romantic interest',
      'Transparency about interactions that could reasonably affect trust',
      'Avoiding emotionally intimate relationships that compete with the partnership',
      'Discussing boundaries together rather than relying on assumptions',
      'Respecting the relationship in both private and public settings',
      'Exclusivity should be defined by the couple rather than assumed',
    ]),
    priorityFollowUp: {
      prompt:
        'Of the expectations you selected, which two allow the least room for compromise?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 2,
    prompt: 'How should responsibilities generally be divided within a long term relationship?',
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      "Identifies how someone understands fairness, roles, flexibility, and shared contribution.",
    choices: buildChoices(2, [
      'As equally as possible across most areas',
      "According to each person's strengths and abilities",
      'According to available time, energy, and current circumstances',
      'Through clearly defined roles that both people accept',
      'Flexibly, with each person stepping in wherever needed',
      'The division matters less than both people believing it is fair',
    ]),
  }),
  q({
    number: 3,
    prompt:
      'When one partner is carrying significantly more responsibility for a period of time, what should happen?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Reveals expectations for initiative, communication, flexibility, and accountability during unequal seasons.',
    choices: buildChoices(3, [
      'The other partner should take on as much as possible without needing to be asked',
      'The couple should openly redistribute responsibilities until circumstances improve',
      'The partner carrying more should clearly explain what support they need',
      'Temporary imbalance is acceptable when both people understand why it is happening',
      "The couple should protect each person's essential responsibilities and reduce less important demands",
      'The arrangement should be reviewed regularly so temporary imbalance does not become permanent',
    ]),
  }),
  q({
    number: 4,
    prompt:
      'How much independence should each person maintain within a committed relationship?',
    formatLabel: 'Independence range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures compatibility around togetherness, autonomy, and the degree to which two lives become integrated.',
    choices: buildChoices(4, [
      'Very little. Most free time, plans, and major interests should be shared',
      'Some independence, while the relationship remains the clear center of everyday life',
      'A balance of shared life and separate friendships, interests, and time',
      'Substantial independence, provided commitment and communication remain strong',
      'A high degree of independence. Each person should retain a largely self directed life',
    ]),
  }),
  q({
    number: 5,
    prompt: 'Which areas should partners generally discuss before making a decision?',
    formatLabel: 'Select up to five',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 5,
    alignmentPurpose:
      'Identifies where someone draws the line between personal autonomy and shared decision making.',
    choices: buildChoices(5, [
      'Major purchases or financial commitments',
      'Career changes',
      'Relocation or major housing decisions',
      'Plans that significantly affect shared time',
      'Commitments involving children or family',
      'Decisions affecting health or caregiving',
      'Major travel or extended time away',
      'Changes to shared responsibilities',
      'Significant interactions with former partners',
      'Personal decisions only when they directly affect the relationship',
    ]),
  }),
  q({
    number: 6,
    prompt:
      'When partners strongly disagree about a major decision affecting both people, how should the final decision be made?',
    formatLabel: 'Scenario based choice',
    responseBehavior: 'scenario_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      'Measures expectations for mutual consent, influence, compromise, delay, and outside guidance in consequential decisions.',
    choices: buildChoices(6, [
      'Continue discussing it until both people can genuinely agree',
      'Find the option that requires the most balanced compromise',
      'Give greater influence to the person who will be most affected',
      "Choose the option that best protects the relationship's shared future",
      'Delay the decision when possible rather than forcing agreement',
      'Seek trusted or professional guidance when the consequences are significant',
      "Some major decisions should not move forward without both partners' consent",
    ]),
  }),
  q({
    number: 7,
    prompt:
      "If one partner receives a major opportunity that would significantly disrupt the other person's life, what should matter most?",
    formatLabel: 'Single choice',
    responseBehavior: 'single_choice',
    minSelections: 1,
    maxSelections: 1,
    alignmentPurpose:
      "Examines how someone balances ambition, sacrifice, fairness, consent, and the relationship's future.",
    choices: buildChoices(7, [
      "Whether the opportunity supports the couple's shared future",
      'Whether a comparable opportunity is likely to come again',
      'How much disruption or sacrifice the other partner would experience',
      'Whether both people can continue pursuing meaningful personal goals',
      "Whether the relationship has previously prioritized one partner's ambitions",
      'Whether the couple can create a plan that makes the sacrifice temporary',
      'No major opportunity should be accepted unless both partners genuinely agree',
    ]),
  }),
  q({
    number: 8,
    prompt: 'What does reliability from a long term partner mean most to you?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Identifies the specific forms of dependability through which someone develops trust in a partnership.',
    choices: buildChoices(8, [
      'Following through on promises',
      'Being present during difficult periods',
      'Handling agreed upon responsibilities without repeated reminders',
      'Communicating promptly when plans must change',
      'Making decisions consistently rather than unpredictably',
      'Protecting information shared in confidence',
      'Being financially responsible for agreed upon obligations',
      'Defending and respecting the relationship around other people',
      'Remaining emotionally engaged when life becomes stressful',
      'Asking for help before responsibilities are neglected',
    ]),
    priorityFollowUp: {
      prompt: 'Of the qualities you selected, which two matter most?',
      selectionCount: 2,
      unordered: true,
    },
  }),
  q({
    number: 9,
    prompt:
      'When one partner needs substantial emotional or practical support, what level of responsibility should the other partner generally assume?',
    formatLabel: 'Support range',
    responseBehavior: 'scale_range',
    minSelections: 1,
    maxSelections: 1,
    contextNote:
      'The appropriate amount of support may change according to the seriousness, duration, and effect of the situation on both people and the relationship.',
    alignmentPurpose:
      'Measures expectations for caregiving and partnership support without suggesting that commitment requires unlimited capacity or professional level care.',
    choices: buildChoices(9, [
      'Provide as much support as they reasonably can, even when it requires significant temporary sacrifice',
      'Provide substantial support while remaining honest about their own limits',
      'Provide meaningful support while also involving family, friends, or professionals when appropriate',
      "Provide support without becoming primarily responsible for managing the other person's needs",
      'Maintain more limited involvement because each person should remain primarily responsible for managing their own needs',
    ]),
  }),
  q({
    number: 10,
    prompt:
      'If a committed relationship becomes difficult for an extended period, what should determine whether the couple continues working on it?',
    formatLabel: 'Select up to four',
    responseBehavior: 'multi_select',
    minSelections: 1,
    maxSelections: 4,
    alignmentPurpose:
      'Identifies how someone balances perseverance, progress, compatibility, safety, and personal boundaries when commitment is tested.',
    choices: buildChoices(10, [
      'Whether both people still want the relationship',
      'Whether both people are making a genuine effort',
      'Whether meaningful progress is occurring',
      'Whether trust can realistically be repaired',
      'Whether the core problem is temporary or likely to remain',
      'Whether essential values and future goals remain compatible',
      'Whether the relationship remains emotionally and physically safe',
      'Whether professional support could help',
      'Whether staying requires one person to abandon essential needs or boundaries',
      'The commitments and responsibilities the couple has already built together',
    ]),
  }),
];

export const CATEGORY_05: CategoryDefinition = {
  id: CATEGORY_KEY,
  number: 5,
  title: 'Commitment & Partnership',
  status: 'locked',
  lockedProductDecisions: CATEGORY_05_LOCKED_PRODUCT_DECISIONS,
  formatDistribution: CATEGORY_05_FORMAT_DISTRIBUTION,
  questions: QUESTIONS,
};
